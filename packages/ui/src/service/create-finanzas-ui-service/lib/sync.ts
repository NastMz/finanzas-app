import type { GetSyncStatusResult } from "@finanzas/sync";

import type { FinanzasSyncStatusViewModel } from "../../../models/finanzas-ui-types.js";

export const toSyncStatusViewModel = (
  syncStatus: GetSyncStatusResult,
): FinanzasSyncStatusViewModel => ({
  status: syncStatus.status,
  pendingOps: syncStatus.counts.pending,
  sentOps: syncStatus.counts.sent,
  failedOps: syncStatus.counts.failed,
  ackedOps: syncStatus.counts.acked,
  lastError: syncStatus.lastError,
  cursor: syncStatus.cursor,
});

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown sync error.";
};
