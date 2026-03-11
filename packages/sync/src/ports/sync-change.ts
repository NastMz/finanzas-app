import type { SyncEntityType } from "./sync-entity-type.js";
import type { SyncOpType } from "./sync-op-type.js";

/**
 * Canonical remote change envelope returned by pull.
 */
export interface SyncChange {
  changeId: string;
  entityType: SyncEntityType;
  entityId: string;
  opType: SyncOpType;
  payload: Record<string, unknown>;
  serverVersion?: string | number;
  serverTimestamp: Date;
}
