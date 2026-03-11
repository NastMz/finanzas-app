import type { OutboxOp, OutboxRepository } from "@finanzas/application";
import type { SyncStateRepository, SyncStatusOutboxRepository } from "@finanzas/sync";

import {
  FINANZAS_STORE_NAMES,
  clearStore,
  getAllRecords,
  getRecord,
  putRecord,
  type IndexedDbConnection,
} from "./finanzas-indexed-db.js";

interface StoredOutboxOp {
  opId: string;
  deviceId: string;
  entityType: OutboxOp["entityType"];
  entityId: string;
  opType: OutboxOp["opType"];
  payload: Record<string, unknown>;
  baseVersion?: string | number;
  createdAt: string;
  status: OutboxOp["status"];
  attemptCount: number;
  lastError?: string;
}

interface StoredSyncState {
  key: "cursor";
  value: string;
}

export class IndexedDbOutboxRepository
implements OutboxRepository, SyncStatusOutboxRepository {
  private readonly database: IndexedDbConnection;

  constructor(database: IndexedDbConnection) {
    this.database = database;
  }

  async append(op: OutboxOp): Promise<void> {
    await putRecord(this.database, FINANZAS_STORE_NAMES.outbox, toStoredOutboxOp(op));
  }

  async listPending(): Promise<OutboxOp[]> {
    const operations = await this.listAll();
    return operations.filter((operation) => operation.status === "pending");
  }

  async markAsSent(opIds: string[]): Promise<void> {
    const targetIds = new Set(opIds);
    const operations = await this.listAll();

    for (const operation of operations) {
      if (!targetIds.has(operation.opId) || operation.status === "acked") {
        continue;
      }

      const { lastError: _lastError, ...safeOperation } = operation;
      await this.saveOperation({
        ...safeOperation,
        status: "sent",
        attemptCount: operation.attemptCount + 1,
      });
    }
  }

  async markAsAcked(opIds: string[]): Promise<void> {
    const targetIds = new Set(opIds);
    const operations = await this.listAll();

    for (const operation of operations) {
      if (!targetIds.has(operation.opId)) {
        continue;
      }

      const { lastError: _lastError, ...safeOperation } = operation;
      await this.saveOperation({
        ...safeOperation,
        status: "acked",
      });
    }
  }

  async markAsFailed(opIds: string[], errorMessage: string): Promise<void> {
    const targetIds = new Set(opIds);
    const operations = await this.listAll();

    for (const operation of operations) {
      if (!targetIds.has(operation.opId)) {
        continue;
      }

      await this.saveOperation({
        ...operation,
        status: "failed",
        lastError: errorMessage,
      });
    }
  }

  async replaceAll(ops: OutboxOp[]): Promise<void> {
    await clearStore(this.database, FINANZAS_STORE_NAMES.outbox);

    for (const operation of ops) {
      await this.saveOperation(operation);
    }
  }

  async listAll(): Promise<OutboxOp[]> {
    const records = await getAllRecords<StoredOutboxOp>(
      this.database,
      FINANZAS_STORE_NAMES.outbox,
    );

    return records.map(fromStoredOutboxOp);
  }

  private async saveOperation(operation: OutboxOp): Promise<void> {
    await putRecord(
      this.database,
      FINANZAS_STORE_NAMES.outbox,
      toStoredOutboxOp(operation),
    );
  }
}

export class IndexedDbSyncStateRepository implements SyncStateRepository {
  private readonly database: IndexedDbConnection;
  private readonly initialCursor: string;

  constructor(database: IndexedDbConnection, initialCursor = "0") {
    this.database = database;
    this.initialCursor = initialCursor;
  }

  async getCursor(): Promise<string | null> {
    const record = await getRecord<StoredSyncState>(
      this.database,
      FINANZAS_STORE_NAMES.syncState,
      "cursor",
    );

    return record?.value ?? this.initialCursor;
  }

  async setCursor(cursor: string): Promise<void> {
    await putRecord(this.database, FINANZAS_STORE_NAMES.syncState, {
      key: "cursor",
      value: cursor,
    } satisfies StoredSyncState);
  }
}

const toStoredOutboxOp = (operation: OutboxOp): StoredOutboxOp => ({
  ...operation,
  payload: clonePayload(operation.payload),
  createdAt: operation.createdAt.toISOString(),
});

const fromStoredOutboxOp = (operation: StoredOutboxOp): OutboxOp => ({
  ...operation,
  payload: clonePayload(operation.payload),
  createdAt: new Date(operation.createdAt),
});

const clonePayload = <T extends Record<string, unknown>>(payload: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(payload);
  }

  return JSON.parse(JSON.stringify(payload)) as T;
};
