import { createFinanzasApplicationSurface } from "@finanzas/application";
import { createFinanzasSyncSurface } from "@finanzas/sync";

import type { InMemoryBootstrapRuntime } from "./runtime.js";
import type { InMemoryBootstrap } from "./types.js";

export const composeInMemoryBootstrap = (
  runtime: InMemoryBootstrapRuntime,
): InMemoryBootstrap => {
  const application = createFinanzasApplicationSurface({
    accounts: runtime.accounts,
    budgets: runtime.budgets,
    categories: runtime.categories,
    recurringRules: runtime.recurringRules,
    transactions: runtime.transactions,
    transactionTemplates: runtime.transactionTemplates,
    outbox: runtime.outbox,
    clock: runtime.clock,
    ids: runtime.ids,
    deviceId: runtime.deviceId,
  });
  const sync = createFinanzasSyncSurface({
    outbox: runtime.outbox,
    api: runtime.syncApi,
    syncState: runtime.syncState,
    changeApplier: runtime.changeApplier,
    deviceId: runtime.deviceId,
  });

  return {
    ...application,
    importData: async (input) => {
      const result = await application.importData(input);

      await sync.resetState();

      return result;
    },
    getSyncStatus: sync.getSyncStatus,
    syncNow: sync.syncNow,
  };
};
