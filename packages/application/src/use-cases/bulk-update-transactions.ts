import { createTransaction, type Transaction } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  AccountRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  TransactionRepository,
} from "../ports.js";
import { toTransactionOutboxPayload } from "./shared/transaction-outbox-payload.js";

export interface BulkUpdateTransactionsInput {
  transactionIds: string[];
  categoryId?: string;
  note?: string;
  tags?: string[];
}

export interface BulkUpdateTransactionsDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

export interface BulkUpdateTransactionsResult {
  transactions: Transaction[];
  outboxOpIds: string[];
}

export const bulkUpdateTransactions = async (
  dependencies: BulkUpdateTransactionsDependencies,
  input: BulkUpdateTransactionsInput,
): Promise<BulkUpdateTransactionsResult> => {
  const transactionIds = normalizeTransactionIds(input.transactionIds);

  if (
    input.categoryId === undefined &&
    input.note === undefined &&
    input.tags === undefined
  ) {
    throw new ApplicationError(
      "At least one bulk transaction field must be provided to update.",
    );
  }

  const loadedTransactions = await Promise.all(
    transactionIds.map(async (transactionId) => {
      const transaction = await dependencies.transactions.findById(transactionId);

      if (!transaction) {
        throw new ApplicationError(`Transaction ${transactionId} does not exist.`);
      }

      if (transaction.deletedAt) {
        throw new ApplicationError(`Transaction ${transactionId} is already deleted.`);
      }

      const account = await dependencies.accounts.findById(transaction.accountId);

      if (!account) {
        throw new ApplicationError(
          `Account ${transaction.accountId} does not exist for transaction ${transaction.id}.`,
        );
      }

      return {
        transaction,
        account,
      };
    }),
  );

  const now = dependencies.clock.now();
  const updatedTransactions = loadedTransactions.map(({ transaction, account }) => {
    const updatedAt = now < transaction.updatedAt ? transaction.updatedAt : now;

    return {
      ...createTransaction(
        {
          id: transaction.id,
          accountId: transaction.accountId,
          amount: transaction.amount,
          date: transaction.date,
          categoryId: input.categoryId ?? transaction.categoryId,
          ...(input.note !== undefined
            ? { note: input.note }
            : transaction.note !== null
              ? { note: transaction.note }
              : {}),
          ...(input.tags !== undefined ? { tags: input.tags } : { tags: transaction.tags }),
          createdAt: transaction.createdAt,
          updatedAt,
        },
        account,
      ),
      deletedAt: transaction.deletedAt,
      version: transaction.version,
    };
  });

  const outboxOps = updatedTransactions.map((transaction) => {
    const outboxOpId = dependencies.ids.nextId("outbox-op");
    const outboxOperation: OutboxOp = {
      opId: outboxOpId,
      deviceId: dependencies.deviceId,
      entityType: "transaction",
      entityId: transaction.id,
      opType: "update",
      ...(transaction.version !== null ? { baseVersion: transaction.version } : {}),
      payload: toTransactionOutboxPayload(transaction),
      createdAt: transaction.updatedAt,
      status: "pending",
      attemptCount: 0,
    };

    return outboxOperation;
  });

  for (const transaction of updatedTransactions) {
    await dependencies.transactions.save(transaction);
  }

  for (const outboxOperation of outboxOps) {
    await dependencies.outbox.append(outboxOperation);
  }

  return {
    transactions: updatedTransactions,
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
