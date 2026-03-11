import type { SyncChange } from "./sync-change.js";

/**
 * Applies pulled changes to local repositories.
 */
export interface SyncChangeApplier {
  apply(changes: SyncChange[]): Promise<void>;
}
