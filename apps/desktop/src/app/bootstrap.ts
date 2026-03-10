import type { IdGenerator } from "@finanzas/application";
import {
  createInMemoryBootstrap,
  type InMemoryBootstrap,
} from "@finanzas/platform-shared";
import type { SyncApiClient } from "@finanzas/sync";

export type DesktopBootstrap = InMemoryBootstrap;

/**
 * Optional dependency overrides for `createDesktopBootstrap`.
 */
export interface CreateDesktopBootstrapOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
}

export const createDesktopBootstrap = (
  options: CreateDesktopBootstrapOptions = {},
): DesktopBootstrap =>
  createInMemoryBootstrap({
    defaultDeviceId: "desktop-local-device",
    ...options,
  });
