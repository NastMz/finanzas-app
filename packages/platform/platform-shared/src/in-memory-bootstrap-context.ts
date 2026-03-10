import type { InMemoryBootstrap } from "./in-memory-bootstrap.js";

/**
 * Command handlers exposed to host UIs.
 */
export interface InMemoryBootstrapCommands {
  addAccount: InMemoryBootstrap["addAccount"];
  updateAccount: InMemoryBootstrap["updateAccount"];
  deleteAccount: InMemoryBootstrap["deleteAccount"];
  addBudget: InMemoryBootstrap["addBudget"];
  updateBudget: InMemoryBootstrap["updateBudget"];
  deleteBudget: InMemoryBootstrap["deleteBudget"];
  addTransactionTemplate: InMemoryBootstrap["addTransactionTemplate"];
  updateTransactionTemplate: InMemoryBootstrap["updateTransactionTemplate"];
  deleteTransactionTemplate: InMemoryBootstrap["deleteTransactionTemplate"];
  addRecurringRule: InMemoryBootstrap["addRecurringRule"];
  updateRecurringRule: InMemoryBootstrap["updateRecurringRule"];
  deleteRecurringRule: InMemoryBootstrap["deleteRecurringRule"];
  addCategory: InMemoryBootstrap["addCategory"];
  updateCategory: InMemoryBootstrap["updateCategory"];
  deleteCategory: InMemoryBootstrap["deleteCategory"];
  addTransaction: InMemoryBootstrap["addTransaction"];
  updateTransaction: InMemoryBootstrap["updateTransaction"];
  deleteTransaction: InMemoryBootstrap["deleteTransaction"];
  runRecurringRules: InMemoryBootstrap["runRecurringRules"];
  syncNow: InMemoryBootstrap["syncNow"];
}

/**
 * Query handlers exposed to host UIs.
 */
export interface InMemoryBootstrapQueries {
  listAccounts: InMemoryBootstrap["listAccounts"];
  listBudgets: InMemoryBootstrap["listBudgets"];
  listTransactionTemplates: InMemoryBootstrap["listTransactionTemplates"];
  listRecurringRules: InMemoryBootstrap["listRecurringRules"];
  listCategories: InMemoryBootstrap["listCategories"];
  listTransactions: InMemoryBootstrap["listTransactions"];
  getAccountSummary: InMemoryBootstrap["getAccountSummary"];
  getSyncStatus: InMemoryBootstrap["getSyncStatus"];
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
    addBudget: (input) => bootstrap.addBudget(input),
    updateBudget: (input) => bootstrap.updateBudget(input),
    deleteBudget: (input) => bootstrap.deleteBudget(input),
    addTransactionTemplate: (input) => bootstrap.addTransactionTemplate(input),
    updateTransactionTemplate: (input) => bootstrap.updateTransactionTemplate(input),
    deleteTransactionTemplate: (input) => bootstrap.deleteTransactionTemplate(input),
    addRecurringRule: (input) => bootstrap.addRecurringRule(input),
    updateRecurringRule: (input) => bootstrap.updateRecurringRule(input),
    deleteRecurringRule: (input) => bootstrap.deleteRecurringRule(input),
    addCategory: (input) => bootstrap.addCategory(input),
    updateCategory: (input) => bootstrap.updateCategory(input),
    deleteCategory: (input) => bootstrap.deleteCategory(input),
    addTransaction: (input) => bootstrap.addTransaction(input),
    updateTransaction: (input) => bootstrap.updateTransaction(input),
    deleteTransaction: (input) => bootstrap.deleteTransaction(input),
    runRecurringRules: (input) => bootstrap.runRecurringRules(input),
    syncNow: () => bootstrap.syncNow(),
  },
  queries: {
    listAccounts: (input) => bootstrap.listAccounts(input),
    listBudgets: (input) => bootstrap.listBudgets(input),
    listTransactionTemplates: (input) => bootstrap.listTransactionTemplates(input),
    listRecurringRules: (input) => bootstrap.listRecurringRules(input),
    listCategories: (input) => bootstrap.listCategories(input),
    listTransactions: (input) => bootstrap.listTransactions(input),
    getAccountSummary: (input) => bootstrap.getAccountSummary(input),
    getSyncStatus: () => bootstrap.getSyncStatus(),
  },
});
