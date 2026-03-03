import {
  createMoney,
  createTransaction,
  type Transaction,
} from "@finanzas/domain";

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

/**
 * Input required to update a transaction and enqueue its sync operation.
 */
export interface UpdateTransactionInput {
  transactionId: string;
  accountId?: string;
  amountMinor?: number | bigint;
  currency?: string;
  date?: Date;
  categoryId?: string;
  note?: string;
  tags?: string[];
}

/**
 * Runtime dependencies required by `updateTransaction`.
 */
export interface UpdateTransactionDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `updateTransaction` execution.
 */
export interface UpdateTransactionResult {
  transaction: Transaction;
  outboxOpId: string;
}

/**
 * Updates a local transaction and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const updateTransaction = async (
  dependencies: UpdateTransactionDependencies,
  input: UpdateTransactionInput,
): Promise<UpdateTransactionResult> => {
  const transaction = await dependencies.transactions.findById(input.transactionId);

  if (!transaction) {
    throw new ApplicationError(`Transaction ${input.transactionId} does not exist.`);
  }

  if (transaction.deletedAt) {
    throw new ApplicationError(`Transaction ${input.transactionId} is already deleted.`);
  }

  const hasFieldsToUpdate =
    input.accountId !== undefined ||
    input.amountMinor !== undefined ||
    input.currency !== undefined ||
    input.date !== undefined ||
    input.categoryId !== undefined ||
    input.note !== undefined ||
    input.tags !== undefined;

  if (!hasFieldsToUpdate) {
    throw new ApplicationError(
      "At least one transaction field must be provided to update.",
    );
  }

  const accountId = input.accountId ?? transaction.accountId;
  const account = await dependencies.accounts.findById(accountId);

  if (!account) {
    throw new ApplicationError(`Account ${accountId} does not exist.`);
  }

  const now = dependencies.clock.now();
  const updatedAt = now < transaction.updatedAt ? transaction.updatedAt : now;

  const updatedTransactionBase = createTransaction(
    {
      id: transaction.id,
      accountId: account.id,
      amount: createMoney(
        input.amountMinor ?? transaction.amount.amountMinor,
        input.currency ?? transaction.amount.currency,
      ),
      date: input.date ?? transaction.date,
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
  );

  const updatedTransaction: Transaction = {
    ...updatedTransactionBase,
    deletedAt: transaction.deletedAt,
    version: transaction.version,
  };

  await dependencies.transactions.save(updatedTransaction);

  const outboxOpId = dependencies.ids.nextId();
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction",
    entityId: updatedTransaction.id,
    opType: "update",
    ...(updatedTransaction.version !== null
      ? { baseVersion: updatedTransaction.version }
      : {}),
    payload: toTransactionOutboxPayload(updatedTransaction),
    createdAt: updatedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    transaction: updatedTransaction,
    outboxOpId,
  };
};
