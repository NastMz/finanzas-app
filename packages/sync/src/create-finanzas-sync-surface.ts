import type {
  FinanzasSyncSurface,
  FinanzasSyncSurfaceDependencies,
} from "./types/finanzas-sync-surface.js";
import { getSyncStatus } from "./use-cases/get-sync-status.js";
import { syncNow } from "./use-cases/sync-now.js";

export const createFinanzasSyncSurface = (
  dependencies: FinanzasSyncSurfaceDependencies,
): FinanzasSyncSurface => ({
  getSyncStatus: () =>
    getSyncStatus({
      outbox: dependencies.outbox,
      syncState: dependencies.syncState,
    }),
  syncNow: () =>
    syncNow({
      outbox: dependencies.outbox,
      api: dependencies.api,
      syncState: dependencies.syncState,
      changeApplier: dependencies.changeApplier,
      deviceId: dependencies.deviceId,
    }),
  resetState: async (cursor = "0") => {
    await dependencies.outbox.replaceAll([]);
    await dependencies.syncState.setCursor(cursor);
  },
});
