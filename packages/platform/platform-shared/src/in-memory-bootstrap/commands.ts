import {
  addAccount,
  addBudget,
  addCategory,
  addRecurringRule,
  addTransaction,
  addTransactionTemplate,
  bulkDeleteTransactions,
  bulkUpdateTransactions,
  deleteAccount,
  deleteBudget,
  deleteCategory,
  deleteRecurringRule,
  deleteTransaction,
  deleteTransactionTemplate,
  importData,
  runRecurringRules,
  updateAccount,
  updateBudget,
  updateCategory,
  updateRecurringRule,
  updateTransaction,
  updateTransactionTemplate,
} from "@finanzas/application";
import { syncNow as runSyncNow } from "@finanzas/sync";

import type { InMemoryBootstrapCommandHandlers } from "./types.js";
import type { InMemoryBootstrapRuntime } from "./runtime.js";

export const createInMemoryBootstrapCommands = (
  runtime: InMemoryBootstrapRuntime,
): InMemoryBootstrapCommandHandlers => {
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
    changeApplier,
    ids,
    deviceId,
    syncApi,
  } = runtime;

  return {
    addAccount: (input) =>
      addAccount(
        {
          accounts,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateAccount: (input) =>
      updateAccount(
        {
          accounts,
          transactions,
          templates: transactionTemplates,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteAccount: (input) =>
      deleteAccount(
        {
          accounts,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    addBudget: (input) =>
      addBudget(
        {
          budgets,
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateBudget: (input) =>
      updateBudget(
        {
          budgets,
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteBudget: (input) =>
      deleteBudget(
        {
          budgets,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    addTransactionTemplate: (input) =>
      addTransactionTemplate(
        {
          accounts,
          templates: transactionTemplates,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateTransactionTemplate: (input) =>
      updateTransactionTemplate(
        {
          accounts,
          templates: transactionTemplates,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteTransactionTemplate: (input) =>
      deleteTransactionTemplate(
        {
          templates: transactionTemplates,
          recurringRules,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    addRecurringRule: (input) =>
      addRecurringRule(
        {
          recurringRules,
          templates: transactionTemplates,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateRecurringRule: (input) =>
      updateRecurringRule(
        {
          recurringRules,
          templates: transactionTemplates,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteRecurringRule: (input) =>
      deleteRecurringRule(
        {
          recurringRules,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    addCategory: (input) =>
      addCategory(
        {
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateCategory: (input) =>
      updateCategory(
        {
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteCategory: (input) =>
      deleteCategory(
        {
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    addTransaction: (input) =>
      addTransaction(
        {
          accounts,
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    bulkUpdateTransactions: (input) =>
      bulkUpdateTransactions(
        {
          accounts,
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    bulkDeleteTransactions: (input) =>
      bulkDeleteTransactions(
        {
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateTransaction: (input) =>
      updateTransaction(
        {
          accounts,
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteTransaction: (input) =>
      deleteTransaction(
        {
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    importData: async (input) => {
      const result = await importData(
        {
          accounts,
          categories,
          budgets,
          templates: transactionTemplates,
          recurringRules,
          transactions,
        },
        input,
      );

      await outbox.replaceAll([]);
      await syncState.setCursor("0");

      return result;
    },
    runRecurringRules: (input = {}) =>
      runRecurringRules(
        {
          accounts,
          transactions,
          templates: transactionTemplates,
          recurringRules,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    syncNow: () =>
      runSyncNow({
        outbox,
        api: syncApi,
        syncState,
        changeApplier,
        deviceId,
      }),
  };
};
