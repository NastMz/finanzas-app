import type { Transaction } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  TransactionRepository,
} from "../ports.js";

export interface DeleteTransactionInput {
  transactionId: string;
}

export interface DeleteTransactionDependencies {
  transactions: TransactionRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

export interface DeleteTransactionResult {
  transaction: Transaction;
  outboxOpId: string;
}

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

  const outboxOpId = dependencies.ids.nextId();
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction",
    entityId: deletedTransaction.id,
    opType: "delete",
    ...(deletedTransaction.version !== null
      ? { baseVersion: deletedTransaction.version }
      : {}),
    payload: toOutboxPayload(deletedTransaction),
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

const toOutboxPayload = (transaction: Transaction): Record<string, unknown> => ({
  id: transaction.id,
  accountId: transaction.accountId,
  amountMinor: transaction.amount.amountMinor.toString(),
  currency: transaction.amount.currency,
  date: transaction.date.toISOString(),
  categoryId: transaction.categoryId,
  note: transaction.note,
  tags: transaction.tags,
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
  deletedAt: transaction.deletedAt ? transaction.deletedAt.toISOString() : null,
});
