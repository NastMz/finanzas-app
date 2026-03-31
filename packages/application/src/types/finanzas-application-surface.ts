import type {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  Clock,
  IdGenerator,
  OutboxRepository,
  RecurringRuleRepository,
  TransactionRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import { type addAccount, type AddAccountInput } from "../use-cases/add-account.js";
import { type addBudget, type AddBudgetInput } from "../use-cases/add-budget.js";
import { type addCategory, type AddCategoryInput } from "../use-cases/add-category.js";
import {
  type addRecurringRule,
  type AddRecurringRuleInput,
} from "../use-cases/add-recurring-rule.js";
import {
  type addTransaction,
  type AddTransactionInput,
} from "../use-cases/add-transaction.js";
import {
  type addTransactionTemplate,
  type AddTransactionTemplateInput,
} from "../use-cases/add-transaction-template.js";
import {
  type bulkDeleteTransactions,
  type BulkDeleteTransactionsInput,
} from "../use-cases/bulk-delete-transactions.js";
import {
  type bulkUpdateTransactions,
  type BulkUpdateTransactionsInput,
} from "../use-cases/bulk-update-transactions.js";
import {
  type deleteAccount,
  type DeleteAccountInput,
} from "../use-cases/delete-account.js";
import {
  type deleteBudget,
  type DeleteBudgetInput,
} from "../use-cases/delete-budget.js";
import {
  type deleteCategory,
  type DeleteCategoryInput,
} from "../use-cases/delete-category.js";
import {
  type deleteRecurringRule,
  type DeleteRecurringRuleInput,
} from "../use-cases/delete-recurring-rule.js";
import {
  type deleteTransaction,
  type DeleteTransactionInput,
} from "../use-cases/delete-transaction.js";
import {
  type deleteTransactionTemplate,
  type DeleteTransactionTemplateInput,
} from "../use-cases/delete-transaction-template.js";
import { type exportData } from "../use-cases/export-data.js";
import {
  type getAccountSummary,
  type GetAccountSummaryInput,
} from "../use-cases/get-account-summary.js";
import {
  type importData,
  type ImportDataInput,
} from "../use-cases/import-data.js";
import {
  type listAccounts,
  type ListAccountsInput,
} from "../use-cases/list-accounts.js";
import {
  type listBudgets,
  type ListBudgetsInput,
} from "../use-cases/list-budgets.js";
import {
  type listCategories,
  type ListCategoriesInput,
} from "../use-cases/list-categories.js";
import {
  type listRecurringRules,
  type ListRecurringRulesInput,
} from "../use-cases/list-recurring-rules.js";
import {
  type listTransactions,
  type ListTransactionsInput,
} from "../use-cases/list-transactions.js";
import {
  type listTransactionTemplates,
  type ListTransactionTemplatesInput,
} from "../use-cases/list-transaction-templates.js";
import {
  type runRecurringRules,
  type RunRecurringRulesInput,
} from "../use-cases/run-recurring-rules.js";
import {
  type updateAccount,
  type UpdateAccountInput,
} from "../use-cases/update-account.js";
import {
  type updateBudget,
  type UpdateBudgetInput,
} from "../use-cases/update-budget.js";
import {
  type updateCategory,
  type UpdateCategoryInput,
} from "../use-cases/update-category.js";
import {
  type updateRecurringRule,
  type UpdateRecurringRuleInput,
} from "../use-cases/update-recurring-rule.js";
import {
  type updateTransaction,
  type UpdateTransactionInput,
} from "../use-cases/update-transaction.js";
import {
  type updateTransactionTemplate,
  type UpdateTransactionTemplateInput,
} from "../use-cases/update-transaction-template.js";

export interface FinanzasApplicationSurfaceDependencies {
  accounts: AccountRepository;
  budgets: BudgetRepository;
  categories: CategoryRepository;
  recurringRules: RecurringRuleRepository;
  transactions: TransactionRepository;
  transactionTemplates: TransactionTemplateRepository;
  outbox: OutboxRepository;
  clock: Clock;
  ids: IdGenerator;
  deviceId: string;
}

export interface FinanzasApplicationSurface {
  addAccount: (input: AddAccountInput) => ReturnType<typeof addAccount>;
  updateAccount: (input: UpdateAccountInput) => ReturnType<typeof updateAccount>;
  deleteAccount: (input: DeleteAccountInput) => ReturnType<typeof deleteAccount>;
  addBudget: (input: AddBudgetInput) => ReturnType<typeof addBudget>;
  updateBudget: (input: UpdateBudgetInput) => ReturnType<typeof updateBudget>;
  deleteBudget: (input: DeleteBudgetInput) => ReturnType<typeof deleteBudget>;
  addTransactionTemplate: (
    input: AddTransactionTemplateInput,
  ) => ReturnType<typeof addTransactionTemplate>;
  updateTransactionTemplate: (
    input: UpdateTransactionTemplateInput,
  ) => ReturnType<typeof updateTransactionTemplate>;
  deleteTransactionTemplate: (
    input: DeleteTransactionTemplateInput,
  ) => ReturnType<typeof deleteTransactionTemplate>;
  addRecurringRule: (
    input: AddRecurringRuleInput,
  ) => ReturnType<typeof addRecurringRule>;
  updateRecurringRule: (
    input: UpdateRecurringRuleInput,
  ) => ReturnType<typeof updateRecurringRule>;
  deleteRecurringRule: (
    input: DeleteRecurringRuleInput,
  ) => ReturnType<typeof deleteRecurringRule>;
  addCategory: (input: AddCategoryInput) => ReturnType<typeof addCategory>;
  updateCategory: (input: UpdateCategoryInput) => ReturnType<typeof updateCategory>;
  deleteCategory: (input: DeleteCategoryInput) => ReturnType<typeof deleteCategory>;
  addTransaction: (input: AddTransactionInput) => ReturnType<typeof addTransaction>;
  bulkUpdateTransactions: (
    input: BulkUpdateTransactionsInput,
  ) => ReturnType<typeof bulkUpdateTransactions>;
  bulkDeleteTransactions: (
    input: BulkDeleteTransactionsInput,
  ) => ReturnType<typeof bulkDeleteTransactions>;
  updateTransaction: (
    input: UpdateTransactionInput,
  ) => ReturnType<typeof updateTransaction>;
  deleteTransaction: (
    input: DeleteTransactionInput,
  ) => ReturnType<typeof deleteTransaction>;
  importData: (input: ImportDataInput) => ReturnType<typeof importData>;
  listAccounts: (input?: ListAccountsInput) => ReturnType<typeof listAccounts>;
  listBudgets: (input?: ListBudgetsInput) => ReturnType<typeof listBudgets>;
  listTransactionTemplates: (
    input?: ListTransactionTemplatesInput,
  ) => ReturnType<typeof listTransactionTemplates>;
  listRecurringRules: (
    input?: ListRecurringRulesInput,
  ) => ReturnType<typeof listRecurringRules>;
  listCategories: (input?: ListCategoriesInput) => ReturnType<typeof listCategories>;
  listTransactions: (
    input: ListTransactionsInput,
  ) => ReturnType<typeof listTransactions>;
  getAccountSummary: (
    input: GetAccountSummaryInput,
  ) => ReturnType<typeof getAccountSummary>;
  exportData: () => ReturnType<typeof exportData>;
  runRecurringRules: (
    input?: RunRecurringRulesInput,
  ) => ReturnType<typeof runRecurringRules>;
}
