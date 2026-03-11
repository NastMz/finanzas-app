import type { SyncChange } from "./sync-change.js";

/**
 * Pull response payload containing new cursor and changes batch.
 */
export interface SyncPullResponse {
  nextCursor: string;
  changes: SyncChange[];
}
