import {
  exportData,
  getAccountSummary,
  listAccounts,
  listBudgets,
  listCategories,
  listRecurringRules,
  listTransactions,
  listTransactionTemplates,
} from "@finanzas/application";
import { getSyncStatus as runGetSyncStatus } from "@finanzas/sync";

import type { InMemoryBootstrapQueryHandlers } from "./types.js";
import type { InMemoryBootstrapRuntime } from "./runtime.js";

export const createInMemoryBootstrapQueries = (
  runtime: InMemoryBootstrapRuntime,
): InMemoryBootstrapQueryHandlers => {
  const {
    accounts,
    budgets,
    categories,
    recurringRules,
    transactions,
    transactionTemplates,
    outbox,
    syncState,
    clock,
  } = runtime;

  return {
    listAccounts: (input = {}) =>
      listAccounts(
        {
          accounts,
        },
        input,
      ),
    listBudgets: (input = {}) =>
      listBudgets(
        {
          budgets,
        },
        input,
      ),
    listTransactionTemplates: (input = {}) =>
      listTransactionTemplates(
        {
          templates: transactionTemplates,
        },
        input,
      ),
    listRecurringRules: (input = {}) =>
      listRecurringRules(
        {
          recurringRules,
        },
        input,
      ),
    listCategories: (input = {}) =>
      listCategories(
        {
          categories,
        },
        input,
      ),
    listTransactions: (input) =>
      listTransactions(
        {
          accounts,
          transactions,
        },
        input,
      ),
    getAccountSummary: (input) =>
      getAccountSummary(
        {
          accounts,
          transactions,
        },
        input,
      ),
    exportData: () =>
      exportData({
        accounts,
        categories,
        budgets,
        templates: transactionTemplates,
        recurringRules,
        transactions,
        clock,
      }),
    getSyncStatus: () =>
      runGetSyncStatus({
        outbox,
        syncState,
      }),
  };
};
