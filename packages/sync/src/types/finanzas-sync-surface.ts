import type { OutboxRepository } from "@finanzas/application";

import type {
  SyncApiClient,
  SyncChangeApplier,
  SyncStateRepository,
  SyncStatusOutboxRepository,
} from "../ports.js";
import { type getSyncStatus } from "../use-cases/get-sync-status.js";
import { type syncNow } from "../use-cases/sync-now.js";

export interface FinanzasSyncSurfaceDependencies {
  outbox: OutboxRepository & SyncStatusOutboxRepository;
  api: SyncApiClient;
  syncState: SyncStateRepository;
  changeApplier: SyncChangeApplier;
  deviceId: string;
}

export interface FinanzasSyncSurface {
  getSyncStatus: () => ReturnType<typeof getSyncStatus>;
  syncNow: () => ReturnType<typeof syncNow>;
  resetState: (cursor?: string) => Promise<void>;
}
