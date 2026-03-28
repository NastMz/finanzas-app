import type { Transaction } from "@finanzas/domain";
import type {
  MovementsContinuationToken,
  MovementsReviewFilters,
  TransactionRepository,
  TransactionWindowQuery,
  TransactionWindowResult,
} from "@finanzas/application";

/**
 * In-memory implementation of `TransactionRepository` for tests and local wiring.
 */
export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly transactions = new Map<string, Transaction>();

  constructor(seed: Transaction[] = []) {
    for (const transaction of seed) {
      this.transactions.set(transaction.id, cloneTransaction(transaction));
    }
  }

  async save(transaction: Transaction): Promise<void> {
    this.transactions.set(transaction.id, cloneTransaction(transaction));
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = this.transactions.get(id);
    return transaction ? cloneTransaction(transaction) : null;
  }

  async queryWindow(query: TransactionWindowQuery): Promise<TransactionWindowResult> {
    const filteredTransactions = [...this.transactions.values()]
      .filter((transaction) => matchesReviewFilters(transaction, query.filters))
      .sort(compareTransactionsDescending)
      .filter((transaction) => isAfterContinuation(transaction, query.page.continuation));
    const pageTransactions = filteredTransactions.slice(0, query.page.limit + 1);
    const hasMore = pageTransactions.length > query.page.limit;
    const transactions = pageTransactions.slice(0, query.page.limit).map(cloneTransaction);

    return {
      transactions,
      hasMore,
      nextContinuation: hasMore
        ? createContinuationToken(query.filters, transactions.at(-1) ?? null)
        : null,
    };
  }

  async listByAccountId(accountId: string): Promise<Transaction[]> {
    return [...this.transactions.values()]
      .filter((transaction) => transaction.accountId === accountId)
      .map(cloneTransaction);
  }

  async listAll(): Promise<Transaction[]> {
    return [...this.transactions.values()].map(cloneTransaction);
  }

  async replaceAll(transactions: Transaction[]): Promise<void> {
    this.transactions.clear();

    for (const transaction of transactions) {
      this.transactions.set(transaction.id, cloneTransaction(transaction));
    }
  }
}

const cloneTransaction = (transaction: Transaction): Transaction => ({
  ...transaction,
  amount: {
    ...transaction.amount,
  },
  date: new Date(transaction.date),
  tags: [...transaction.tags],
  createdAt: new Date(transaction.createdAt),
  updatedAt: new Date(transaction.updatedAt),
  deletedAt: transaction.deletedAt ? new Date(transaction.deletedAt) : null,
});

const matchesReviewFilters = (
  transaction: Transaction,
  filters: MovementsReviewFilters,
): boolean => {
  if (!filters.includeDeleted && transaction.deletedAt !== null) {
    return false;
  }

  if (filters.accountId !== null && transaction.accountId !== filters.accountId) {
    return false;
  }

  if (filters.categoryId !== null && transaction.categoryId !== filters.categoryId) {
    return false;
  }

  if (
    filters.dateRange.from !== null &&
    transaction.date.getTime() < filters.dateRange.from.getTime()
  ) {
    return false;
  }

  if (filters.dateRange.to !== null && transaction.date.getTime() > filters.dateRange.to.getTime()) {
    return false;
  }

  return true;
};

const compareTransactionsDescending = (left: Transaction, right: Transaction): number => {
  const dateDiff = right.date.getTime() - left.date.getTime();

  if (dateDiff !== 0) {
    return dateDiff;
  }

  const createdAtDiff = right.createdAt.getTime() - left.createdAt.getTime();

  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return right.id.localeCompare(left.id);
};

const isAfterContinuation = (
  transaction: Transaction,
  continuation: MovementsContinuationToken | null,
): boolean => {
  if (continuation === null) {
    return true;
  }

  const lastDate = continuation.lastItem.date;
  const transactionDate = transaction.date.toISOString();

  if (transactionDate < lastDate) {
    return true;
  }

  if (transactionDate > lastDate) {
    return false;
  }

  const lastCreatedAt = continuation.lastItem.createdAt;
  const transactionCreatedAt = transaction.createdAt.toISOString();

  if (transactionCreatedAt < lastCreatedAt) {
    return true;
  }

  if (transactionCreatedAt > lastCreatedAt) {
    return false;
  }

  return transaction.id < continuation.lastItem.id;
};

const createContinuationToken = (
  filters: MovementsReviewFilters,
  transaction: Transaction | null,
): MovementsContinuationToken | null => {
  if (transaction === null) {
    return null;
  }

  return {
    filterFingerprint: JSON.stringify({
      dateRange: {
        from: filters.dateRange.from?.toISOString() ?? null,
        to: filters.dateRange.to?.toISOString() ?? null,
      },
      accountId: filters.accountId,
      categoryId: filters.categoryId,
      includeDeleted: filters.includeDeleted,
    }),
    lastItem: {
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      id: transaction.id,
    },
  };
};
