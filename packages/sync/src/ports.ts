import type { OutboxOp, OutboxRepository } from "@finanzas/application";

export interface SyncPushRequest {
  deviceId: string;
  ops: OutboxOp[];
}

export interface SyncConflict {
  opId: string;
  reason: string;
}

export interface SyncPushResponse {
  ackedOpIds: string[];
  conflicts: SyncConflict[];
  serverTime: Date;
}

export interface SyncPullRequest {
  deviceId: string;
  cursor: string | null;
}

export interface SyncChange {
  changeId: string;
  entityType: OutboxOp["entityType"];
  entityId: string;
  opType: OutboxOp["opType"];
  payload: Record<string, unknown>;
  serverVersion?: string | number;
  serverTimestamp: Date;
}

export interface SyncPullResponse {
  nextCursor: string;
  changes: SyncChange[];
}

export interface SyncApiClient {
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
  pull(request: SyncPullRequest): Promise<SyncPullResponse>;
}

export interface SyncStateRepository {
  getCursor(): Promise<string | null>;
  setCursor(cursor: string): Promise<void>;
}

export interface SyncChangeApplier {
  apply(changes: SyncChange[]): Promise<void>;
}

export interface SyncNowDependencies {
  outbox: OutboxRepository;
  api: SyncApiClient;
  syncState: SyncStateRepository;
  changeApplier: SyncChangeApplier;
  deviceId: string;
}
