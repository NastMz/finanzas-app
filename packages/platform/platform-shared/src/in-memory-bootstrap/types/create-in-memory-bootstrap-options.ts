import type { IdGenerator } from "@finanzas/application";
import type { SyncApiClient } from "@finanzas/sync";

import type { InMemoryAppContext } from "../../in-memory-context.js";

export interface CreateInMemoryBootstrapOptions {
  defaultDeviceId: string;
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
  context?: InMemoryAppContext;
}
