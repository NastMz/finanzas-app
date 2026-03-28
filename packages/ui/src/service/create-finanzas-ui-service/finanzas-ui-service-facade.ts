import type {
  AddTransactionInput,
  MovementsPageRequest,
  MovementsReviewFilters,
} from "@finanzas/application";
import { DEFAULT_MOVEMENTS_PAGE_LIMIT } from "@finanzas/application";
import type { SyncNowResult } from "@finanzas/sync";

import type {
  FinanzasAccountTabViewModel,
  FinanzasCategoryOption,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
} from "../../models/finanzas-ui-types.js";
import type {
  CreateFinanzasUiServiceOptions,
  FinanzasUiDependencies,
  FinanzasUiServiceContract,
  LoadHomeTabInput,
  LoadMovementsTabInput,
  LoadRegisterTabInput,
  QuickAddTransactionInput,
  QuickAddTransactionResult,
  SyncNowActionResult,
} from "./contracts/index.js";
import { FinanzasUiError } from "./contracts/index.js";
import {
  resolveCategoryManagementState,
} from "./lib/categories.js";
import {
  buildCategoryNameById,
  resolveActiveAccount,
  toAccountOption,
  toCategoryOption,
} from "./lib/accounts.js";
import { resolvePeriod } from "./lib/periods.js";
import {
  getErrorMessage,
  toSyncStatusViewModel,
} from "./lib/sync.js";
import {
  dedupeStrings,
  getTotalsFromTransactionItems,
  normalizeSignedAmount,
  toTransactionItemViewModel,
} from "./lib/transactions.js";

export class FinanzasUiService implements FinanzasUiServiceContract {
  private readonly now: () => Date;

