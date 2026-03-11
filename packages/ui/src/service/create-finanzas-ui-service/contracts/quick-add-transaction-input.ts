import type { FinanzasTransactionKind } from "../../../models/finanzas-ui-types.js";

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
