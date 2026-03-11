import type { AddTransactionInput } from "@finanzas/application";
import type { SyncNowResult } from "@finanzas/sync";

import type {
  FinanzasAccountTabViewModel,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
} from "../models/finanzas-ui-types.js";
import type {
  CreateFinanzasUiServiceOptions,
  FinanzasUiDependencies,
  FinanzasUiService,
  LoadHomeTabInput,
  LoadMovementsTabInput,
  LoadRegisterTabInput,
  QuickAddTransactionInput,
  QuickAddTransactionResult,
  SyncNowActionResult,
} from "./create-finanzas-ui-service/contracts/index.js";
import { FinanzasUiError } from "./create-finanzas-ui-service/contracts/index.js";
import {
  buildCategoryNameById,
  resolveActiveAccount,
  toAccountOption,
  toCategoryOption,
} from "./create-finanzas-ui-service/lib/accounts.js";
import { resolvePeriod } from "./create-finanzas-ui-service/lib/periods.js";
import {
  getErrorMessage,
  toSyncStatusViewModel,
} from "./create-finanzas-ui-service/lib/sync.js";
import {
  dedupeStrings,
  getTotalsFromTransactionItems,
  normalizeSignedAmount,
  toTransactionItemViewModel,
} from "./create-finanzas-ui-service/lib/transactions.js";

export * from "./create-finanzas-ui-service/contracts/index.js";

/**
 * Creates a headless UI service over `commands`/`queries`.
 */
