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

export interface AddTransactionInput {
  accountId: string;
  amountMinor: number | bigint;
  currency: string;
  date: Date;
  categoryId: string;
  note?: string;
  tags?: string[];
}

export interface AddTransactionDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

export interface AddTransactionResult {
  transaction: Transaction;
  outboxOpId: string;
}

export const addTransaction = async (
  dependencies: AddTransactionDependencies,
  input: AddTransactionInput,
): Promise<AddTransactionResult> => {
  const account = await dependencies.accounts.findById(input.accountId);

  if (!account) {
    throw new ApplicationError(`Account ${input.accountId} does not exist.`);
  }

  const now = dependencies.clock.now();
  const transactionId = dependencies.ids.nextId();

  const transaction = createTransaction(
    {
      id: transactionId,
      accountId: account.id,
      amount: createMoney(input.amountMinor, input.currency),
      date: input.date,
      categoryId: input.categoryId,
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      createdAt: now,
      updatedAt: now,
    },
    account,
  );

  await dependencies.transactions.save(transaction);

  const outboxOpId = dependencies.ids.nextId();
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction",
    entityId: transaction.id,
    opType: "create",
    payload: toOutboxPayload(transaction),
    createdAt: now,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    transaction,
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
