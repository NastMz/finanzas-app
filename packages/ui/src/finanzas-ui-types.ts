import type {
  AccountType,
  CategoryType,
  CurrencyCode,
} from "@finanzas/domain";
import type { SyncStatus } from "@finanzas/sync";

/**
 * Time window rendered by UI tabs.
 */
export interface FinanzasPeriod {
  from: Date;
  to: Date;
  label: string;
}

/**
 * Minimal account option shown in selectors.
 */
export interface FinanzasAccountOption {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  deleted: boolean;
}

/**
 * Minimal category option shown in selectors.
 */
export interface FinanzasCategoryOption {
  id: string;
  name: string;
  type: CategoryType;
  deleted: boolean;
}

/**
 * Transaction direction used in lists/cards.
 */
export type FinanzasTransactionKind = "income" | "expense";

/**
 * Transaction item already mapped for UI consumption.
 */
export interface FinanzasTransactionItemViewModel {
  id: string;
  accountId: string;
  categoryId: string;
  categoryName: string;
  currency: CurrencyCode;
  kind: FinanzasTransactionKind;
  signedAmountMinor: bigint;
  amountMinor: bigint;
  date: Date;
  note: string | null;
  tags: string[];
  deleted: boolean;
}

/**
 * Sync status model shown in header badges and settings.
 */
export interface FinanzasSyncStatusViewModel {
  status: SyncStatus;
  pendingOps: number;
  sentOps: number;
  failedOps: number;
  ackedOps: number;
  lastError: string | null;
  cursor: string | null;
}

/**
 * Home tab model (`Inicio`).
 */
export interface FinanzasHomeTabViewModel {
  account: FinanzasAccountOption;
  period: FinanzasPeriod;
  totals: {
    incomeMinor: bigint;
    expenseMinor: bigint;
    netMinor: bigint;
  };
  topExpenseCategories: Array<{
    categoryId: string;
    categoryName: string;
    expenseMinor: bigint;
  }>;
  recentTransactions: FinanzasTransactionItemViewModel[];
  transactionCount: number;
  sync: FinanzasSyncStatusViewModel;
}

/**
 * Movements tab model (`Movimientos`).
 */
export interface FinanzasMovementsTabViewModel {
  account: FinanzasAccountOption;
  includeDeleted: boolean;
  items: FinanzasTransactionItemViewModel[];
  totals: {
    incomeMinor: bigint;
    expenseMinor: bigint;
  };
  sync: FinanzasSyncStatusViewModel;
}

/**
 * Register tab model (`Registrar`) with defaults and suggestions.
 */
export interface FinanzasRegisterTabViewModel {
  account: FinanzasAccountOption;
  defaultDate: Date;
  categories: FinanzasCategoryOption[];
  suggestedCategoryIds: string[];
  defaultCategoryId: string | null;
}

/**
 * Account tab model (`Cuenta`) focused on sync and configuration counters.
 */
export interface FinanzasAccountTabViewModel {
  sync: FinanzasSyncStatusViewModel;
  accounts: {
    total: number;
    active: number;
    deleted: number;
  };
  categories: {
    total: number;
    active: number;
    deleted: number;
  };
}
