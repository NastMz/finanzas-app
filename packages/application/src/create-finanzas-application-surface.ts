import { addAccount } from "./use-cases/add-account.js";
import { addBudget } from "./use-cases/add-budget.js";
import { addCategory } from "./use-cases/add-category.js";
import { addRecurringRule } from "./use-cases/add-recurring-rule.js";
import { addTransaction } from "./use-cases/add-transaction.js";
import { addTransactionTemplate } from "./use-cases/add-transaction-template.js";
import { bulkDeleteTransactions } from "./use-cases/bulk-delete-transactions.js";
import { bulkUpdateTransactions } from "./use-cases/bulk-update-transactions.js";
import { deleteAccount } from "./use-cases/delete-account.js";
import { deleteBudget } from "./use-cases/delete-budget.js";
import { deleteCategory } from "./use-cases/delete-category.js";
import { deleteRecurringRule } from "./use-cases/delete-recurring-rule.js";
import { deleteTransaction } from "./use-cases/delete-transaction.js";
import { deleteTransactionTemplate } from "./use-cases/delete-transaction-template.js";
import { exportData } from "./use-cases/export-data.js";
import { getAccountSummary } from "./use-cases/get-account-summary.js";
import { importData } from "./use-cases/import-data.js";
import { listAccounts } from "./use-cases/list-accounts.js";
import { listBudgets } from "./use-cases/list-budgets.js";
import { listCategories } from "./use-cases/list-categories.js";
import { listRecurringRules } from "./use-cases/list-recurring-rules.js";
import { listTransactions } from "./use-cases/list-transactions.js";
import { listTransactionTemplates } from "./use-cases/list-transaction-templates.js";
import { runRecurringRules } from "./use-cases/run-recurring-rules.js";
import { updateAccount } from "./use-cases/update-account.js";
import { updateBudget } from "./use-cases/update-budget.js";
import { updateCategory } from "./use-cases/update-category.js";
import { updateRecurringRule } from "./use-cases/update-recurring-rule.js";
import { updateTransaction } from "./use-cases/update-transaction.js";
import { updateTransactionTemplate } from "./use-cases/update-transaction-template.js";
import type {
  FinanzasApplicationSurface,
  FinanzasApplicationSurfaceDependencies,
} from "./types/finanzas-application-surface.js";

type FinanzasApplicationMutationDependencies = Pick<
FinanzasApplicationSurfaceDependencies,
"outbox" | "clock" | "ids" | "deviceId"
>;

