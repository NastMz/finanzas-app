import type { FinanzasAccountOption } from "./finanzas-account-option.js";
import type { FinanzasSyncStatusViewModel } from "./finanzas-sync-status-view-model.js";
import type { FinanzasTransactionItemViewModel } from "./finanzas-transaction-item-view-model.js";

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
