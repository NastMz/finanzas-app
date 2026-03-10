import type {
  Account,
  Budget,
  Category,
  RecurringRule,
  Transaction,
  TransactionTemplate,
} from "@finanzas/domain";

import type {
  DataExportBundle,
  ExportedAccountSnapshot,
  ExportedBudgetSnapshot,
  ExportedCategorySnapshot,
  ExportedRecurringRuleSnapshot,
  ExportedTransactionSnapshot,
  ExportedTransactionTemplateSnapshot,
} from "./types.js";
import { DATA_BUNDLE_FORMAT, DATA_BUNDLE_VERSION } from "./types.js";

export const buildDataExportBundle = (input: {
  exportedAt: Date;
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  transactionTemplates: TransactionTemplate[];
  recurringRules: RecurringRule[];
  transactions: Transaction[];
}): DataExportBundle => ({
  format: DATA_BUNDLE_FORMAT,
  version: DATA_BUNDLE_VERSION,
  exportedAt: input.exportedAt.toISOString(),
  entities: {
    accounts: sortById(input.accounts).map(serializeAccountSnapshot),
    categories: sortById(input.categories).map(serializeCategorySnapshot),
    budgets: sortById(input.budgets).map(serializeBudgetSnapshot),
    transactionTemplates: sortById(input.transactionTemplates).map(
      serializeTransactionTemplateSnapshot,
    ),
    recurringRules: sortById(input.recurringRules).map(serializeRecurringRuleSnapshot),
    transactions: sortById(input.transactions).map(serializeTransactionSnapshot),
  },
});

const serializeAccountSnapshot = (account: Account): ExportedAccountSnapshot => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
  deletedAt: account.deletedAt ? account.deletedAt.toISOString() : null,
  version: account.version,
});

const serializeCategorySnapshot = (
  category: Category,
): ExportedCategorySnapshot => ({
  id: category.id,
  name: category.name,
  type: category.type,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
  deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
  version: category.version,
});

const serializeBudgetSnapshot = (budget: Budget): ExportedBudgetSnapshot => ({
  id: budget.id,
  categoryId: budget.categoryId,
  period: budget.period,
  limitAmountMinor: budget.limit.amountMinor.toString(),
  currency: budget.limit.currency,
  createdAt: budget.createdAt.toISOString(),
  updatedAt: budget.updatedAt.toISOString(),
  deletedAt: budget.deletedAt ? budget.deletedAt.toISOString() : null,
  version: budget.version,
});

const serializeTransactionTemplateSnapshot = (
  template: TransactionTemplate,
): ExportedTransactionTemplateSnapshot => ({
  id: template.id,
  name: template.name,
  accountId: template.accountId,
  amountMinor: template.amount.amountMinor.toString(),
  currency: template.amount.currency,
  categoryId: template.categoryId,
  note: template.note,
  tags: template.tags,
  createdAt: template.createdAt.toISOString(),
  updatedAt: template.updatedAt.toISOString(),
  deletedAt: template.deletedAt ? template.deletedAt.toISOString() : null,
  version: template.version,
});

const serializeRecurringRuleSnapshot = (
  rule: RecurringRule,
): ExportedRecurringRuleSnapshot => ({
  id: rule.id,
  templateId: rule.templateId,
  schedule: rule.schedule,
  startsOn: rule.startsOn.toISOString(),
  nextRunOn: rule.nextRunOn.toISOString(),
  lastGeneratedOn: rule.lastGeneratedOn ? rule.lastGeneratedOn.toISOString() : null,
  isActive: rule.isActive,
  createdAt: rule.createdAt.toISOString(),
  updatedAt: rule.updatedAt.toISOString(),
  deletedAt: rule.deletedAt ? rule.deletedAt.toISOString() : null,
  version: rule.version,
});

const serializeTransactionSnapshot = (
  transaction: Transaction,
): ExportedTransactionSnapshot => ({
  id: transaction.id,
  accountId: transaction.accountId,
  amountMinor: transaction.amount.amountMinor.toString(),
  currency: transaction.amount.currency,
  date: transaction.date.toISOString(),
  categoryId: transaction.categoryId,
  note: transaction.note,
  tags: transaction.tags,
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
  deletedAt: transaction.deletedAt ? transaction.deletedAt.toISOString() : null,
  version: transaction.version,
});

const sortById = <Entity extends { id: string }>(entities: Entity[]): Entity[] =>
  [...entities].sort((left, right) => left.id.localeCompare(right.id));
