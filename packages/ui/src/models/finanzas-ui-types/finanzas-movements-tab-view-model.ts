import type { CurrencyCode } from "@finanzas/domain";
import type {
  MovementsContinuationToken,
  MovementsReviewFilters,
} from "@finanzas/application";

import type { FinanzasAccountOption } from "./finanzas-account-option.js";
import type { FinanzasCategoryManagementState } from "./finanzas-category-management-state.js";
import type { FinanzasCategoryOption } from "./finanzas-category-option.js";
import type { FinanzasSyncStatusViewModel } from "./finanzas-sync-status-view-model.js";
import type { FinanzasTransactionItemViewModel } from "./finanzas-transaction-item-view-model.js";

/**
 * Movements tab model (`Movimientos`).
 */
export interface FinanzasMovementsTabViewModel {
  account: FinanzasAccountOption;
  includeDeleted: boolean;
  review?: {
    filters: MovementsReviewFilters;
    page: {
      limit: number;
      hasMore: boolean;
      nextContinuation: MovementsContinuationToken | null;
    };
    mode: "replace" | "append";
    scopeLabel: string;
  };
  accountOptions?: FinanzasAccountOption[];
  categoryOptions?: FinanzasCategoryOption[];
  items: FinanzasTransactionItemViewModel[];
  totals: {
    incomeMinor: bigint;
    expenseMinor: bigint;
    byCurrency?: Array<{
      currency: CurrencyCode;
      incomeMinor: bigint;
      expenseMinor: bigint;
    }>;
  };
  sync: FinanzasSyncStatusViewModel;
  categoryManagement: FinanzasCategoryManagementState;
}
