import type { FinanzasAccountOption } from "./finanzas-account-option.js";
import type { FinanzasPeriod } from "./finanzas-period.js";
import type { FinanzasSyncStatusViewModel } from "./finanzas-sync-status-view-model.js";
import type { FinanzasTransactionItemViewModel } from "./finanzas-transaction-item-view-model.js";

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
