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

export interface BulkDeleteTransactionsInput {
  transactionIds: string[];
}

export interface BulkDeleteTransactionsDependencies {
  transactions: TransactionRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

export interface BulkDeleteTransactionsResult {
  transactions: Transaction[];
  outboxOpIds: string[];
}

export const bulkDeleteTransactions = async (
  dependencies: BulkDeleteTransactionsDependencies,
  input: BulkDeleteTransactionsInput,
): Promise<BulkDeleteTransactionsResult> => {
  const transactionIds = normalizeTransactionIds(input.transactionIds);

  const transactions = await Promise.all(
    transactionIds.map(async (transactionId) => {
      const transaction = await dependencies.transactions.findById(transactionId);

      if (!transaction) {
        throw new ApplicationError(`Transaction ${transactionId} does not exist.`);
      }

      if (transaction.deletedAt) {
        throw new ApplicationError(`Transaction ${transactionId} is already deleted.`);
      }

      return transaction;
    }),
  );

  const now = dependencies.clock.now();
  const deletedTransactions = transactions.map((transaction) => {
    const deletedAt = now < transaction.updatedAt ? transaction.updatedAt : now;

    return {
      ...transaction,
      updatedAt: deletedAt,
      deletedAt,
    };
  });

  const outboxOps = deletedTransactions.map((transaction) => {
    const outboxOpId = dependencies.ids.nextId("outbox-op");
    const outboxOperation: OutboxOp = {
      opId: outboxOpId,
      deviceId: dependencies.deviceId,
      entityType: "transaction",
      entityId: transaction.id,
      opType: "delete",
      ...(transaction.version !== null ? { baseVersion: transaction.version } : {}),
      payload: toTransactionOutboxPayload(transaction),
      createdAt: transaction.updatedAt,
      status: "pending",
      attemptCount: 0,
    };

    return outboxOperation;
  });

  for (const transaction of deletedTransactions) {
    await dependencies.transactions.save(transaction);
  }

  for (const outboxOperation of outboxOps) {
    await dependencies.outbox.append(outboxOperation);
  }

  return {
    transactions: deletedTransactions,
    outboxOpIds: outboxOps.map((operation) => operation.opId),
  };
};

const normalizeTransactionIds = (transactionIds: string[]): string[] => {
  const normalizedIds = transactionIds
    .map((transactionId) => transactionId.trim())
    .filter((transactionId) => transactionId.length > 0);
  const uniqueIds = [...new Set(normalizedIds)];

  if (uniqueIds.length === 0) {
    throw new ApplicationError("At least one transaction id is required.");
  }

  return uniqueIds;
};
