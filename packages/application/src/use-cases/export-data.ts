import type {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  Clock,
  RecurringRuleRepository,
  TransactionRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import {
  buildDataExportBundle,
  type DataExportBundle,
} from "./shared/data-bundle.js";

export interface ExportDataDependencies {
  accounts: AccountRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  templates: TransactionTemplateRepository;
  recurringRules: RecurringRuleRepository;
  transactions: TransactionRepository;
  clock: Clock;
}

export interface ExportDataResult {
  bundle: DataExportBundle;
}

export const exportData = async (
  dependencies: ExportDataDependencies,
): Promise<ExportDataResult> => {
  const [accounts, categories, budgets, templates, recurringRules, transactions] =
    await Promise.all([
      dependencies.accounts.listAll(),
      dependencies.categories.listAll(),
      dependencies.budgets.listAll(),
      dependencies.templates.listAll(),
      dependencies.recurringRules.listAll(),
      dependencies.transactions.listAll(),
    ]);

  return {
    bundle: buildDataExportBundle({
      exportedAt: dependencies.clock.now(),
      accounts,
      categories,
      budgets,
      transactionTemplates: templates,
      recurringRules,
      transactions,
    }),
  };
};
