import type {
  AccountType,
  CategoryType,
  CurrencyCode,
} from "@finanzas/domain";
import type { SyncStatus } from "@finanzas/sync";

/**
 * Time window rendered by UI tabs.
 */
export interface MobilePeriod {
  from: Date;
  to: Date;
  label: string;
}

/**
 * Minimal account option shown in selectors.
 */
export interface MobileAccountOption {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  deleted: boolean;
}

/**
 * Minimal category option shown in selectors.
 */
export interface MobileCategoryOption {
  id: string;
  name: string;
  type: CategoryType;
  deleted: boolean;
}

/**
 * Transaction direction used in mobile lists/cards.
 */
export type MobileTransactionKind = "income" | "expense";

/**
 * Transaction item already mapped for UI consumption.
 */
export interface MobileTransactionItemViewModel {
  id: string;
  accountId: string;
  categoryId: string;
  categoryName: string;
  currency: CurrencyCode;
  kind: MobileTransactionKind;
  signedAmountMinor: bigint;
  amountMinor: bigint;
  date: Date;
  note: string | null;
  tags: string[];
  deleted: boolean;
}

/**
 * Sync status model shown in account/header badges.
 */
export interface MobileSyncStatusViewModel {
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
export interface MobileHomeTabViewModel {
  account: MobileAccountOption;
  period: MobilePeriod;
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
  recentTransactions: MobileTransactionItemViewModel[];
  transactionCount: number;
  sync: MobileSyncStatusViewModel;
}

/**
 * Movements tab model (`Movimientos`).
 */
export interface MobileMovementsTabViewModel {
  account: MobileAccountOption;
  includeDeleted: boolean;
  items: MobileTransactionItemViewModel[];
  totals: {
    incomeMinor: bigint;
    expenseMinor: bigint;
  };
  sync: MobileSyncStatusViewModel;
}

/**
 * Register tab model (`Registrar`) with defaults and suggestions.
 */
export interface MobileRegisterTabViewModel {
  account: MobileAccountOption;
  defaultDate: Date;
  categories: MobileCategoryOption[];
  suggestedCategoryIds: string[];
  defaultCategoryId: string | null;
}

/**
 * Account tab model (`Cuenta`) focused on sync and configuration counters.
 */
export interface MobileAccountTabViewModel {
  sync: MobileSyncStatusViewModel;
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
