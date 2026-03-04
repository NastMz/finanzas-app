import type {
  AddTransactionInput,
  AddTransactionResult,
  GetAccountSummaryInput,
  GetAccountSummaryResult,
  ListAccountsInput,
  ListAccountsResult,
  ListCategoriesInput,
  ListCategoriesResult,
  ListTransactionsInput,
  ListTransactionsResult,
} from "@finanzas/application";
import type { Account, Category, Transaction } from "@finanzas/domain";
import type { GetSyncStatusResult, SyncNowResult } from "@finanzas/sync";

import type {
  FinanzasAccountOption,
  FinanzasAccountTabViewModel,
  FinanzasCategoryOption,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasPeriod,
  FinanzasRegisterTabViewModel,
  FinanzasSyncStatusViewModel,
  FinanzasTransactionItemViewModel,
  FinanzasTransactionKind,
} from "./finanzas-ui-types.js";

/**
 * Minimal command dependencies required by the UI layer.
 */
export interface FinanzasUiCommands {
  addTransaction(input: AddTransactionInput): Promise<AddTransactionResult>;
  syncNow(): Promise<SyncNowResult>;
}

/**
 * Minimal query dependencies required by the UI layer.
 */
export interface FinanzasUiQueries {
  listAccounts(input?: ListAccountsInput): Promise<ListAccountsResult>;
  listCategories(input?: ListCategoriesInput): Promise<ListCategoriesResult>;
  listTransactions(input: ListTransactionsInput): Promise<ListTransactionsResult>;
  getAccountSummary(
    input: GetAccountSummaryInput,
  ): Promise<GetAccountSummaryResult>;
  getSyncStatus(): Promise<GetSyncStatusResult>;
}

/**
 * Runtime dependencies required by `createFinanzasUiService`.
 */
export interface FinanzasUiDependencies {
  commands: FinanzasUiCommands;
  queries: FinanzasUiQueries;
}

/**
 * Custom UI error for invalid screen inputs or missing local entities.
 */
export class FinanzasUiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanzasUiError";
  }
}

/**
 * Input to load Home tab data.
 */
export interface LoadHomeTabInput {
  accountId?: string;
  period?: Omit<FinanzasPeriod, "label"> & { label?: string };
  recentLimit?: number;
  topCategoriesLimit?: number;
}

/**
 * Input to load Movements tab data.
 */
export interface LoadMovementsTabInput {
  accountId?: string;
  includeDeleted?: boolean;
  limit?: number;
}

/**
 * Input to load Register tab defaults/suggestions.
 */
export interface LoadRegisterTabInput {
  accountId?: string;
  suggestedCategoryLimit?: number;
}

/**
 * Input for quick transaction creation from `Registrar`.
 */
export interface QuickAddTransactionInput {
  accountId?: string;
  amountMinor: number | bigint;
  kind?: FinanzasTransactionKind;
  categoryId: string;
  note?: string;
  tags?: string[];
  date?: Date;
}

/**
 * Result returned by quick-add command.
 */
export interface QuickAddTransactionResult {
  transactionId: string;
  outboxOpId: string;
  accountId: string;
  currency: string;
  kind: FinanzasTransactionKind;
  signedAmountMinor: bigint;
  sync: FinanzasSyncStatusViewModel;
}

/**
 * Result returned by manual sync action in `Cuenta`.
 */
export interface SyncNowActionResult {
  ok: boolean;
  result: SyncNowResult | null;
  error: string | null;
  sync: FinanzasSyncStatusViewModel;
}

/**
 * Runtime options for creating the UI service.
 */
export interface CreateFinanzasUiServiceOptions {
  now?: () => Date;
}

/**
 * Headless UI orchestrator for app tabs.
 */
export interface FinanzasUiService {
  loadHomeTab(input?: LoadHomeTabInput): Promise<FinanzasHomeTabViewModel>;
  loadMovementsTab(
    input?: LoadMovementsTabInput,
  ): Promise<FinanzasMovementsTabViewModel>;
  loadRegisterTab(
    input?: LoadRegisterTabInput,
  ): Promise<FinanzasRegisterTabViewModel>;
  loadAccountTab(): Promise<FinanzasAccountTabViewModel>;
  quickAddTransaction(
    input: QuickAddTransactionInput,
  ): Promise<QuickAddTransactionResult>;
  syncNow(): Promise<SyncNowActionResult>;
}

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

