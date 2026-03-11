import type { Clock, IdGenerator } from "@finanzas/application";
import { createAccount } from "@finanzas/domain";
import {
  IndexedDbAccountRepository,
  IndexedDbBudgetRepository,
  IndexedDbCategoryRepository,
  IndexedDbOutboxRepository,
  IndexedDbRecurringRuleRepository,
  IndexedDbSyncStateRepository,
  IndexedDbTransactionRepository,
  IndexedDbTransactionTemplateRepository,
  SystemClock,
  openFinanzasIndexedDb,
} from "@finanzas/data";
import {
  createInMemoryAppContext,
  createInMemoryBootstrap,
  type InMemoryAppContext,
  type InMemoryBootstrap,
} from "@finanzas/platform-shared";
import {
  createAccountSyncChangeApplier,
  createBudgetSyncChangeApplier,
  createCategorySyncChangeApplier,
  createCompositeSyncChangeApplier,
  createRecurringRuleSyncChangeApplier,
  createTransactionSyncChangeApplier,
  createTransactionTemplateSyncChangeApplier,
  type SyncApiClient,
} from "@finanzas/sync";

export type WebBootstrap = InMemoryBootstrap;

/**
 * Optional dependency overrides for `createWebBootstrap`.
 */
export interface CreateWebBootstrapOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
  clock?: Clock;
  indexedDb?: IDBFactory;
  databaseName?: string;
}

export const createWebBootstrap = (
  options: CreateWebBootstrapOptions = {},
): WebBootstrap => {
  const {
    clock,
    databaseName,
    indexedDb: explicitIndexedDb,
    syncApi,
    deviceId,
    ids,
  } = options;
  const indexedDb = explicitIndexedDb ?? globalThis.indexedDB;

  if (indexedDb === undefined) {
    return createInMemoryBootstrap({
      ...createBootstrapOptions(syncApi, deviceId, ids),
      context: createInMemoryAppContext(clock?.now()),
    });
  }

  return createInMemoryBootstrap({
    ...createBootstrapOptions(syncApi, deviceId, ids),
    context: createIndexedDbWebContext({
      indexedDb,
      ...(databaseName ? { databaseName } : {}),
      ...(clock ? { clock } : {}),
    }),
  });
};

interface CreateIndexedDbWebContextOptions {
  indexedDb: IDBFactory;
  databaseName?: string;
  clock?: Clock;
}

const createIndexedDbWebContext = (
  options: CreateIndexedDbWebContextOptions,
): InMemoryAppContext => {
  const clock = options.clock ?? new SystemClock();
  const defaultAccount = createAccount({
    id: "acc-main",
    name: "Cuenta principal",
    type: "bank",
    currency: "COP",
    createdAt: clock.now(),
  });
  const database = openFinanzasIndexedDb({
    indexedDb: options.indexedDb,
    ...(options.databaseName ? { databaseName: options.databaseName } : {}),
    seedAccount: {
      id: defaultAccount.id,
      name: defaultAccount.name,
      type: defaultAccount.type,
      currency: defaultAccount.currency,
      createdAt: defaultAccount.createdAt.toISOString(),
      updatedAt: defaultAccount.updatedAt.toISOString(),
      deletedAt: null,
      version: defaultAccount.version,
    },
    initialCursor: "0",
  });

  const accounts = new IndexedDbAccountRepository(database);
  const budgets = new IndexedDbBudgetRepository(database);
  const categories = new IndexedDbCategoryRepository(database);
  const recurringRules = new IndexedDbRecurringRuleRepository(database);
  const transactions = new IndexedDbTransactionRepository(database);
  const transactionTemplates = new IndexedDbTransactionTemplateRepository(database);
  const outbox = new IndexedDbOutboxRepository(database);
  const syncState = new IndexedDbSyncStateRepository(database, "0");

  const changeApplier = createCompositeSyncChangeApplier({
    appliersByEntityType: {
      account: createAccountSyncChangeApplier({
        accounts,
      }),
      budget: createBudgetSyncChangeApplier({
        budgets,
      }),
      category: createCategorySyncChangeApplier({
        categories,
      }),
      "recurring-rule": createRecurringRuleSyncChangeApplier({
        recurringRules,
      }),
      transaction: createTransactionSyncChangeApplier({
        transactions,
      }),
      "transaction-template": createTransactionTemplateSyncChangeApplier({
        templates: transactionTemplates,
      }),
    },
  });

  return {
    accounts,
    budgets,
    categories,
    recurringRules,
    transactions,
    transactionTemplates,
    outbox,
    syncState,
    clock,
    changeApplier,
  };
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
  defaultDeviceId: "web-local-device",
  ...(syncApi ? { syncApi } : {}),
  ...(deviceId ? { deviceId } : {}),
  ...(ids ? { ids } : {}),
});
