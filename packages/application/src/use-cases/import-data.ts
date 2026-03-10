import type { Budget, Category } from "@finanzas/domain";

import type {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  RecurringRuleRepository,
  TransactionRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import { ApplicationError } from "../errors.js";
import {
  parseDataImportBundle,
  restoreAccountFromImportSnapshot,
  restoreBudgetFromImportSnapshot,
  restoreCategoryFromImportSnapshot,
  restoreRecurringRuleFromImportSnapshot,
  restoreTransactionFromImportSnapshot,
  restoreTransactionTemplateFromImportSnapshot,
} from "./shared/data-bundle.js";

export interface ImportDataInput {
  bundle: unknown;
}

export interface ImportDataDependencies {
  accounts: AccountRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  templates: TransactionTemplateRepository;
  recurringRules: RecurringRuleRepository;
  transactions: TransactionRepository;
}

export interface ImportDataResult {
  exportedAt: Date;
  counts: {
    accounts: number;
    categories: number;
    budgets: number;
    transactionTemplates: number;
    recurringRules: number;
    transactions: number;
  };
}

export const importData = async (
  dependencies: ImportDataDependencies,
  input: ImportDataInput,
): Promise<ImportDataResult> => {
  const bundle = parseDataImportBundle(input.bundle);
  const accounts = bundle.accounts.map(restoreAccountFromImportSnapshot);
  const categories = bundle.categories.map(restoreCategoryFromImportSnapshot);
  const budgets = bundle.budgets.map(restoreBudgetFromImportSnapshot);
  const accountsById = toMap(accounts);

  const templates = bundle.transactionTemplates.map((snapshot) => {
    const account = accountsById.get(snapshot.accountId);

    if (!account) {
      throw new ApplicationError(
        `Transaction template ${snapshot.id} references unknown account ${snapshot.accountId}.`,
      );
    }

    return restoreTransactionTemplateFromImportSnapshot(snapshot, account);
  });

  const templatesById = toMap(templates);
  const recurringRules = bundle.recurringRules.map((snapshot) => {
    if (!templatesById.has(snapshot.templateId)) {
      throw new ApplicationError(
        `Recurring rule ${snapshot.id} references unknown template ${snapshot.templateId}.`,
      );
    }

    return restoreRecurringRuleFromImportSnapshot(snapshot);
  });

  const transactions = bundle.transactions.map((snapshot) => {
    const account = accountsById.get(snapshot.accountId);

    if (!account) {
      throw new ApplicationError(
        `Transaction ${snapshot.id} references unknown account ${snapshot.accountId}.`,
      );
    }

    return restoreTransactionFromImportSnapshot(snapshot, account);
  });

  validateImportedBudgets(categories, budgets);

  await dependencies.accounts.replaceAll(accounts);
  await dependencies.categories.replaceAll(categories);
  await dependencies.budgets.replaceAll(budgets);
  await dependencies.templates.replaceAll(templates);
  await dependencies.recurringRules.replaceAll(recurringRules);
  await dependencies.transactions.replaceAll(transactions);

  return {
    exportedAt: bundle.exportedAt,
    counts: {
      accounts: accounts.length,
      categories: categories.length,
      budgets: budgets.length,
      transactionTemplates: templates.length,
      recurringRules: recurringRules.length,
      transactions: transactions.length,
    },
  };
};

const validateImportedBudgets = (
  categories: Category[],
  budgets: Budget[],
): void => {
  const categoriesById = toMap(categories);
  const activeBudgetKeys = new Set<string>();

  for (const budget of budgets) {
    const category = categoriesById.get(budget.categoryId);

    if (!category) {
      throw new ApplicationError(
        `Budget ${budget.id} references unknown category ${budget.categoryId}.`,
      );
    }

    if (category.type !== "expense") {
      throw new ApplicationError(
        `Budget ${budget.id} must reference an expense category.`,
      );
    }

    if (budget.deletedAt !== null) {
      continue;
    }

    const budgetKey = `${budget.categoryId}:${budget.period}`;

    if (activeBudgetKeys.has(budgetKey)) {
      throw new ApplicationError(
        `Import bundle contains multiple active budgets for category ${budget.categoryId} and period ${budget.period}.`,
      );
    }

    activeBudgetKeys.add(budgetKey);
  }
};

const toMap = <Entity extends { id: string }>(entities: Entity[]): Map<string, Entity> =>
  new Map(entities.map((entity) => [entity.id, entity]));
