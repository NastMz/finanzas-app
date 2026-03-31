import type {
  InMemoryBootstrap,
  InMemoryBootstrapCommandHandlers,
  InMemoryBootstrapQueryHandlers,
} from "./in-memory-bootstrap.js";

const pickCommandHandlers = (
  bootstrap: InMemoryBootstrap,
): InMemoryBootstrapCommandHandlers => ({
  addAccount: bootstrap.addAccount,
  updateAccount: bootstrap.updateAccount,
  deleteAccount: bootstrap.deleteAccount,
  addBudget: bootstrap.addBudget,
  updateBudget: bootstrap.updateBudget,
  deleteBudget: bootstrap.deleteBudget,
  addTransactionTemplate: bootstrap.addTransactionTemplate,
  updateTransactionTemplate: bootstrap.updateTransactionTemplate,
  deleteTransactionTemplate: bootstrap.deleteTransactionTemplate,
  addRecurringRule: bootstrap.addRecurringRule,
  updateRecurringRule: bootstrap.updateRecurringRule,
  deleteRecurringRule: bootstrap.deleteRecurringRule,
  addCategory: bootstrap.addCategory,
  updateCategory: bootstrap.updateCategory,
  deleteCategory: bootstrap.deleteCategory,
  addTransaction: bootstrap.addTransaction,
  bulkUpdateTransactions: bootstrap.bulkUpdateTransactions,
  bulkDeleteTransactions: bootstrap.bulkDeleteTransactions,
  updateTransaction: bootstrap.updateTransaction,
  deleteTransaction: bootstrap.deleteTransaction,
  importData: bootstrap.importData,
  runRecurringRules: bootstrap.runRecurringRules,
  syncNow: bootstrap.syncNow,
});

const pickQueryHandlers = (
  bootstrap: InMemoryBootstrap,
): InMemoryBootstrapQueryHandlers => ({
  listAccounts: bootstrap.listAccounts,
  listBudgets: bootstrap.listBudgets,
  listTransactionTemplates: bootstrap.listTransactionTemplates,
  listRecurringRules: bootstrap.listRecurringRules,
  listCategories: bootstrap.listCategories,
  listTransactions: bootstrap.listTransactions,
  getAccountSummary: bootstrap.getAccountSummary,
  exportData: bootstrap.exportData,
  getSyncStatus: bootstrap.getSyncStatus,
});

export interface InMemoryBootstrapContext {
  bootstrap: InMemoryBootstrap;
  commands: InMemoryBootstrapCommandHandlers;
  queries: InMemoryBootstrapQueryHandlers;
}

/**
 * Splits an in-memory bootstrap into command/query facades for UI composition.
 */
export const createInMemoryBootstrapContext = (
  bootstrap: InMemoryBootstrap,
): InMemoryBootstrapContext => ({
  bootstrap,
  commands: pickCommandHandlers(bootstrap),
  queries: pickQueryHandlers(bootstrap),
});
