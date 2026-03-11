import type { OutboxOp } from "@finanzas/application";

/**
 * Read-only outbox contract required by sync status queries.
 */
export interface SyncStatusOutboxRepository {
  listAll(): Promise<OutboxOp[]>;
}