export const createFinanzasApplicationSurface = (
  dependencies: FinanzasApplicationSurfaceDependencies,
): FinanzasApplicationSurface => {
  const getMutationDependencies = (): FinanzasApplicationMutationDependencies => ({
    outbox: dependencies.outbox,
    clock: dependencies.clock,
    ids: dependencies.ids,
    deviceId: dependencies.deviceId,
  });

  return {
    addAccount: async (input) =>
      await addAccount(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
        },
        input,
      ),
    updateAccount: async (input) =>
      await updateAccount(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
          templates: dependencies.transactionTemplates,
        },
        input,
      ),
    deleteAccount: async (input) =>
      await deleteAccount(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
        },
        input,
      ),
    addBudget: async (input) =>
      await addBudget(
        {
          ...getMutationDependencies(),
          budgets: dependencies.budgets,
          categories: dependencies.categories,
        },
        input,
      ),
    updateBudget: async (input) =>
      await updateBudget(
        {
          ...getMutationDependencies(),
          budgets: dependencies.budgets,
          categories: dependencies.categories,
        },
        input,
      ),
    deleteBudget: async (input) =>
      await deleteBudget(
        {
          ...getMutationDependencies(),
          budgets: dependencies.budgets,
        },
        input,
      ),
    addTransactionTemplate: async (input) =>
      await addTransactionTemplate(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
          templates: dependencies.transactionTemplates,
        },
        input,
      ),
    updateTransactionTemplate: async (input) =>
      await updateTransactionTemplate(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
          templates: dependencies.transactionTemplates,
        },
        input,
      ),
    deleteTransactionTemplate: async (input) =>
      await deleteTransactionTemplate(
        {
          ...getMutationDependencies(),
          templates: dependencies.transactionTemplates,
          recurringRules: dependencies.recurringRules,
        },
        input,
      ),
    addRecurringRule: async (input) =>
      await addRecurringRule(
        {
          ...getMutationDependencies(),
          recurringRules: dependencies.recurringRules,
          templates: dependencies.transactionTemplates,
        },
        input,
      ),
    updateRecurringRule: async (input) =>
      await updateRecurringRule(
        {
          ...getMutationDependencies(),
          recurringRules: dependencies.recurringRules,
          templates: dependencies.transactionTemplates,
        },
        input,
      ),
    deleteRecurringRule: async (input) =>
      await deleteRecurringRule(
        {
          ...getMutationDependencies(),
          recurringRules: dependencies.recurringRules,
        },
        input,
      ),
    addCategory: async (input) =>
      await addCategory(
        {
          ...getMutationDependencies(),
          categories: dependencies.categories,
        },
        input,
      ),
    updateCategory: async (input) =>
      await updateCategory(
        {
          ...getMutationDependencies(),
          categories: dependencies.categories,
        },
        input,
      ),
    deleteCategory: async (input) =>
      await deleteCategory(
        {
          ...getMutationDependencies(),
          categories: dependencies.categories,
        },
        input,
      ),
    addTransaction: async (input) =>
      await addTransaction(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
        },
        input,
      ),
    bulkUpdateTransactions: async (input) =>
      await bulkUpdateTransactions(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
        },
        input,
      ),
    bulkDeleteTransactions: async (input) =>
      await bulkDeleteTransactions(
        {
          ...getMutationDependencies(),
          transactions: dependencies.transactions,
        },
        input,
      ),
    updateTransaction: async (input) =>
      await updateTransaction(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
        },
        input,
      ),
    deleteTransaction: async (input) =>
      await deleteTransaction(
        {
          ...getMutationDependencies(),
          transactions: dependencies.transactions,
        },
        input,
      ),
    importData: async (input) =>
      await importData(
        {
          accounts: dependencies.accounts,
          categories: dependencies.categories,
          budgets: dependencies.budgets,
          templates: dependencies.transactionTemplates,
          recurringRules: dependencies.recurringRules,
          transactions: dependencies.transactions,
        },
        input,
      ),
    listAccounts: async (input = {}) =>
      await listAccounts(
        {
          accounts: dependencies.accounts,
        },
        input,
      ),
    listBudgets: async (input = {}) =>
      await listBudgets(
        {
          budgets: dependencies.budgets,
        },
        input,
      ),
    listTransactionTemplates: async (input = {}) =>
      await listTransactionTemplates(
        {
          templates: dependencies.transactionTemplates,
        },
        input,
      ),
    listRecurringRules: async (input = {}) =>
      await listRecurringRules(
        {
          recurringRules: dependencies.recurringRules,
        },
        input,
      ),
    listCategories: async (input = {}) =>
      await listCategories(
        {
          categories: dependencies.categories,
        },
        input,
      ),
    listTransactions: async (input) =>
      await listTransactions(
        {
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
        },
        input,
      ),
    getAccountSummary: async (input) =>
      await getAccountSummary(
        {
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
        },
        input,
      ),
    exportData: async () =>
      await exportData({
        accounts: dependencies.accounts,
        categories: dependencies.categories,
        budgets: dependencies.budgets,
        templates: dependencies.transactionTemplates,
        recurringRules: dependencies.recurringRules,
        transactions: dependencies.transactions,
        clock: dependencies.clock,
      }),
    runRecurringRules: async (input = {}) =>
      await runRecurringRules(
        {
          ...getMutationDependencies(),
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
          templates: dependencies.transactionTemplates,
          recurringRules: dependencies.recurringRules,
        },
        input,
      ),
  };
};
