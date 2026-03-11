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

export type MobileBootstrap = InMemoryBootstrap;

/**
 * Optional dependency overrides for `createMobileBootstrap`.
 */
export interface CreateMobileBootstrapOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
  clock?: Clock;
  databasePath?: string;
}

export const createMobileBootstrap = (
  options: CreateMobileBootstrapOptions = {},
): MobileBootstrap => {
  const { clock, databasePath, syncApi, deviceId, ids } = options;

  return createInMemoryBootstrap({
    ...createBootstrapOptions(syncApi, deviceId, ids),
    context: createSqliteAppContext({
      databasePath: databasePath ?? resolveDefaultHostSqliteDatabasePath("mobile"),
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
  defaultDeviceId: "mobile-local-device",
  ...(syncApi ? { syncApi } : {}),
  ...(deviceId ? { deviceId } : {}),
  ...(ids ? { ids } : {}),
});
