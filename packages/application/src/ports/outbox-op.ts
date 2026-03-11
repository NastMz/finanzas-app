import type { OutboxEntityType } from "./outbox-entity-type.js";
import type { OutboxOpType } from "./outbox-op-type.js";
import type { OutboxStatus } from "./outbox-status.js";

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
