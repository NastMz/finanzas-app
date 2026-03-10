import type { IdGenerator } from "@finanzas/application";
import {
  createInMemoryBootstrap,
  type InMemoryBootstrap,
} from "@finanzas/platform-shared";
import type { SyncApiClient } from "@finanzas/sync";

export type MobileBootstrap = InMemoryBootstrap;

/**
 * Optional dependency overrides for `createMobileBootstrap`.
 */
export interface CreateMobileBootstrapOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
}

export const createMobileBootstrap = (
  options: CreateMobileBootstrapOptions = {},
): MobileBootstrap =>
  createInMemoryBootstrap({
    defaultDeviceId: "mobile-local-device",
    ...options,
  });
