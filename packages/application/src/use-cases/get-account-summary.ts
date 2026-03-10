import type { Transaction } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type { AccountRepository, TransactionRepository } from "../ports.js";
import { assertTransactionsMatchAccountCurrency } from "./shared/account-currency-consistency.js";

/**
 * Query parameters for building an account summary in a given period.
 */
export interface GetAccountSummaryInput {
  accountId: string;
  from: Date;
  to: Date;
  includeDeleted?: boolean;
  recentLimit?: number;
  topCategoriesLimit?: number;
}

/**
 * Runtime dependencies required by `getAccountSummary`.
 */
export interface GetAccountSummaryDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
}

/**
 * Aggregated totals for the requested period.
 */
export interface AccountSummaryTotals {
  incomeMinor: bigint;
  expenseMinor: bigint;
  netMinor: bigint;
}

/**
 * Expense aggregation grouped by category.
 */
export interface AccountExpenseCategorySummary {
  categoryId: string;
  expenseMinor: bigint;
}

/**
 * Result payload returned by `getAccountSummary`.
 */
export interface GetAccountSummaryResult {
  accountId: string;
  currency: string;
  from: Date;
  to: Date;
  transactionCount: number;
  totals: AccountSummaryTotals;
  topExpenseCategories: AccountExpenseCategorySummary[];
  recentTransactions: Transaction[];
}

/**
 * Builds an account summary for a period, including income/expense totals,
 * top expense categories and most recent transactions.
 */
export const getAccountSummary = async (
  dependencies: GetAccountSummaryDependencies,
  input: GetAccountSummaryInput,
): Promise<GetAccountSummaryResult> => {
  const accountId = input.accountId.trim();

  if (accountId.length === 0) {
    throw new ApplicationError("Account id is required.");
  }

  const fromTime = toTimestamp(input.from, "from");
  const toTime = toTimestamp(input.to, "to");

  if (fromTime > toTime) {
    throw new ApplicationError("Summary period is invalid.");
  }

  const recentLimit = normalizeLimit(input.recentLimit, "recentLimit", 5);
  const topCategoriesLimit = normalizeLimit(
    input.topCategoriesLimit,
    "topCategoriesLimit",
    3,
  );

  const account = await dependencies.accounts.findById(accountId);

  if (!account) {
    throw new ApplicationError(`Account ${accountId} does not exist.`);
  }

  const includeDeleted = input.includeDeleted ?? false;
  const accountTransactions = await dependencies.transactions.listByAccountId(
    account.id,
  );
  assertTransactionsMatchAccountCurrency(account, accountTransactions);

  const transactionsInPeriod = accountTransactions.filter((transaction) => {
    const transactionTime = transaction.date.getTime();
    const isInPeriod = transactionTime >= fromTime && transactionTime <= toTime;
    const shouldInclude = includeDeleted || transaction.deletedAt === null;

    return isInPeriod && shouldInclude;
  });

  const sortedTransactions = sortTransactionsByDate(transactionsInPeriod);
  const totals = buildSummaryTotals(transactionsInPeriod);
  const topExpenseCategories = buildTopExpenseCategories(
    transactionsInPeriod,
    topCategoriesLimit,
  );

  return {
    accountId: account.id,
    currency: account.currency,
    from: new Date(input.from),
    to: new Date(input.to),
    transactionCount: transactionsInPeriod.length,
    totals,
    topExpenseCategories,
    recentTransactions: sortedTransactions.slice(0, recentLimit),
  };
};

const toTimestamp = (value: Date, fieldName: "from" | "to"): number => {
  const timestamp = value.getTime();

  if (Number.isNaN(timestamp)) {
    throw new ApplicationError(`Summary ${fieldName} date is invalid.`);
  }

  return timestamp;
};

const normalizeLimit = (
  value: number | undefined,
  fieldName: "recentLimit" | "topCategoriesLimit",
  fallback: number,
): number => {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new ApplicationError(`${fieldName} must be a non-negative integer.`);
  }

  return value;
};

const sortTransactionsByDate = (transactions: Transaction[]): Transaction[] =>
  [...transactions].sort((left, right) => {
    const dateDiff = right.date.getTime() - left.date.getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    const createdAtDiff = right.createdAt.getTime() - left.createdAt.getTime();

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return right.id.localeCompare(left.id);
  });

const buildSummaryTotals = (
  transactions: Transaction[],
): AccountSummaryTotals => {
  let incomeMinor = 0n;
  let expenseMinor = 0n;

  for (const transaction of transactions) {
    const amountMinor = transaction.amount.amountMinor;

    if (amountMinor > 0n) {
      incomeMinor += amountMinor;
      continue;
    }

    expenseMinor += -amountMinor;
  }

  return {
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
  };
};

const buildTopExpenseCategories = (
  transactions: Transaction[],
  topCategoriesLimit: number,
): AccountExpenseCategorySummary[] => {
  const expenseTotalsByCategory = new Map<string, bigint>();

  for (const transaction of transactions) {
    const amountMinor = transaction.amount.amountMinor;

    if (amountMinor >= 0n) {
      continue;
    }

    const currentTotal = expenseTotalsByCategory.get(transaction.categoryId) ?? 0n;
    expenseTotalsByCategory.set(transaction.categoryId, currentTotal + -amountMinor);
  }

  return [...expenseTotalsByCategory.entries()]
    .map(([categoryId, expenseMinor]) => ({
      categoryId,
      expenseMinor,
    }))
    .sort((left, right) => {
      if (left.expenseMinor === right.expenseMinor) {
        return left.categoryId.localeCompare(right.categoryId);
      }

      return left.expenseMinor > right.expenseMinor ? -1 : 1;
    })
    .slice(0, topCategoriesLimit);
};
