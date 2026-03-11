import type { OutboxRepository } from "@finanzas/application";

import type { SyncApiClient } from "./sync-api-client.js";
import type { SyncChangeApplier } from "./sync-change-applier.js";
import type { SyncStateRepository } from "./sync-state-repository.js";

/**
 * Runtime dependencies required to execute the `syncNow` use case.
 */
export interface SyncNowDependencies {
  outbox: OutboxRepository;
  api: SyncApiClient;
  syncState: SyncStateRepository;
  changeApplier: SyncChangeApplier;
  deviceId: string;
}
