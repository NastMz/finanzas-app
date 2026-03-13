import type { FinanzasUiCommands } from "./finanzas-ui-commands.js";
import type { FinanzasUiQueries } from "./finanzas-ui-queries.js";

/**
 * Runtime dependencies required by `createFinanzasUiService`.
 */
export interface FinanzasUiDependencies {
  commands: FinanzasUiCommands;
  queries: FinanzasUiQueries;
}

/**
 * Selects the minimal command/query surface consumed by the UI orchestrator.
 */
export const selectFinanzasUiDependencies = (
  dependencies: FinanzasUiDependencies,
): FinanzasUiDependencies => ({
  commands: {
    addCategory: (input) => dependencies.commands.addCategory(input),
    addTransaction: (input) => dependencies.commands.addTransaction(input),
    syncNow: () => dependencies.commands.syncNow(),
  },
  queries: {
    listAccounts: (input) => dependencies.queries.listAccounts(input),
    listCategories: (input) => dependencies.queries.listCategories(input),
    listTransactions: (input) => dependencies.queries.listTransactions(input),
    getAccountSummary: (input) => dependencies.queries.getAccountSummary(input),
    getSyncStatus: () => dependencies.queries.getSyncStatus(),
  },
});
