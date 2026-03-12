import type { DatabaseSync } from "node:sqlite";

import type { OutboxOp, OutboxRepository } from "@finanzas/application";
import type { SyncStateRepository, SyncStatusOutboxRepository } from "@finanzas/sync";
import { PERSISTENCE_COLLECTION_IDS } from "../persistence/persistence-schema.js";

import {
  clearTable,
  getCursorValue,
  listPayloads,
  putPayload,
  setCursorValue,
} from "./finanzas-sqlite.js";

export class SqliteOutboxRepository
implements OutboxRepository, SyncStatusOutboxRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async append(op: OutboxOp): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.outbox,
      op.opId,
      op,
    );
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
    clearTable(this.database, PERSISTENCE_COLLECTION_IDS.outbox);

    for (const operation of ops) {
      await this.saveOperation(operation);
    }
  }

  async listAll(): Promise<OutboxOp[]> {
    return listPayloads<OutboxOp>(this.database, PERSISTENCE_COLLECTION_IDS.outbox);
  }

  private async saveOperation(operation: OutboxOp): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.outbox,
      operation.opId,
      operation,
    );
  }
}

export class SqliteSyncStateRepository implements SyncStateRepository {
  private readonly database: DatabaseSync;
  private readonly defaultCursor: string;

  constructor(database: DatabaseSync, defaultCursor = "0") {
    this.database = database;
    this.defaultCursor = defaultCursor;
  }

  async getCursor(): Promise<string | null> {
    return getCursorValue(this.database, this.defaultCursor);
  }

  async setCursor(cursor: string): Promise<void> {
    setCursorValue(this.database, cursor);
  }
}
