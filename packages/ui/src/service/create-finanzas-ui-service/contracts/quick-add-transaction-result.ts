import type {
  FinanzasSyncStatusViewModel,
  FinanzasTransactionKind,
} from "../../../models/finanzas-ui-types.js";

/**
 * Result returned by quick-add command.
 */
export interface QuickAddTransactionResult {
  transactionId: string;
  outboxOpId: string;
  accountId: string;
  currency: string;
  kind: FinanzasTransactionKind;
  signedAmountMinor: bigint;
  sync: FinanzasSyncStatusViewModel;
}
