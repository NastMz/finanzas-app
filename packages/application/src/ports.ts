import type { Account, Transaction } from "@finanzas/domain";

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  listByAccountId(accountId: string): Promise<Transaction[]>;
}

export type OutboxEntityType = "transaction";

export type OutboxOpType = "create" | "update" | "delete";

export type OutboxStatus = "pending" | "sent" | "acked" | "failed";

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

export interface OutboxRepository {
  append(op: OutboxOp): Promise<void>;
  listPending(): Promise<OutboxOp[]>;
  markAsSent(opIds: string[]): Promise<void>;
  markAsAcked(opIds: string[]): Promise<void>;
  markAsFailed(opIds: string[], errorMessage: string): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  nextId(): string;
}
