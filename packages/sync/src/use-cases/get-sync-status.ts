import type { OutboxOp } from "@finanzas/application";

import type { GetSyncStatusDependencies } from "../ports.js";

/**
 * Visual sync status used by host UIs.
 */
export type SyncStatus = "synced" | "pending" | "error";

/**
 * Aggregated outbox counters grouped by status.
 */
export interface SyncStatusCounts {
  pending: number;
  sent: number;
  failed: number;
  acked: number;
}

/**
 * Result payload returned by `getSyncStatus`.
 */
export interface GetSyncStatusResult {
  status: SyncStatus;
  counts: SyncStatusCounts;
  lastError: string | null;
  cursor: string | null;
}

/**
 * Builds a UI-focused summary of sync state using local outbox + cursor.
 */
export const getSyncStatus = async (
  dependencies: GetSyncStatusDependencies,
): Promise<GetSyncStatusResult> => {
  const operations = await dependencies.outbox.listAll();
  const cursor = await dependencies.syncState.getCursor();
  const counts = buildCounts(operations);
  const lastError = getLastErrorMessage(operations);

  return {
    status: resolveSyncStatus(counts),
    counts,
    lastError,
    cursor,
  };
};

const buildCounts = (operations: OutboxOp[]): SyncStatusCounts =>
  operations.reduce<SyncStatusCounts>(
    (counts, operation) => {
      switch (operation.status) {
        case "pending":
          counts.pending += 1;
          break;
        case "sent":
          counts.sent += 1;
          break;
        case "failed":
          counts.failed += 1;
          break;
        case "acked":
          counts.acked += 1;
          break;
      }

      return counts;
    },
    {
      pending: 0,
      sent: 0,
      failed: 0,
      acked: 0,
    },
  );

const resolveSyncStatus = (counts: SyncStatusCounts): SyncStatus => {
  if (counts.failed > 0) {
    return "error";
  }

  if (counts.pending > 0 || counts.sent > 0) {
    return "pending";
  }

  return "synced";
};

const getLastErrorMessage = (operations: OutboxOp[]): string | null => {
  const failedOperations = operations
    .filter((operation) => operation.status === "failed")
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return failedOperations[0]?.lastError ?? null;
};
