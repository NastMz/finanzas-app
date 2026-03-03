import type { InMemoryBootstrap } from "./in-memory-bootstrap.js";

/**
 * Command handlers exposed to host UIs.
 */
export interface InMemoryBootstrapCommands {
  addAccount: InMemoryBootstrap["addAccount"];
  updateAccount: InMemoryBootstrap["updateAccount"];
  deleteAccount: InMemoryBootstrap["deleteAccount"];
  addCategory: InMemoryBootstrap["addCategory"];
  updateCategory: InMemoryBootstrap["updateCategory"];
  deleteCategory: InMemoryBootstrap["deleteCategory"];
  addTransaction: InMemoryBootstrap["addTransaction"];
  updateTransaction: InMemoryBootstrap["updateTransaction"];
  deleteTransaction: InMemoryBootstrap["deleteTransaction"];
  syncNow: InMemoryBootstrap["syncNow"];
}

/**
 * Query handlers exposed to host UIs.
 */
export interface InMemoryBootstrapQueries {
  listAccounts: InMemoryBootstrap["listAccounts"];
  listCategories: InMemoryBootstrap["listCategories"];
  listTransactions: InMemoryBootstrap["listTransactions"];
}

/**
 * Host-facing context split between commands and queries.
 */
export interface InMemoryBootstrapContext {
  bootstrap: InMemoryBootstrap;
  commands: InMemoryBootstrapCommands;
  queries: InMemoryBootstrapQueries;
}

/**
 * Splits an in-memory bootstrap into command/query facades for UI composition.
 */
export const createInMemoryBootstrapContext = (
  bootstrap: InMemoryBootstrap,
): InMemoryBootstrapContext => ({
  bootstrap,
  commands: {
    addAccount: (input) => bootstrap.addAccount(input),
    updateAccount: (input) => bootstrap.updateAccount(input),
    deleteAccount: (input) => bootstrap.deleteAccount(input),
    addCategory: (input) => bootstrap.addCategory(input),
    updateCategory: (input) => bootstrap.updateCategory(input),
    deleteCategory: (input) => bootstrap.deleteCategory(input),
    addTransaction: (input) => bootstrap.addTransaction(input),
    updateTransaction: (input) => bootstrap.updateTransaction(input),
    deleteTransaction: (input) => bootstrap.deleteTransaction(input),
    syncNow: () => bootstrap.syncNow(),
  },
  queries: {
    listAccounts: (input) => bootstrap.listAccounts(input),
    listCategories: (input) => bootstrap.listCategories(input),
    listTransactions: (input) => bootstrap.listTransactions(input),
  },
});
