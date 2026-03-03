import { createAccount, type Account, type AccountType } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  AccountRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
} from "../ports.js";
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

  const outboxOpId = dependencies.ids.nextId();
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
