import type { SyncStateRepository } from "./sync-state-repository.js";
import type { SyncStatusOutboxRepository } from "./sync-status-outbox-repository.js";

/**
 * Runtime dependencies required to execute `getSyncStatus`.
 */
export interface GetSyncStatusDependencies {
  outbox: SyncStatusOutboxRepository;
  syncState: SyncStateRepository;
}
