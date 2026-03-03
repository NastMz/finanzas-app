import type { Transaction } from "@finanzas/domain";
import type { TransactionRepository } from "@finanzas/application";

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

  async listByAccountId(accountId: string): Promise<Transaction[]> {
    return [...this.transactions.values()]
      .filter((transaction) => transaction.accountId === accountId)
      .map(cloneTransaction);
  }

  async listAll(): Promise<Transaction[]> {
    return [...this.transactions.values()].map(cloneTransaction);
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
