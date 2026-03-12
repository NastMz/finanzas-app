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
} from "./ports.js";
import {
  addAccount,
  type AddAccountInput,
} from "./use-cases/add-account.js";
import {
  addBudget,
  type AddBudgetInput,
} from "./use-cases/add-budget.js";
import {
  addCategory,
  type AddCategoryInput,
} from "./use-cases/add-category.js";
import {
  addRecurringRule,
  type AddRecurringRuleInput,
} from "./use-cases/add-recurring-rule.js";
import {
  addTransaction,
  type AddTransactionInput,
} from "./use-cases/add-transaction.js";
import {
  addTransactionTemplate,
  type AddTransactionTemplateInput,
} from "./use-cases/add-transaction-template.js";
import {
  bulkDeleteTransactions,
  type BulkDeleteTransactionsInput,
} from "./use-cases/bulk-delete-transactions.js";
import {
  bulkUpdateTransactions,
  type BulkUpdateTransactionsInput,
} from "./use-cases/bulk-update-transactions.js";
import {
  deleteAccount,
  type DeleteAccountInput,
} from "./use-cases/delete-account.js";
import {
  deleteBudget,
  type DeleteBudgetInput,
} from "./use-cases/delete-budget.js";
import {
  deleteCategory,
  type DeleteCategoryInput,
} from "./use-cases/delete-category.js";
import {
  deleteRecurringRule,
  type DeleteRecurringRuleInput,
} from "./use-cases/delete-recurring-rule.js";
import {
  deleteTransaction,
  type DeleteTransactionInput,
} from "./use-cases/delete-transaction.js";
import {
  deleteTransactionTemplate,
  type DeleteTransactionTemplateInput,
} from "./use-cases/delete-transaction-template.js";
import { exportData } from "./use-cases/export-data.js";
import {
  getAccountSummary,
  type GetAccountSummaryInput,
} from "./use-cases/get-account-summary.js";
import {
  importData,
  type ImportDataInput,
} from "./use-cases/import-data.js";
import {
  listAccounts,
  type ListAccountsInput,
} from "./use-cases/list-accounts.js";
import {
  listBudgets,
  type ListBudgetsInput,
} from "./use-cases/list-budgets.js";
import {
  listCategories,
  type ListCategoriesInput,
} from "./use-cases/list-categories.js";
import {
  listRecurringRules,
  type ListRecurringRulesInput,
} from "./use-cases/list-recurring-rules.js";
import {
  listTransactions,
  type ListTransactionsInput,
} from "./use-cases/list-transactions.js";
import {
  listTransactionTemplates,
  type ListTransactionTemplatesInput,
} from "./use-cases/list-transaction-templates.js";
import {
  runRecurringRules,
  type RunRecurringRulesInput,
} from "./use-cases/run-recurring-rules.js";
import {
  updateAccount,
  type UpdateAccountInput,
} from "./use-cases/update-account.js";
import {
  updateBudget,
  type UpdateBudgetInput,
} from "./use-cases/update-budget.js";
import {
  updateCategory,
  type UpdateCategoryInput,
} from "./use-cases/update-category.js";
import {
  updateRecurringRule,
  type UpdateRecurringRuleInput,
} from "./use-cases/update-recurring-rule.js";
import {
  updateTransaction,
  type UpdateTransactionInput,
} from "./use-cases/update-transaction.js";
import {
  updateTransactionTemplate,
  type UpdateTransactionTemplateInput,
} from "./use-cases/update-transaction-template.js";

export interface FinanzasApplicationServiceDependencies {
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

export class FinanzasApplicationService {
  public constructor(
    private readonly dependencies: FinanzasApplicationServiceDependencies,
  ) {}

  public readonly addAccount = (
    input: AddAccountInput,
  ): ReturnType<typeof addAccount> =>
    addAccount(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
      },
      input,
    );