  public constructor(
    private readonly dependencies: FinanzasUiDependencies,
    options: CreateFinanzasUiServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  public readonly loadHomeTab: FinanzasUiServiceContract["loadHomeTab"] = async (
    input: LoadHomeTabInput = {},
  ): Promise<FinanzasHomeTabViewModel> => {
    const account = await this.getActiveAccount(input.accountId);
    const period = resolvePeriod(input.period, this.now());

    const [summary, categoriesResult, syncStatus] = await Promise.all([
      this.dependencies.queries.getAccountSummary({
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
      this.dependencies.queries.listCategories({
        includeDeleted: true,
      }),
      this.dependencies.queries.getSyncStatus(),
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
  };

  public readonly loadMovementsTab: FinanzasUiServiceContract["loadMovementsTab"] = async (
    input: LoadMovementsTabInput = {},
  ): Promise<FinanzasMovementsTabViewModel> => {
    const hostAccount = await this.getActiveAccount(input.hostAccountId);
    const hostAccountOption = toAccountOption(hostAccount);

    const [transactionsResult, categoriesResult, syncStatus, accountsResult] = await Promise.all([
      this.dependencies.queries.listTransactions({
        filters: normalizeMovementsFiltersInput(input, hostAccount.id),
        page: normalizeMovementsPageInput(input),
      }),
      this.dependencies.queries.listCategories({
        includeDeleted: true,
      }),
      this.dependencies.queries.getSyncStatus(),
      this.dependencies.queries.listAccounts({
        includeDeleted: true,
      }),
    ]);

    const categoryNameById = buildCategoryNameById(categoriesResult.categories);
    const items = transactionsResult.transactions.map((transaction) =>
      toTransactionItemViewModel(transaction, categoryNameById),
    );
    const categories = categoriesResult.categories.map(toCategoryOption);
    const accounts = accountsResult.accounts.map(toAccountOption);
    const appliedAccount =
      accounts.find((account) => account.id === transactionsResult.appliedFilters.accountId) ??
      hostAccountOption;
    const totals = getTotalsFromTransactionItems(items);

    return {
      account: appliedAccount,
      includeDeleted: transactionsResult.appliedFilters.includeDeleted,
      review: {
        filters: transactionsResult.appliedFilters,
        page: {
          limit: transactionsResult.page.limit,
          hasMore: transactionsResult.page.hasMore,
          nextContinuation: transactionsResult.page.nextContinuation,
        },
        mode: input.review?.mode ?? "replace",
        scopeLabel: resolveMovementsScopeLabel(transactionsResult.appliedFilters, appliedAccount),
      },
      accountOptions: accounts,
      categoryOptions: categories,
      items,
      totals,
      sync: toSyncStatusViewModel(syncStatus),
      categoryManagement: resolveCategoryManagementState(categories),
    };
  };

  public readonly loadRegisterTab: FinanzasUiServiceContract["loadRegisterTab"] = async (
    input: LoadRegisterTabInput = {},
  ): Promise<FinanzasRegisterTabViewModel> => {
    const account = await this.getActiveAccount(input.accountId);
    const defaultDate = this.now();
    const period = resolvePeriod(undefined, defaultDate);
    const suggestedCategoryLimit = input.suggestedCategoryLimit ?? 3;

    const [categoriesResult, summary] = await Promise.all([
      this.dependencies.queries.listCategories(),
      this.dependencies.queries.getAccountSummary({
        accountId: account.id,
        from: period.from,
        to: period.to,
        recentLimit: 0,
        topCategoriesLimit: suggestedCategoryLimit,
      }),
    ]);

    const categories = categoriesResult.categories.map(toCategoryOption);
    const suggestedCategoryIds = this.buildSuggestedCategoryIds(
      categories,
      summary.topExpenseCategories.map((category) => category.categoryId),
      suggestedCategoryLimit,
    );
    const categoryManagement = resolveCategoryManagementState(categories);

    return {
      account: toAccountOption(account),
      defaultDate,
      categories,
      suggestedCategoryIds,
      defaultCategoryId: suggestedCategoryIds[0] ?? null,
      categoryManagement,
    };
  };

  public readonly loadAccountTab: FinanzasUiServiceContract["loadAccountTab"] = async (): Promise<FinanzasAccountTabViewModel> => {
    const [syncStatus, accountsResult, categoriesResult] = await Promise.all([
      this.dependencies.queries.getSyncStatus(),
      this.dependencies.queries.listAccounts({
        includeDeleted: true,
      }),
      this.dependencies.queries.listCategories({
        includeDeleted: true,
      }),
    ]);

    const accounts = accountsResult.accounts;
    const categories = categoriesResult.categories;
    const categoryOptions = categories.map(toCategoryOption);

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
      categoryManagement: resolveCategoryManagementState(categoryOptions),
    };
  };

  public readonly createCategory: FinanzasUiServiceContract["createCategory"] = async (
    input,
  ) => {
    const result = await this.dependencies.commands.addCategory({
      name: input.name,
      type: input.type,
    });

    return {
      categoryId: result.category.id,
      outboxOpId: result.outboxOpId,
    };
  };

  public readonly quickAddTransaction: FinanzasUiServiceContract["quickAddTransaction"] = async (
    input: QuickAddTransactionInput,
  ): Promise<QuickAddTransactionResult> => {
    const account = await this.getActiveAccount(input.accountId);
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
      date: input.date ?? this.now(),
      categoryId,
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    };

    const result = await this.dependencies.commands.addTransaction(addTransactionInput);
    const syncStatus = await this.dependencies.queries.getSyncStatus();

    return {
      transactionId: result.transaction.id,
      outboxOpId: result.outboxOpId,
      accountId: account.id,
      currency: account.currency,
      kind,
      signedAmountMinor,
      sync: toSyncStatusViewModel(syncStatus),
    };
  };

  public readonly syncNow: FinanzasUiServiceContract["syncNow"] = async (): Promise<SyncNowActionResult> => {
    let result: SyncNowResult | null = null;
    let error: string | null = null;

    try {
      result = await this.dependencies.commands.syncNow();
    } catch (syncError) {
      error = getErrorMessage(syncError);
    }

    const syncStatus = await this.dependencies.queries.getSyncStatus();

    return {
      ok: error === null,
      result,
      error,
      sync: toSyncStatusViewModel(syncStatus),
    };
  };

  private readonly getActiveAccount = async (
    accountId?: string,
  ): ReturnType<typeof resolveActiveAccount> =>
    await resolveActiveAccount(this.dependencies, accountId);

  private readonly buildSuggestedCategoryIds = (
    categories: FinanzasCategoryOption[],
    suggestedCategoryIdsFromSummary: string[],
    suggestedCategoryLimit: number,
  ): string[] => {
    const expenseCategories = categories.filter(
      (category) => category.type === "expense" && !category.deleted,
    );
    const suggestedSet = new Set(expenseCategories.map((category) => category.id));
    const fallbackSuggestions = expenseCategories
      .slice(0, suggestedCategoryLimit)
      .map((category) => category.id);

    return dedupeStrings([
      ...suggestedCategoryIdsFromSummary.filter((categoryId) =>
        suggestedSet.has(categoryId),
      ),
      ...fallbackSuggestions,
    ]).slice(0, suggestedCategoryLimit);
  };
}

const normalizeMovementsFiltersInput = (
  input: LoadMovementsTabInput,
  defaultAccountId: string,
): MovementsReviewFilters => {
  const reviewFilters = input.review?.filters;
  const explicitAccountId =
    reviewFilters !== undefined && "accountId" in reviewFilters
      ? reviewFilters.accountId ?? null
      : undefined;

  return {
    dateRange: {
      from: reviewFilters?.dateRange?.from ?? null,
      to: reviewFilters?.dateRange?.to ?? null,
    },
    accountId:
      explicitAccountId !== undefined
        ? explicitAccountId
        : input.hostAccountId ?? defaultAccountId,
    categoryId: reviewFilters?.categoryId ?? null,
    includeDeleted: reviewFilters?.includeDeleted ?? false,
  };
};

const normalizeMovementsPageInput = (
  input: LoadMovementsTabInput,
): MovementsPageRequest => ({
  limit: input.review?.page?.limit ?? DEFAULT_MOVEMENTS_PAGE_LIMIT,
  continuation: input.review?.page?.continuation ?? null,
});

const resolveMovementsScopeLabel = (
  filters: MovementsReviewFilters,
  account: FinanzasMovementsTabViewModel["account"],
): string => {
  if (filters.accountId === null) {
    return "Todos los movimientos";
  }

  return `${account.name} (${account.currency})`;
};
