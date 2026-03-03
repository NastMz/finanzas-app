import type { Account } from "@finanzas/domain";

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
 * Input required to tombstone an account.
 */
export interface DeleteAccountInput {
  accountId: string;
}

/**
 * Runtime dependencies required by `deleteAccount`.
 */
export interface DeleteAccountDependencies {
  accounts: AccountRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `deleteAccount` execution.
 */
export interface DeleteAccountResult {
  account: Account;
  outboxOpId: string;
}

/**
 * Applies a local tombstone to an account and appends a pending delete
 * operation to the outbox for remote propagation.
 */
export const deleteAccount = async (
  dependencies: DeleteAccountDependencies,
  input: DeleteAccountInput,
): Promise<DeleteAccountResult> => {
  const account = await dependencies.accounts.findById(input.accountId);

  if (!account) {
    throw new ApplicationError(`Account ${input.accountId} does not exist.`);
  }

  if (account.deletedAt) {
    throw new ApplicationError(`Account ${input.accountId} is already deleted.`);
  }

  const now = dependencies.clock.now();
  const deletedAt = now < account.updatedAt ? account.updatedAt : now;

  const deletedAccount: Account = {
    ...account,
    updatedAt: deletedAt,
    deletedAt,
  };

  await dependencies.accounts.save(deletedAccount);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "account",
    entityId: deletedAccount.id,
    opType: "delete",
    ...(deletedAccount.version !== null
      ? { baseVersion: deletedAccount.version }
      : {}),
    payload: toAccountOutboxPayload(deletedAccount),
    createdAt: deletedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    account: deletedAccount,
    outboxOpId,
  };
};