  public readonly updateAccount = (
    input: UpdateAccountInput,
  ): ReturnType<typeof updateAccount> =>
    updateAccount(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
        transactions: this.dependencies.transactions,
        templates: this.dependencies.transactionTemplates,
      },
      input,
    );

  public readonly deleteAccount = (
    input: DeleteAccountInput,
  ): ReturnType<typeof deleteAccount> =>
    deleteAccount(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
      },
      input,
    );

  public readonly addBudget = (
    input: AddBudgetInput,
  ): ReturnType<typeof addBudget> =>
    addBudget(
      {
        ...this.getMutationDependencies(),
        budgets: this.dependencies.budgets,
        categories: this.dependencies.categories,
      },
      input,
    );

  public readonly updateBudget = (
    input: UpdateBudgetInput,
  ): ReturnType<typeof updateBudget> =>
    updateBudget(
      {
        ...this.getMutationDependencies(),
        budgets: this.dependencies.budgets,
        categories: this.dependencies.categories,
      },
      input,
    );

  public readonly deleteBudget = (
    input: DeleteBudgetInput,
  ): ReturnType<typeof deleteBudget> =>
    deleteBudget(
      {
        ...this.getMutationDependencies(),
        budgets: this.dependencies.budgets,
      },
      input,
    );

  public readonly addTransactionTemplate = (
    input: AddTransactionTemplateInput,
  ): ReturnType<typeof addTransactionTemplate> =>
    addTransactionTemplate(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
        templates: this.dependencies.transactionTemplates,
      },
      input,
    );

  public readonly updateTransactionTemplate = (
    input: UpdateTransactionTemplateInput,
  ): ReturnType<typeof updateTransactionTemplate> =>
    updateTransactionTemplate(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
        templates: this.dependencies.transactionTemplates,
      },
      input,
    );

  public readonly deleteTransactionTemplate = (
    input: DeleteTransactionTemplateInput,
  ): ReturnType<typeof deleteTransactionTemplate> =>
    deleteTransactionTemplate(
      {
        ...this.getMutationDependencies(),
        templates: this.dependencies.transactionTemplates,
        recurringRules: this.dependencies.recurringRules,
      },
      input,
    );

  public readonly addRecurringRule = (
    input: AddRecurringRuleInput,
  ): ReturnType<typeof addRecurringRule> =>
    addRecurringRule(
      {
        ...this.getMutationDependencies(),
        recurringRules: this.dependencies.recurringRules,
        templates: this.dependencies.transactionTemplates,
      },
      input,
    );

  public readonly updateRecurringRule = (
    input: UpdateRecurringRuleInput,
  ): ReturnType<typeof updateRecurringRule> =>
    updateRecurringRule(
      {
        ...this.getMutationDependencies(),
        recurringRules: this.dependencies.recurringRules,
        templates: this.dependencies.transactionTemplates,
      },
      input,
    );

  public readonly deleteRecurringRule = (
    input: DeleteRecurringRuleInput,
  ): ReturnType<typeof deleteRecurringRule> =>
    deleteRecurringRule(
      {
        ...this.getMutationDependencies(),
        recurringRules: this.dependencies.recurringRules,
      },
      input,
    );

  public readonly addCategory = (
    input: AddCategoryInput,
  ): ReturnType<typeof addCategory> =>
    addCategory(
      {
        ...this.getMutationDependencies(),
        categories: this.dependencies.categories,
      },
      input,
    );

  public readonly updateCategory = (
    input: UpdateCategoryInput,
  ): ReturnType<typeof updateCategory> =>
    updateCategory(
      {
        ...this.getMutationDependencies(),
        categories: this.dependencies.categories,
      },
      input,
    );

  public readonly deleteCategory = (
    input: DeleteCategoryInput,
  ): ReturnType<typeof deleteCategory> =>
    deleteCategory(
      {
        ...this.getMutationDependencies(),
        categories: this.dependencies.categories,
      },
      input,
    );

  public readonly addTransaction = (
    input: AddTransactionInput,
  ): ReturnType<typeof addTransaction> =>
    addTransaction(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly bulkUpdateTransactions = (
    input: BulkUpdateTransactionsInput,
  ): ReturnType<typeof bulkUpdateTransactions> =>
    bulkUpdateTransactions(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly bulkDeleteTransactions = (
    input: BulkDeleteTransactionsInput,
  ): ReturnType<typeof bulkDeleteTransactions> =>
    bulkDeleteTransactions(
      {
        ...this.getMutationDependencies(),
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly updateTransaction = (
    input: UpdateTransactionInput,
  ): ReturnType<typeof updateTransaction> =>
    updateTransaction(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly deleteTransaction = (
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction> =>
    deleteTransaction(
      {
        ...this.getMutationDependencies(),
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly importData = (
    input: ImportDataInput,
  ): ReturnType<typeof importData> =>
    importData(
      {
        accounts: this.dependencies.accounts,
        categories: this.dependencies.categories,
        budgets: this.dependencies.budgets,
        templates: this.dependencies.transactionTemplates,
        recurringRules: this.dependencies.recurringRules,
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly listAccounts = (
    input: ListAccountsInput = {},
  ): ReturnType<typeof listAccounts> =>
    listAccounts(
      {
        accounts: this.dependencies.accounts,
      },
      input,
    );

  public readonly listBudgets = (
    input: ListBudgetsInput = {},
  ): ReturnType<typeof listBudgets> =>
    listBudgets(
      {
        budgets: this.dependencies.budgets,
      },
      input,
    );

  public readonly listTransactionTemplates = (
    input: ListTransactionTemplatesInput = {},
  ): ReturnType<typeof listTransactionTemplates> =>
    listTransactionTemplates(
      {
        templates: this.dependencies.transactionTemplates,
      },
      input,
    );

  public readonly listRecurringRules = (
    input: ListRecurringRulesInput = {},
  ): ReturnType<typeof listRecurringRules> =>
    listRecurringRules(
      {
        recurringRules: this.dependencies.recurringRules,
      },
      input,
    );

  public readonly listCategories = (
    input: ListCategoriesInput = {},
  ): ReturnType<typeof listCategories> =>
    listCategories(
      {
        categories: this.dependencies.categories,
      },
      input,
    );

  public readonly listTransactions = (
    input: ListTransactionsInput,
  ): ReturnType<typeof listTransactions> =>
    listTransactions(
      {
        accounts: this.dependencies.accounts,
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly getAccountSummary = (
    input: GetAccountSummaryInput,
  ): ReturnType<typeof getAccountSummary> =>
    getAccountSummary(
      {
        accounts: this.dependencies.accounts,
        transactions: this.dependencies.transactions,
      },
      input,
    );

  public readonly exportData = (): ReturnType<typeof exportData> =>
    exportData({
      accounts: this.dependencies.accounts,
      categories: this.dependencies.categories,
      budgets: this.dependencies.budgets,
      templates: this.dependencies.transactionTemplates,
      recurringRules: this.dependencies.recurringRules,
      transactions: this.dependencies.transactions,
      clock: this.dependencies.clock,
    });

  public readonly runRecurringRules = (
    input: RunRecurringRulesInput = {},
  ): ReturnType<typeof runRecurringRules> =>
    runRecurringRules(
      {
        ...this.getMutationDependencies(),
        accounts: this.dependencies.accounts,
        transactions: this.dependencies.transactions,
        templates: this.dependencies.transactionTemplates,
        recurringRules: this.dependencies.recurringRules,
      },
      input,
    );

  private readonly getMutationDependencies = (): Pick<
  FinanzasApplicationServiceDependencies,
  "outbox" | "clock" | "ids" | "deviceId"
  > => ({
    outbox: this.dependencies.outbox,
    clock: this.dependencies.clock,
    ids: this.dependencies.ids,
    deviceId: this.dependencies.deviceId,
  });
}
