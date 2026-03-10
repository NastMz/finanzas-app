import {
  addAccount,
  addBudget,
  addCategory,
  addRecurringRule,
  addTransaction,
  addTransactionTemplate,
  deleteAccount,
  deleteBudget,
  deleteCategory,
  deleteRecurringRule,
  deleteTransaction,
  deleteTransactionTemplate,
  getAccountSummary,
  listAccounts,
  listBudgets,
  listCategories,
  listRecurringRules,
  listTransactions,
  listTransactionTemplates,
  runRecurringRules,
  updateAccount,
  updateBudget,
  updateCategory,
  updateRecurringRule,
  updateTransaction,
  updateTransactionTemplate,
  type IdGenerator,
  type AddAccountInput,
  type AddBudgetInput,
  type AddCategoryInput,
  type AddRecurringRuleInput,
  type AddTransactionInput,
  type AddTransactionTemplateInput,
  type DeleteAccountInput,
  type DeleteBudgetInput,
  type DeleteCategoryInput,
  type DeleteRecurringRuleInput,
  type DeleteTransactionInput,
  type DeleteTransactionTemplateInput,
  type GetAccountSummaryInput,
  type ListAccountsInput,
  type ListBudgetsInput,
  type ListCategoriesInput,
  type ListRecurringRulesInput,
  type ListTransactionsInput,
  type ListTransactionTemplatesInput,
  type RunRecurringRulesInput,
  type UpdateAccountInput,
  type UpdateBudgetInput,
  type UpdateCategoryInput,
  type UpdateRecurringRuleInput,
  type UpdateTransactionInput,
  type UpdateTransactionTemplateInput,
} from "@finanzas/application";
import { createUlidIdGenerator } from "@finanzas/data";
import {
  createInMemorySyncApiClient,
  getSyncStatus as runGetSyncStatus,
  syncNow as runSyncNow,
  type SyncApiClient,
} from "@finanzas/sync";

import { createInMemoryAppContext, type InMemoryAppContext } from "./in-memory-context.js";

/**
 * Shared host bootstrap contract.
 */
export interface InMemoryBootstrap {
  addAccount(input: AddAccountInput): ReturnType<typeof addAccount>;
  updateAccount(input: UpdateAccountInput): ReturnType<typeof updateAccount>;
  deleteAccount(input: DeleteAccountInput): ReturnType<typeof deleteAccount>;
  addBudget(input: AddBudgetInput): ReturnType<typeof addBudget>;
  updateBudget(input: UpdateBudgetInput): ReturnType<typeof updateBudget>;
  deleteBudget(input: DeleteBudgetInput): ReturnType<typeof deleteBudget>;
  addTransactionTemplate(
    input: AddTransactionTemplateInput,
  ): ReturnType<typeof addTransactionTemplate>;
  updateTransactionTemplate(
    input: UpdateTransactionTemplateInput,
  ): ReturnType<typeof updateTransactionTemplate>;
  deleteTransactionTemplate(
    input: DeleteTransactionTemplateInput,
  ): ReturnType<typeof deleteTransactionTemplate>;
  addRecurringRule(input: AddRecurringRuleInput): ReturnType<typeof addRecurringRule>;
  updateRecurringRule(
    input: UpdateRecurringRuleInput,
  ): ReturnType<typeof updateRecurringRule>;
  deleteRecurringRule(
    input: DeleteRecurringRuleInput,
  ): ReturnType<typeof deleteRecurringRule>;
  addCategory(input: AddCategoryInput): ReturnType<typeof addCategory>;
  updateCategory(input: UpdateCategoryInput): ReturnType<typeof updateCategory>;
  deleteCategory(input: DeleteCategoryInput): ReturnType<typeof deleteCategory>;
  addTransaction(input: AddTransactionInput): ReturnType<typeof addTransaction>;
  updateTransaction(
    input: UpdateTransactionInput,
  ): ReturnType<typeof updateTransaction>;
  deleteTransaction(
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction>;
  listAccounts(input?: ListAccountsInput): ReturnType<typeof listAccounts>;
  listBudgets(input?: ListBudgetsInput): ReturnType<typeof listBudgets>;
  listTransactionTemplates(
    input?: ListTransactionTemplatesInput,
  ): ReturnType<typeof listTransactionTemplates>;
  listRecurringRules(
    input?: ListRecurringRulesInput,
  ): ReturnType<typeof listRecurringRules>;
  listCategories(input?: ListCategoriesInput): ReturnType<typeof listCategories>;
  listTransactions(input: ListTransactionsInput): ReturnType<typeof listTransactions>;
  getAccountSummary(
    input: GetAccountSummaryInput,
  ): ReturnType<typeof getAccountSummary>;
  runRecurringRules(
    input?: RunRecurringRulesInput,
  ): ReturnType<typeof runRecurringRules>;
  getSyncStatus(): ReturnType<typeof runGetSyncStatus>;
  syncNow(): ReturnType<typeof runSyncNow>;
}

/**
 * Config for creating a shared in-memory host bootstrap.
 */
export interface CreateInMemoryBootstrapOptions {
  defaultDeviceId: string;
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
  context?: InMemoryAppContext;
}

/**
 * Creates a reusable in-memory bootstrap with application use cases + sync engine.
 */
export const createInMemoryBootstrap = (
  options: CreateInMemoryBootstrapOptions,
): InMemoryBootstrap => {
  const context = options.context ?? createInMemoryAppContext();
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
  } = context;
  const syncApi = options.syncApi ?? createInMemorySyncApiClient(clock);
  const deviceId = options.deviceId ?? options.defaultDeviceId;
  const ids =
    options.ids ??
    createUlidIdGenerator({
      namespace: deviceId,
    });

