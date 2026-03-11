import type { SyncConflict } from "./sync-conflict.js";

/**
 * Push response payload returned by the sync backend.
 */
export interface SyncPushResponse {
  ackedOpIds: string[];
  conflicts: SyncConflict[];
  serverTime: Date;
}
