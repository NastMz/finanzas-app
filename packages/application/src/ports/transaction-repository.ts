import type { Transaction } from "@finanzas/domain";

export const MOVEMENTS_WINDOW_SORT = "date-desc-created-desc-id-desc" as const;

export interface MovementsReviewFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  accountId: string | null;
  categoryId: string | null;
  includeDeleted: boolean;
}

export interface MovementsContinuationToken {
  filterFingerprint: string;
  lastItem: {
    date: string;
    createdAt: string;
    id: string;
  };
}

export interface MovementsPageRequest {
  limit: number;
  continuation: MovementsContinuationToken | null;
}

export interface TransactionWindowQuery {
  filters: MovementsReviewFilters;
  page: MovementsPageRequest;
  sort: typeof MOVEMENTS_WINDOW_SORT;
}

export interface TransactionWindowResult {
  transactions: Transaction[];
  nextContinuation: MovementsContinuationToken | null;
  hasMore: boolean;
}

/**
 * Port for transaction persistence operations required by application use cases.
 */
export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  queryWindow(query: TransactionWindowQuery): Promise<TransactionWindowResult>;
  listByAccountId(accountId: string): Promise<Transaction[]>;
  listAll(): Promise<Transaction[]>;
  replaceAll(transactions: Transaction[]): Promise<void>;
}
