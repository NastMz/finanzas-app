import type { IdGenerator } from "@finanzas/application";
import type { SyncApiClient } from "@finanzas/sync";

import type { InMemoryAppContext } from "../in-memory-context.js";

export interface InMemoryBootstrapRuntime extends InMemoryAppContext {
  ids: IdGenerator;
  deviceId: string;
  syncApi: SyncApiClient;
}
