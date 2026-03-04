import type {
  FinanzasSyncStatusViewModel,
  FinanzasTransactionItemViewModel,
} from "@finanzas/ui";

/**
 * Tone variants used by status chips.
 */
export type SyncTone = "success" | "warning" | "danger";

/**
 * Formats an amount expressed in minor units.
 */
export const formatMinorAmount = (
  amountMinor: bigint,
  currency: string,
): string => `${currency} ${amountMinor.toLocaleString("es-CO")}`;

/**
 * Formats transaction amount with explicit sign.
 */
export const formatTransactionAmount = (
  viewModel: FinanzasTransactionItemViewModel,
): string => {
  const sign = viewModel.kind === "expense" ? "-" : "+";
  return `${sign}${formatMinorAmount(viewModel.amountMinor, viewModel.currency)}`;
};

/**
 * Formats date in ISO for deterministic output.
 */
export const formatDateIso = (value: Date): string => value.toISOString();

/**
 * Maps sync status to user-facing labels.
 */
export const getSyncStatusLabel = (
  status: FinanzasSyncStatusViewModel["status"],
): string => {
  switch (status) {
    case "synced":
      return "Sincronizado";
    case "pending":
      return "Pendiente";
    case "error":
      return "Error";
  }
};

/**
 * Maps sync status to tone variant.
 */
export const getSyncTone = (
  status: FinanzasSyncStatusViewModel["status"],
): SyncTone => {
  switch (status) {
    case "synced":
      return "success";
    case "pending":
      return "warning";
    case "error":
      return "danger";
  }
};
