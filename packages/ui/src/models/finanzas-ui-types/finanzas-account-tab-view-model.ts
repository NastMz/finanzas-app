import type { FinanzasSyncStatusViewModel } from "./finanzas-sync-status-view-model.js";

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
