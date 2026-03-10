import {
  type addAccount,
  type addBudget,
  type addCategory,
  type addRecurringRule,
  type addTransaction,
  type addTransactionTemplate,
  type bulkDeleteTransactions,
  type bulkUpdateTransactions,
  type deleteAccount,
  type deleteBudget,
  type deleteCategory,
  type deleteRecurringRule,
  type deleteTransaction,
  type deleteTransactionTemplate,
  type getAccountSummary,
  type importData,
  type listAccounts,
  type listBudgets,
  type listCategories,
  type listRecurringRules,
  type listTransactions,
  type listTransactionTemplates,
  type runRecurringRules,
  type updateAccount,
  type updateBudget,
  type updateCategory,
  type updateRecurringRule,
  type updateTransaction,
  type updateTransactionTemplate,
  type AddAccountInput,
  type AddBudgetInput,
  type AddCategoryInput,
  type AddRecurringRuleInput,
  type AddTransactionInput,
  type AddTransactionTemplateInput,
  type BulkDeleteTransactionsInput,
  type BulkUpdateTransactionsInput,
  type DeleteAccountInput,
  type DeleteBudgetInput,
  type DeleteCategoryInput,
  type DeleteRecurringRuleInput,
  type DeleteTransactionInput,
  type DeleteTransactionTemplateInput,
  type ExportDataResult,
  type GetAccountSummaryInput,
  type IdGenerator,
  type ImportDataInput,
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
import { type getSyncStatus as runGetSyncStatus, type syncNow as runSyncNow, type SyncApiClient } from "@finanzas/sync";

import type { InMemoryAppContext } from "../in-memory-context.js";

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
  bulkUpdateTransactions(
    input: BulkUpdateTransactionsInput,
  ): ReturnType<typeof bulkUpdateTransactions>;
  bulkDeleteTransactions(
    input: BulkDeleteTransactionsInput,
  ): ReturnType<typeof bulkDeleteTransactions>;
  updateTransaction(
    input: UpdateTransactionInput,
  ): ReturnType<typeof updateTransaction>;
  deleteTransaction(
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction>;
  importData(input: ImportDataInput): ReturnType<typeof importData>;
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
  exportData(): Promise<ExportDataResult>;
  runRecurringRules(
    input?: RunRecurringRulesInput,
  ): ReturnType<typeof runRecurringRules>;
  getSyncStatus(): ReturnType<typeof runGetSyncStatus>;
  syncNow(): ReturnType<typeof runSyncNow>;
}

export interface CreateInMemoryBootstrapOptions {
  defaultDeviceId: string;
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
  context?: InMemoryAppContext;
}

export type InMemoryBootstrapCommandHandlers = Pick<
InMemoryBootstrap,
| "addAccount"
| "updateAccount"
| "deleteAccount"
| "addBudget"
| "updateBudget"
| "deleteBudget"
| "addTransactionTemplate"
| "updateTransactionTemplate"
| "deleteTransactionTemplate"
| "addRecurringRule"
| "updateRecurringRule"
| "deleteRecurringRule"
| "addCategory"
| "updateCategory"
| "deleteCategory"
| "addTransaction"
| "bulkUpdateTransactions"
| "bulkDeleteTransactions"
| "updateTransaction"
| "deleteTransaction"
| "importData"
| "runRecurringRules"
| "syncNow"
>;

export type InMemoryBootstrapQueryHandlers = Pick<
InMemoryBootstrap,
| "listAccounts"
| "listBudgets"
| "listTransactionTemplates"
| "listRecurringRules"
| "listCategories"
| "listTransactions"
| "getAccountSummary"
| "exportData"
| "getSyncStatus"
>;