  return {
    addAccount: (input: AddAccountInput) =>
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
    updateAccount: (input: UpdateAccountInput) =>
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
    deleteAccount: (input: DeleteAccountInput) =>
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
    addBudget: (input: AddBudgetInput) =>
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
    updateBudget: (input: UpdateBudgetInput) =>
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
    deleteBudget: (input: DeleteBudgetInput) =>
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
    addTransactionTemplate: (input: AddTransactionTemplateInput) =>
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
    updateTransactionTemplate: (input: UpdateTransactionTemplateInput) =>
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
    deleteTransactionTemplate: (input: DeleteTransactionTemplateInput) =>
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
    addRecurringRule: (input: AddRecurringRuleInput) =>
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
    updateRecurringRule: (input: UpdateRecurringRuleInput) =>
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
    deleteRecurringRule: (input: DeleteRecurringRuleInput) =>
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
    addCategory: (input: AddCategoryInput) =>
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
    updateCategory: (input: UpdateCategoryInput) =>
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
    deleteCategory: (input: DeleteCategoryInput) =>
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
    addTransaction: (input: AddTransactionInput) =>
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
    updateTransaction: (input: UpdateTransactionInput) =>
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
    deleteTransaction: (input: DeleteTransactionInput) =>
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
    listAccounts: (input: ListAccountsInput = {}) =>
      listAccounts(
        {
          accounts,
        },
        input,
      ),
    listBudgets: (input: ListBudgetsInput = {}) =>
      listBudgets(
        {
          budgets,
        },
        input,
      ),
    listTransactionTemplates: (input: ListTransactionTemplatesInput = {}) =>
      listTransactionTemplates(
        {
          templates: transactionTemplates,
        },
        input,
      ),
    listRecurringRules: (input: ListRecurringRulesInput = {}) =>
      listRecurringRules(
        {
          recurringRules,
        },
        input,
      ),
    listCategories: (input: ListCategoriesInput = {}) =>
      listCategories(
        {
          categories,
        },
        input,
      ),
    listTransactions: (input: ListTransactionsInput) =>
      listTransactions(
        {
          accounts,
          transactions,
        },
        input,
      ),
    runRecurringRules: (input: RunRecurringRulesInput = {}) =>
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
    getAccountSummary: (input: GetAccountSummaryInput) =>
      getAccountSummary(
        {
          accounts,
          transactions,
        },
        input,
      ),
    getSyncStatus: () =>
      runGetSyncStatus({
        outbox,
        syncState,
      }),
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