export const createFinanzasUiService = (
  dependencies: FinanzasUiDependencies,
  options: CreateFinanzasUiServiceOptions = {},
): FinanzasUiService => {
  const now = options.now ?? (() => new Date());

  return {
    loadHomeTab: async (
      input: LoadHomeTabInput = {},
    ): Promise<FinanzasHomeTabViewModel> => {
      const account = await resolveActiveAccount(dependencies, input.accountId);
      const period = resolvePeriod(input.period, now());

      const [summary, categoriesResult, syncStatus] = await Promise.all([
        dependencies.queries.getAccountSummary({
          accountId: account.id,
          from: period.from,
          to: period.to,
          ...(input.recentLimit !== undefined
            ? { recentLimit: input.recentLimit }
            : {}),
          ...(input.topCategoriesLimit !== undefined
            ? { topCategoriesLimit: input.topCategoriesLimit }
            : {}),
        }),
        dependencies.queries.listCategories({
          includeDeleted: true,
        }),
        dependencies.queries.getSyncStatus(),
      ]);

      const categoryNameById = buildCategoryNameById(categoriesResult.categories);

      return {
        account: toAccountOption(account),
        period,
        totals: summary.totals,
        topExpenseCategories: summary.topExpenseCategories.map((category) => ({
          categoryId: category.categoryId,
          categoryName:
            categoryNameById.get(category.categoryId) ?? "Sin categoria",
          expenseMinor: category.expenseMinor,
        })),
        recentTransactions: summary.recentTransactions.map((transaction) =>
          toTransactionItemViewModel(transaction, categoryNameById),
        ),
        transactionCount: summary.transactionCount,
        sync: toSyncStatusViewModel(syncStatus),
      };
    },
    loadMovementsTab: async (
      input: LoadMovementsTabInput = {},
    ): Promise<FinanzasMovementsTabViewModel> => {
      const account = await resolveActiveAccount(dependencies, input.accountId);
      const includeDeleted = input.includeDeleted ?? false;

      const [transactionsResult, categoriesResult, syncStatus] = await Promise.all([
        dependencies.queries.listTransactions({
          accountId: account.id,
          includeDeleted,
          ...(input.limit !== undefined ? { limit: input.limit } : {}),
        }),
        dependencies.queries.listCategories({
          includeDeleted: true,
        }),
        dependencies.queries.getSyncStatus(),
      ]);

      const categoryNameById = buildCategoryNameById(categoriesResult.categories);
      const items = transactionsResult.transactions.map((transaction) =>
        toTransactionItemViewModel(transaction, categoryNameById),
      );

      return {
        account: toAccountOption(account),
        includeDeleted,
        items,
        totals: getTotalsFromTransactionItems(items),
        sync: toSyncStatusViewModel(syncStatus),
      };
    },
    loadRegisterTab: async (
      input: LoadRegisterTabInput = {},
    ): Promise<FinanzasRegisterTabViewModel> => {
      const account = await resolveActiveAccount(dependencies, input.accountId);
      const defaultDate = now();
      const period = resolvePeriod(undefined, defaultDate);
      const suggestedCategoryLimit = input.suggestedCategoryLimit ?? 3;

      const [categoriesResult, summary] = await Promise.all([
        dependencies.queries.listCategories(),
        dependencies.queries.getAccountSummary({
          accountId: account.id,
          from: period.from,
          to: period.to,
          recentLimit: 0,
          topCategoriesLimit: suggestedCategoryLimit,
        }),
      ]);

      const categories = categoriesResult.categories.map(toCategoryOption);
      const expenseCategories = categories.filter(
        (category) => category.type === "expense" && !category.deleted,
      );
      const suggestedSet = new Set(expenseCategories.map((category) => category.id));
      const suggestedFromSummary = summary.topExpenseCategories
        .map((category) => category.categoryId)
        .filter((categoryId) => suggestedSet.has(categoryId));
      const fallbackSuggestions = expenseCategories
        .slice(0, suggestedCategoryLimit)
        .map((category) => category.id);
      const suggestedCategoryIds = dedupeStrings([
        ...suggestedFromSummary,
        ...fallbackSuggestions,
      ]).slice(0, suggestedCategoryLimit);

      return {
        account: toAccountOption(account),
        defaultDate,
        categories,
        suggestedCategoryIds,
        defaultCategoryId: suggestedCategoryIds[0] ?? null,
      };
    },
    loadAccountTab: async (): Promise<FinanzasAccountTabViewModel> => {
      const [syncStatus, accountsResult, categoriesResult] = await Promise.all([
        dependencies.queries.getSyncStatus(),
        dependencies.queries.listAccounts({
          includeDeleted: true,
        }),
        dependencies.queries.listCategories({
          includeDeleted: true,
        }),
      ]);

      const accounts = accountsResult.accounts;
      const categories = categoriesResult.categories;

      return {
        sync: toSyncStatusViewModel(syncStatus),
        accounts: {
          total: accounts.length,
          active: accounts.filter((account) => account.deletedAt === null).length,
          deleted: accounts.filter((account) => account.deletedAt !== null).length,
        },
        categories: {
          total: categories.length,
          active: categories.filter((category) => category.deletedAt === null).length,
          deleted: categories.filter((category) => category.deletedAt !== null).length,
        },
      };
    },
    quickAddTransaction: async (
      input: QuickAddTransactionInput,
    ): Promise<QuickAddTransactionResult> => {
      const account = await resolveActiveAccount(dependencies, input.accountId);
      const categoryId = input.categoryId.trim();

      if (categoryId.length === 0) {
        throw new FinanzasUiError("Category id is required.");
      }

      const kind = input.kind ?? "expense";
      const signedAmountMinor = normalizeSignedAmount(input.amountMinor, kind);
      const addTransactionInput: AddTransactionInput = {
        accountId: account.id,
        amountMinor: signedAmountMinor,
        currency: account.currency,
        date: input.date ?? now(),
        categoryId,
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
      };

      const result = await dependencies.commands.addTransaction(addTransactionInput);
      const syncStatus = await dependencies.queries.getSyncStatus();

      return {
        transactionId: result.transaction.id,
        outboxOpId: result.outboxOpId,
        accountId: account.id,
        currency: account.currency,
        kind,
        signedAmountMinor,
        sync: toSyncStatusViewModel(syncStatus),
      };
    },
    syncNow: async (): Promise<SyncNowActionResult> => {
      let result: SyncNowResult | null = null;
      let error: string | null = null;

      try {
        result = await dependencies.commands.syncNow();
      } catch (syncError) {
        error = getErrorMessage(syncError);
      }

      const syncStatus = await dependencies.queries.getSyncStatus();

      return {
        ok: error === null,
        result,
        error,
        sync: toSyncStatusViewModel(syncStatus),
      };
    },
  };
};