const resolveActiveAccount = async (
  dependencies: FinanzasUiDependencies,
  accountId: string | undefined,
): Promise<Account> => {
  const accountsResult = await dependencies.queries.listAccounts();
  const accounts = accountsResult.accounts;

  if (accounts.length === 0) {
    throw new FinanzasUiError("No active accounts available.");
  }

  if (accountId === undefined) {
    const defaultAccount = accounts[0];

    if (!defaultAccount) {
      throw new FinanzasUiError("Default account could not be resolved.");
    }

    return defaultAccount;
  }

  const selectedAccount = accounts.find((account) => account.id === accountId);

  if (!selectedAccount) {
    throw new FinanzasUiError(`Account ${accountId} is not available.`);
  }

  return selectedAccount;
};

const resolvePeriod = (
  period: LoadHomeTabInput["period"] | undefined,
  baseDate: Date,
): FinanzasPeriod => {
  if (period) {
    return {
      from: new Date(period.from),
      to: new Date(period.to),
      label:
        period.label ??
        `${period.from.toISOString().slice(0, 10)} - ${period.to.toISOString().slice(0, 10)}`,
    };
  }

  const from = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const to = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ),
  );

  return {
    from,
    to,
    label: `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`,
  };
};

const buildCategoryNameById = (categories: Category[]): Map<string, string> =>
  new Map(categories.map((category) => [category.id, category.name]));

const toTransactionItemViewModel = (
  transaction: Transaction,
  categoryNameById: Map<string, string>,
): FinanzasTransactionItemViewModel => {
  const signedAmountMinor = transaction.amount.amountMinor;
  const kind: FinanzasTransactionKind =
    signedAmountMinor < 0n ? "expense" : "income";

  return {
    id: transaction.id,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    categoryName: categoryNameById.get(transaction.categoryId) ?? "Sin categoria",
    currency: transaction.amount.currency,
    kind,
    signedAmountMinor,
    amountMinor: signedAmountMinor < 0n ? -signedAmountMinor : signedAmountMinor,
    date: new Date(transaction.date),
    note: transaction.note,
    tags: [...transaction.tags],
    deleted: transaction.deletedAt !== null,
  };
};

const toSyncStatusViewModel = (
  syncStatus: GetSyncStatusResult,
): FinanzasSyncStatusViewModel => ({
  status: syncStatus.status,
  pendingOps: syncStatus.counts.pending,
  sentOps: syncStatus.counts.sent,
  failedOps: syncStatus.counts.failed,
  ackedOps: syncStatus.counts.acked,
  lastError: syncStatus.lastError,
  cursor: syncStatus.cursor,
});

const toAccountOption = (account: Account): FinanzasAccountOption => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  deleted: account.deletedAt !== null,
});

const toCategoryOption = (category: Category): FinanzasCategoryOption => ({
  id: category.id,
  name: category.name,
  type: category.type,
  deleted: category.deletedAt !== null,
});

const getTotalsFromTransactionItems = (
  items: FinanzasTransactionItemViewModel[],
): { incomeMinor: bigint; expenseMinor: bigint } => {
  let incomeMinor = 0n;
  let expenseMinor = 0n;

  for (const item of items) {
    if (item.kind === "income") {
      incomeMinor += item.amountMinor;
      continue;
    }

    expenseMinor += item.amountMinor;
  }

  return {
    incomeMinor,
    expenseMinor,
  };
};

const normalizeSignedAmount = (
  amountMinor: number | bigint,
  kind: FinanzasTransactionKind,
): bigint => {
  const value = typeof amountMinor === "bigint" ? amountMinor : BigInt(amountMinor);
  const absoluteAmount = value < 0n ? -value : value;

  if (absoluteAmount === 0n) {
    throw new FinanzasUiError("Transaction amount cannot be zero.");
  }

  return kind === "expense" ? -absoluteAmount : absoluteAmount;
};

const dedupeStrings = (items: string[]): string[] => [...new Set(items)];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown sync error.";
};
