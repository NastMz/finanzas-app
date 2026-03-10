import {
  createAccount,
  createBudget,
  createCategory,
  createMoney,
  createRecurringRule,
  createTransaction,
  createTransactionTemplate,
  type Account,
  type Budget,
  type Category,
  type RecurringRule,
  type Transaction,
  type TransactionTemplate,
} from "@finanzas/domain";

import type {
  ImportedAccountSnapshot,
  ImportedBudgetSnapshot,
  ImportedCategorySnapshot,
  ImportedRecurringRuleSnapshot,
  ImportedTransactionSnapshot,
  ImportedTransactionTemplateSnapshot,
} from "./types.js";

export const restoreAccountFromImportSnapshot = (
  snapshot: ImportedAccountSnapshot,
): Account => ({
  ...createAccount({
    id: snapshot.id,
    name: snapshot.name,
    type: snapshot.type,
    currency: snapshot.currency,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreCategoryFromImportSnapshot = (
  snapshot: ImportedCategorySnapshot,
): Category => ({
  ...createCategory({
    id: snapshot.id,
    name: snapshot.name,
    type: snapshot.type,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreBudgetFromImportSnapshot = (
  snapshot: ImportedBudgetSnapshot,
): Budget => ({
  ...createBudget({
    id: snapshot.id,
    categoryId: snapshot.categoryId,
    period: snapshot.period,
    limit: createMoney(snapshot.limitAmountMinor, snapshot.currency),
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreTransactionTemplateFromImportSnapshot = (
  snapshot: ImportedTransactionTemplateSnapshot,
  account: Account,
): TransactionTemplate => ({
  ...createTransactionTemplate(
    {
      id: snapshot.id,
      name: snapshot.name,
      accountId: snapshot.accountId,
      amount: createMoney(snapshot.amountMinor, snapshot.currency),
      categoryId: snapshot.categoryId,
      ...(snapshot.note !== null ? { note: snapshot.note } : {}),
      tags: snapshot.tags,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    },
    account,
  ),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreRecurringRuleFromImportSnapshot = (
  snapshot: ImportedRecurringRuleSnapshot,
): RecurringRule => ({
  ...createRecurringRule({
    id: snapshot.id,
    templateId: snapshot.templateId,
    schedule: snapshot.schedule,
    startsOn: snapshot.startsOn,
    nextRunOn: snapshot.nextRunOn,
    lastGeneratedOn: snapshot.lastGeneratedOn,
    isActive: snapshot.isActive,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreTransactionFromImportSnapshot = (
  snapshot: ImportedTransactionSnapshot,
  account: Account,
): Transaction => ({
  ...createTransaction(
    {
      id: snapshot.id,
      accountId: snapshot.accountId,
      amount: createMoney(snapshot.amountMinor, snapshot.currency),
      date: snapshot.date,
      categoryId: snapshot.categoryId,
      ...(snapshot.note !== null ? { note: snapshot.note } : {}),
      tags: snapshot.tags,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    },
    account,
  ),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});
