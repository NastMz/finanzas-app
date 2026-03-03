import type { Transaction } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type { AccountRepository, TransactionRepository } from "../ports.js";

export interface ListTransactionsInput {
  accountId: string;
  includeDeleted?: boolean;
  limit?: number;
}

export interface ListTransactionsDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
}

export interface ListTransactionsResult {
  transactions: Transaction[];
}

export const listTransactions = async (
  dependencies: ListTransactionsDependencies,
  input: ListTransactionsInput,
): Promise<ListTransactionsResult> => {
  const accountId = input.accountId.trim();

  if (accountId.length === 0) {
    throw new ApplicationError("Account id is required.");
  }

  const account = await dependencies.accounts.findById(accountId);

  if (!account) {
    throw new ApplicationError(`Account ${accountId} does not exist.`);
  }

  const transactions = await dependencies.transactions.listByAccountId(account.id);
  const includeDeleted = input.includeDeleted ?? false;

  const filteredTransactions = includeDeleted
    ? transactions
    : transactions.filter((transaction) => transaction.deletedAt === null);

  const sortedTransactions = [...filteredTransactions].sort((left, right) => {
    const dateDiff = right.date.getTime() - left.date.getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  const limit = input.limit ?? null;

  return {
    transactions:
      limit === null ? sortedTransactions : sortedTransactions.slice(0, limit),
  };
};
