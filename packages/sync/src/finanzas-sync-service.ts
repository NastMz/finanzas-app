import type { OutboxRepository } from "@finanzas/application";

import type {
  SyncApiClient,
  SyncChangeApplier,
  SyncStateRepository,
  SyncStatusOutboxRepository,
} from "./ports.js";
import { getSyncStatus } from "./use-cases/get-sync-status.js";
import { syncNow } from "./use-cases/sync-now.js";

export interface FinanzasSyncServiceDependencies {
  outbox: OutboxRepository & SyncStatusOutboxRepository;
  api: SyncApiClient;
  syncState: SyncStateRepository;
  changeApplier: SyncChangeApplier;
  deviceId: string;
}

export class FinanzasSyncService {
  public constructor(
    private readonly dependencies: FinanzasSyncServiceDependencies,
  ) {}

  public readonly getSyncStatus = (): ReturnType<typeof getSyncStatus> =>
    getSyncStatus({
      outbox: this.dependencies.outbox,
      syncState: this.dependencies.syncState,
    });

  public readonly syncNow = (): ReturnType<typeof syncNow> =>
    syncNow({
      outbox: this.dependencies.outbox,
      api: this.dependencies.api,
      syncState: this.dependencies.syncState,
      changeApplier: this.dependencies.changeApplier,
      deviceId: this.dependencies.deviceId,
    });

  public readonly resetState = async (cursor = "0"): Promise<void> => {
    await this.dependencies.outbox.replaceAll([]);
    await this.dependencies.syncState.setCursor(cursor);
  };
}
