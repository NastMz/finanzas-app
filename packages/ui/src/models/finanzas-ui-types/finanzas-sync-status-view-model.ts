import type { SyncStatus } from "@finanzas/sync";

/**
 * Sync status model shown in header badges and settings.
 */
export interface FinanzasSyncStatusViewModel {
  status: SyncStatus;
  pendingOps: number;
  sentOps: number;
  failedOps: number;
  ackedOps: number;
  lastError: string | null;
  cursor: string | null;
}
