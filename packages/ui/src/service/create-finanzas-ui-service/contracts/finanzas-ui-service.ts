import type {
  FinanzasAccountTabViewModel,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
} from "../../../models/finanzas-ui-types.js";
import type { LoadHomeTabInput } from "./load-home-tab-input.js";
import type { LoadMovementsTabInput } from "./load-movements-tab-input.js";
import type { LoadRegisterTabInput } from "./load-register-tab-input.js";
import type { QuickAddTransactionInput } from "./quick-add-transaction-input.js";
import type { QuickAddTransactionResult } from "./quick-add-transaction-result.js";
import type { SyncNowActionResult } from "./sync-now-action-result.js";

/**
 * Headless UI orchestrator for app tabs.
 */
export interface FinanzasUiServiceContract {
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
