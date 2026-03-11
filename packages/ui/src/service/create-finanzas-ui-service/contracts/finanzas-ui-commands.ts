import type { AddTransactionInput, AddTransactionResult } from "@finanzas/application";
import type { SyncNowResult } from "@finanzas/sync";

/**
 * Minimal command dependencies required by the UI layer.
 */
export interface FinanzasUiCommands {
  addTransaction(input: AddTransactionInput): Promise<AddTransactionResult>;
  syncNow(): Promise<SyncNowResult>;
}
