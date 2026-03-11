import type { Clock, IdGenerator } from "@finanzas/application";
import {
  createInMemoryBootstrap,
  type InMemoryBootstrap,
} from "@finanzas/platform-shared";
import {
  createSqliteAppContext,
  resolveDefaultHostSqliteDatabasePath,
} from "@finanzas/platform-shared/sqlite";
import type { SyncApiClient } from "@finanzas/sync";

export type DesktopBootstrap = InMemoryBootstrap;

/**
 * Optional dependency overrides for `createDesktopBootstrap`.
 */
export interface CreateDesktopBootstrapOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
  clock?: Clock;
  databasePath?: string;
}

export const createDesktopBootstrap = (
  options: CreateDesktopBootstrapOptions = {},
): DesktopBootstrap => {
  const { clock, databasePath, syncApi, deviceId, ids } = options;

  return createInMemoryBootstrap({
    ...createBootstrapOptions(syncApi, deviceId, ids),
    context: createSqliteAppContext({
      databasePath: databasePath ?? resolveDefaultHostSqliteDatabasePath("desktop"),
      ...(clock ? { clock } : {}),
    }),
  });
};

const createBootstrapOptions = (
  syncApi: SyncApiClient | undefined,
  deviceId: string | undefined,
  ids: IdGenerator | undefined,
): {
  defaultDeviceId: string;
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
} => ({
  defaultDeviceId: "desktop-local-device",
  ...(syncApi ? { syncApi } : {}),
  ...(deviceId ? { deviceId } : {}),
  ...(ids ? { ids } : {}),
});
