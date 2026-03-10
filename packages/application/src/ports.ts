import type { Account, Budget, Category, Transaction } from "@finanzas/domain";

/**
 * Port for account persistence operations required by application use cases.
 */
export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  listAll(): Promise<Account[]>;
  save(account: Account): Promise<void>;
}

/**
 * Port for category persistence operations required by application use cases.
 */
export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  listAll(): Promise<Category[]>;
  save(category: Category): Promise<void>;
}

/**
 * Port for budget persistence operations required by application use cases.
 */
export interface BudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findActiveByCategoryIdAndPeriod(
    categoryId: string,
    period: string,
  ): Promise<Budget | null>;
  listAll(): Promise<Budget[]>;
  save(budget: Budget): Promise<void>;
}

/**
 * Port for transaction persistence operations required by application use cases.
 */
export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  listByAccountId(accountId: string): Promise<Transaction[]>;
}

/**
 * Entity types currently supported in the local outbox.
 */
export type OutboxEntityType = "account" | "category" | "budget" | "transaction";

export type OutboxOpType = "create" | "update" | "delete";

export type OutboxStatus = "pending" | "sent" | "acked" | "failed";

/**
 * Operation envelope persisted in the outbox for sync processing.
 */
export interface OutboxOp {
  opId: string;
  deviceId: string;
  entityType: OutboxEntityType;
  entityId: string;
  opType: OutboxOpType;
  payload: Record<string, unknown>;
  baseVersion?: string | number;
  createdAt: Date;
  status: OutboxStatus;
  attemptCount: number;
  lastError?: string;
}

/**
 * Port for appending and mutating outbox operation states.
 */
export interface OutboxRepository {
  append(op: OutboxOp): Promise<void>;
  listPending(): Promise<OutboxOp[]>;
  markAsSent(opIds: string[]): Promise<void>;
  markAsAcked(opIds: string[]): Promise<void>;
  markAsFailed(opIds: string[], errorMessage: string): Promise<void>;
}

/**
 * Clock abstraction to make time deterministic in tests and adapters.
 */
export interface Clock {
  now(): Date;
}

/**
 * Purpose discriminator for generated identifiers.
 */
export type IdPurpose =
  | "account"
  | "category"
  | "budget"
  | "transaction"
  | "outbox-op";

/**
 * Identifier generator abstraction for deterministic and platform-specific ids.
 */
export interface IdGenerator {
  nextId(purpose?: IdPurpose): string;
}
