import type { Transaction } from "@finanzas/domain";

/**
 * Port for transaction persistence operations required by application use cases.
 */
export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  listByAccountId(accountId: string): Promise<Transaction[]>;
  listAll(): Promise<Transaction[]>;
  replaceAll(transactions: Transaction[]): Promise<void>;
}
