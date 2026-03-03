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
 * Input required to create an account and enqueue its sync operation.
 */
export interface AddAccountInput {
  name: string;
  type: AccountType;
  currency: string;
}

/**
 * Runtime dependencies required by `addAccount`.
 */
export interface AddAccountDependencies {
  accounts: AccountRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `addAccount` execution.
 */
export interface AddAccountResult {
  account: Account;
  outboxOpId: string;
}

/**
 * Creates a new local account and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const addAccount = async (
  dependencies: AddAccountDependencies,
  input: AddAccountInput,
): Promise<AddAccountResult> => {
  const now = dependencies.clock.now();
  const accountId = dependencies.ids.nextId("account");
  const existingAccount = await dependencies.accounts.findById(accountId);

  if (existingAccount) {
    throw new ApplicationError(`Account ${accountId} already exists.`);
  }

  const account = createAccount({
    id: accountId,
    name: input.name,
    type: input.type,
    currency: input.currency,
    createdAt: now,
    updatedAt: now,
  });

  await dependencies.accounts.save(account);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "account",
    entityId: account.id,
    opType: "create",
    payload: toAccountOutboxPayload(account),
    createdAt: now,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    account,
    outboxOpId,
  };
};
