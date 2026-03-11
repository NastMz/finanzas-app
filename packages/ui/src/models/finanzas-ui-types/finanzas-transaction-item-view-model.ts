import type { CurrencyCode } from "@finanzas/domain";

import type { FinanzasTransactionKind } from "./finanzas-transaction-kind.js";

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
