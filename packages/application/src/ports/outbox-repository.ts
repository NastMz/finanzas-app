import type { OutboxOp } from "./outbox-op.js";

/**
 * Port for appending and mutating outbox operation states.
 */
export interface OutboxRepository {
  append(op: OutboxOp): Promise<void>;
  listPending(): Promise<OutboxOp[]>;
  markAsSent(opIds: string[]): Promise<void>;
  markAsAcked(opIds: string[]): Promise<void>;
  markAsFailed(opIds: string[], errorMessage: string): Promise<void>;
  replaceAll(ops: OutboxOp[]): Promise<void>;
}
