import type { Clock } from "@finanzas/application";
import { createAccount } from "@finanzas/domain";
import { SystemClock } from "@finanzas/data";
import {
  openFinanzasSqlite,
  resolveFinanzasSqlitePath,
  SqliteAccountRepository,
  SqliteBudgetRepository,
  SqliteCategoryRepository,
  SqliteOutboxRepository,
  SqliteRecurringRuleRepository,
  SqliteSyncStateRepository,
  SqliteTransactionRepository,
  SqliteTransactionTemplateRepository,
} from "@finanzas/data/sqlite";
import {
  createAccountSyncChangeApplier,
  createBudgetSyncChangeApplier,
  createCategorySyncChangeApplier,
  createCompositeSyncChangeApplier,
  createRecurringRuleSyncChangeApplier,
  createTransactionSyncChangeApplier,
  createTransactionTemplateSyncChangeApplier,
} from "@finanzas/sync";

import type { InMemoryAppContext } from "./in-memory-context.js";

export interface CreateSqliteAppContextOptions {
  databasePath: string;
  clock?: Clock;
}

export const createSqliteAppContext = (
  options: CreateSqliteAppContextOptions,
): InMemoryAppContext => {
  const clock = options.clock ?? new SystemClock();
  const defaultAccount = createAccount({
    id: "acc-main",
    name: "Cuenta principal",
    type: "bank",
    currency: "COP",
    createdAt: clock.now(),
  });
  const database = openFinanzasSqlite({
    databasePath: options.databasePath,
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

  const accounts = new SqliteAccountRepository(database);
  const budgets = new SqliteBudgetRepository(database);
  const categories = new SqliteCategoryRepository(database);
  const recurringRules = new SqliteRecurringRuleRepository(database);
  const transactions = new SqliteTransactionRepository(database);
  const transactionTemplates = new SqliteTransactionTemplateRepository(database);
  const outbox = new SqliteOutboxRepository(database);
  const syncState = new SqliteSyncStateRepository(database, "0");

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

export const resolveDefaultHostSqliteDatabasePath = (
  hostName: string,
): string => resolveFinanzasSqlitePath(hostName);
