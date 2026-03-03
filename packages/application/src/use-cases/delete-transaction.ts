import type { Transaction } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  TransactionRepository,
} from "../ports.js";
import { toTransactionOutboxPayload } from "./shared/transaction-outbox-payload.js";

/**
 * Input required to tombstone a transaction.
 */
export interface DeleteTransactionInput {
  transactionId: string;
}

/**
 * Runtime dependencies required by `deleteTransaction`.
 */
export interface DeleteTransactionDependencies {
  transactions: TransactionRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `deleteTransaction` execution.
 */
export interface DeleteTransactionResult {
  transaction: Transaction;
  outboxOpId: string;
}

/**
 * Applies a local tombstone to a transaction and appends a pending delete
 * operation to the outbox for remote propagation.
 */
export const deleteTransaction = async (
  dependencies: DeleteTransactionDependencies,
  input: DeleteTransactionInput,
): Promise<DeleteTransactionResult> => {
  const transaction = await dependencies.transactions.findById(input.transactionId);

  if (!transaction) {
    throw new ApplicationError(`Transaction ${input.transactionId} does not exist.`);
  }

  if (transaction.deletedAt) {
    throw new ApplicationError(`Transaction ${input.transactionId} is already deleted.`);
  }

  const now = dependencies.clock.now();
  const deletedAt = now < transaction.updatedAt ? transaction.updatedAt : now;

  const deletedTransaction: Transaction = {
    ...transaction,
    updatedAt: deletedAt,
    deletedAt,
  };

  await dependencies.transactions.save(deletedTransaction);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction",
    entityId: deletedTransaction.id,
    opType: "delete",
    ...(deletedTransaction.version !== null
      ? { baseVersion: deletedTransaction.version }
      : {}),
    payload: toTransactionOutboxPayload(deletedTransaction),
    createdAt: deletedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    transaction: deletedTransaction,
    outboxOpId,
  };
};
