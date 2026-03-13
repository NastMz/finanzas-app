import type {
  AddCategoryInput,
  AddCategoryResult,
  AddTransactionInput,
  AddTransactionResult,
} from "@finanzas/application";
import type { SyncNowResult } from "@finanzas/sync";

/**
 * Minimal command dependencies required by the UI layer.
 */
export interface FinanzasUiCommands {
  addCategory(input: AddCategoryInput): Promise<AddCategoryResult>;
  addTransaction(input: AddTransactionInput): Promise<AddTransactionResult>;
  syncNow(): Promise<SyncNowResult>;
}
