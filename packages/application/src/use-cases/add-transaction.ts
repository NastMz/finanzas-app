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
 * Input required to create a transaction and enqueue its sync operation.
 */
export interface AddTransactionInput {
  accountId: string;
  amountMinor: number | bigint;
  currency: string;
  date: Date;
  categoryId: string;
  note?: string;
  tags?: string[];
}

/**
 * Runtime dependencies required by `addTransaction`.
 */
export interface AddTransactionDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `addTransaction` execution.
 */
export interface AddTransactionResult {
  transaction: Transaction;
  outboxOpId: string;
}

/**
 * Creates a new local transaction and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const addTransaction = async (
  dependencies: AddTransactionDependencies,
  input: AddTransactionInput,
): Promise<AddTransactionResult> => {
  const account = await dependencies.accounts.findById(input.accountId);

  if (!account) {
    throw new ApplicationError(`Account ${input.accountId} does not exist.`);
  }

  const now = dependencies.clock.now();
  const transactionId = dependencies.ids.nextId("transaction");

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

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction",
    entityId: transaction.id,
    opType: "create",
    payload: toTransactionOutboxPayload(transaction),
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
