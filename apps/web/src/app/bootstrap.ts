import type { IdGenerator } from "@finanzas/application";
import {
  createInMemoryBootstrap,
  type InMemoryBootstrap,
} from "@finanzas/platform-shared";
import type { SyncApiClient } from "@finanzas/sync";

export type WebBootstrap = InMemoryBootstrap;

/**
 * Optional dependency overrides for `createWebBootstrap`.
 */
export interface CreateWebBootstrapOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
}

export const createWebBootstrap = (
  options: CreateWebBootstrapOptions = {},
): WebBootstrap =>
  createInMemoryBootstrap({
    defaultDeviceId: "web-local-device",
    ...options,
  });
