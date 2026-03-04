import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

type HomeSyncStatus = FinanzasHomeTabViewModel["sync"]["status"];

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
  viewModel: FinanzasHomeTabViewModel["recentTransactions"][number],
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
export const getSyncStatusLabel = (status: HomeSyncStatus): string => {
  switch (status) {
    case "synced":
      return "Sincronizado";
    case "pending":
      return "Pendiente";
    case "error":
      return "Error";
  }
};
