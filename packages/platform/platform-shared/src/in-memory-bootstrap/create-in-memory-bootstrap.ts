import { createUlidIdGenerator } from "@finanzas/data";
import { createInMemorySyncApiClient } from "@finanzas/sync";

import { createInMemoryAppContext } from "../in-memory-context.js";
import { InMemoryBootstrapFacade } from "./in-memory-bootstrap-facade.js";
import type { InMemoryBootstrapRuntime } from "./runtime.js";
import type { CreateInMemoryBootstrapOptions, InMemoryBootstrap } from "./types.js";

export const createInMemoryBootstrap = (
  options: CreateInMemoryBootstrapOptions,
): InMemoryBootstrap => {
  const context = options.context ?? createInMemoryAppContext();
  const deviceId = options.deviceId ?? options.defaultDeviceId;
  const ids =
    options.ids ??
    createUlidIdGenerator({
      namespace: deviceId,
    });
  const syncApi = options.syncApi ?? createInMemorySyncApiClient(context.clock);

  const runtime: InMemoryBootstrapRuntime = {
    ...context,
    ids,
    deviceId,
    syncApi,
  };

  return new InMemoryBootstrapFacade(runtime);
};
