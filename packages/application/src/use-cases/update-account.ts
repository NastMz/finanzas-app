import { createAccount, type Account, type AccountType } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  AccountRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  TransactionRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import {
  assertTransactionTemplatesMatchAccountCurrency,
  assertTransactionsMatchAccountCurrency,
} from "./shared/account-currency-consistency.js";
import { toAccountOutboxPayload } from "./shared/account-outbox-payload.js";

/**
 * Input required to update an account and enqueue its sync operation.
 */
export interface UpdateAccountInput {
  accountId: string;
  name?: string;
  type?: AccountType;
  currency?: string;
}

/**
 * Runtime dependencies required by `updateAccount`.
 */
export interface UpdateAccountDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  templates: TransactionTemplateRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `updateAccount` execution.
 */
export interface UpdateAccountResult {
  account: Account;
  outboxOpId: string;
}

/**
 * Updates a local account and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const updateAccount = async (
  dependencies: UpdateAccountDependencies,
  input: UpdateAccountInput,
): Promise<UpdateAccountResult> => {
  const account = await dependencies.accounts.findById(input.accountId);

  if (!account) {
    throw new ApplicationError(`Account ${input.accountId} does not exist.`);
  }

  if (account.deletedAt) {
    throw new ApplicationError(`Account ${input.accountId} is already deleted.`);
  }

  const hasFieldsToUpdate =
    input.name !== undefined || input.type !== undefined || input.currency !== undefined;

  if (!hasFieldsToUpdate) {
    throw new ApplicationError("At least one account field must be provided to update.");
  }

  if (isCurrencyChanging(account.currency, input.currency)) {
    const accountTransactions = await dependencies.transactions.listByAccountId(account.id);

    if (accountTransactions.length > 0) {
      assertTransactionsMatchAccountCurrency(account, accountTransactions);
      throw new ApplicationError(
        `Account ${account.id} currency cannot be changed while it has transaction history.`,
      );
    }

    const accountTemplates = (await dependencies.templates.listAll()).filter(
      (template) => template.accountId === account.id,
    );

    if (accountTemplates.length > 0) {
      assertTransactionTemplatesMatchAccountCurrency(account, accountTemplates);
      throw new ApplicationError(
        `Account ${account.id} currency cannot be changed while it has transaction templates.`,
      );
    }
  }

  const now = dependencies.clock.now();
  const updatedAt = now < account.updatedAt ? account.updatedAt : now;

  const updatedAccountBase = createAccount({
    id: account.id,
    name: input.name ?? account.name,
    type: input.type ?? account.type,
    currency: input.currency ?? account.currency,
    createdAt: account.createdAt,
    updatedAt,
  });

  const updatedAccount: Account = {
    ...updatedAccountBase,
    deletedAt: account.deletedAt,
    version: account.version,
  };

  await dependencies.accounts.save(updatedAccount);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "account",
    entityId: updatedAccount.id,
    opType: "update",
    ...(updatedAccount.version !== null
      ? { baseVersion: updatedAccount.version }
      : {}),
    payload: toAccountOutboxPayload(updatedAccount),
    createdAt: updatedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    account: updatedAccount,
    outboxOpId,
  };
};

const isCurrencyChanging = (
  currentCurrency: string,
  nextCurrency: string | undefined,
): boolean =>
  nextCurrency !== undefined &&
  nextCurrency.trim().toUpperCase() !== currentCurrency;
