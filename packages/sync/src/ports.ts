import type { OutboxOp, OutboxRepository } from "@finanzas/application";

/**
 * Entity discriminator used by pulled sync changes.
 */
export type SyncEntityType = string;

/**
 * Operation type supported by sync change snapshots.
 */
export type SyncOpType = "create" | "update" | "delete";

/**
 * Push request payload sent by the client to the sync backend.
 */
export interface SyncPushRequest {
  deviceId: string;
  ops: OutboxOp[];
}

/**
 * Conflict description returned by the sync backend.
 */
export interface SyncConflict {
  opId: string;
  reason: string;
}

/**
 * Push response payload returned by the sync backend.
 */
export interface SyncPushResponse {
  ackedOpIds: string[];
  conflicts: SyncConflict[];
  serverTime: Date;
}

/**
 * Pull request payload sent by the client to retrieve remote changes.
 */
export interface SyncPullRequest {
  deviceId: string;
  cursor: string | null;
}

/**
 * Canonical remote change envelope returned by pull.
 */
export interface SyncChange {
  changeId: string;
  entityType: SyncEntityType;
  entityId: string;
  opType: SyncOpType;
  payload: Record<string, unknown>;
  serverVersion?: string | number;
  serverTimestamp: Date;
}

/**
 * Pull response payload containing new cursor and changes batch.
 */
export interface SyncPullResponse {
  nextCursor: string;
  changes: SyncChange[];
}

/**
 * Backend contract required by the sync engine.
 */
export interface SyncApiClient {
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
  pull(request: SyncPullRequest): Promise<SyncPullResponse>;
}

/**
 * Local cursor storage used for incremental pull.
 */
export interface SyncStateRepository {
  getCursor(): Promise<string | null>;
  setCursor(cursor: string): Promise<void>;
}

/**
 * Applies pulled changes to local repositories.
 */
export interface SyncChangeApplier {
  apply(changes: SyncChange[]): Promise<void>;
}

/**
 * Runtime dependencies required to execute the `syncNow` use case.
 */
export interface SyncNowDependencies {
  outbox: OutboxRepository;
  api: SyncApiClient;
  syncState: SyncStateRepository;
  changeApplier: SyncChangeApplier;
  deviceId: string;
}

/**
 * Read-only outbox contract required by sync status queries.
 */
export interface SyncStatusOutboxRepository {
  listAll(): Promise<OutboxOp[]>;
}

/**
 * Runtime dependencies required to execute `getSyncStatus`.
 */
export interface GetSyncStatusDependencies {
  outbox: SyncStatusOutboxRepository;
  syncState: SyncStateRepository;
}
