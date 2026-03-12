import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type * as NodeSqliteModule from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import {
  FINANZAS_SQLITE_SCHEMA_VERSION,
  FINANZAS_SQLITE_TABLES,
  getCursorValue,
  getPayloadByKey,
  listPayloads,
  openFinanzasSqlite,
  type SeededAccountRecord,
} from "@finanzas/data/sqlite";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof NodeSqliteModule;

interface SqliteMetadataRow {
  key: string;
  value: string;
}

interface SqliteMigrationRow {
  version: number;
  name: string;
  applied_at: string;
}

interface SqliteVersionRow {
  user_version: number;
}

interface LegacyOutboxRecord {
  opId: string;
  entityType: string;
  entityId: string;
  operation: string;
  payload: string;
  status: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
}

const tempDirectories: string[] = [];

const seededAccount: SeededAccountRecord = {
  id: "acc-main",
  name: "Cuenta principal",
  type: "bank",
  currency: "COP",
  createdAt: "2026-03-12T12:00:00.000Z",
  updatedAt: "2026-03-12T12:00:00.000Z",
  deletedAt: null,
  version: null,
};

describe("openFinanzasSqlite", () => {
  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  });

  it("creates schema metadata for fresh databases", () => {
    const databasePath = createTempDatabasePath("fresh.sqlite");
    const database = openFinanzasSqlite({
      databasePath,
      seedAccount: seededAccount,
      initialCursor: "17",
    });

    const schemaVersion = database
      .prepare("PRAGMA user_version")
      .get() as unknown as SqliteVersionRow;
    const metadataRows = database
      .prepare(
        `SELECT key, value FROM ${FINANZAS_SQLITE_TABLES.metadata} ORDER BY key`,
      )
      .all() as unknown as SqliteMetadataRow[];
    const migrationRows = database
      .prepare(
        `SELECT version, name, applied_at FROM ${FINANZAS_SQLITE_TABLES.schemaMigrations} ORDER BY version`,
      )
      .all() as unknown as SqliteMigrationRow[];
    const storedAccount = getPayloadByKey<SeededAccountRecord>(
      database,
      FINANZAS_SQLITE_TABLES.accounts,
      "id",
      seededAccount.id,
    );
    const storedCursor = getCursorValue(database, "0");

    expect(schemaVersion.user_version).toBe(FINANZAS_SQLITE_SCHEMA_VERSION);
    expect(metadataRows).toEqual([
      {
        key: "lastMigratedAt",
        value: metadataRows[0]?.value ?? "",
      },
      {
        key: "schemaVersion",
        value: String(FINANZAS_SQLITE_SCHEMA_VERSION),
      },
    ]);
    expect(metadataRows[0]?.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(migrationRows).toEqual([
      {
        version: 1,
        name: "create-core-tables",
        applied_at: migrationRows[0]?.applied_at ?? "",
      },
      {
        version: 2,
        name: "add-migration-metadata-tables",
        applied_at: migrationRows[1]?.applied_at ?? "",
      },
    ]);
    expect(migrationRows.every((row) => row.applied_at.length > 0)).toBe(true);
    expect(storedAccount).toEqual(seededAccount);
    expect(storedCursor).toBe("17");

    database.close();
  });

  it("upgrades legacy sqlite databases without overwriting persisted state", () => {
    const databasePath = createTempDatabasePath("legacy.sqlite");
    const legacyAccount: SeededAccountRecord = {
      id: "acc-legacy",
      name: "Cuenta legacy",
      type: "cash",
      currency: "USD",
      createdAt: "2025-12-01T09:00:00.000Z",
      updatedAt: "2025-12-01T09:00:00.000Z",
      deletedAt: null,
      version: 2,
    };
    const legacyOutbox: LegacyOutboxRecord = {
      opId: "op-legacy-1",
      entityType: "account",
      entityId: legacyAccount.id,
      operation: "upsert",
      payload: "{\"id\":\"acc-legacy\"}",
      status: "pending",
      attempts: 1,
      createdAt: "2025-12-01T09:01:00.000Z",
      updatedAt: "2025-12-01T09:01:00.000Z",
      lastError: null,
    };

    seedLegacySqliteDatabase(databasePath, legacyAccount, legacyOutbox);

    const database = openFinanzasSqlite({
      databasePath,
      seedAccount: seededAccount,
      initialCursor: "0",
    });

    const schemaVersion = database
      .prepare("PRAGMA user_version")
      .get() as unknown as SqliteVersionRow;
    const metadataRows = database
      .prepare(
        `SELECT key, value FROM ${FINANZAS_SQLITE_TABLES.metadata} ORDER BY key`,
      )
      .all() as unknown as SqliteMetadataRow[];
    const migrationRows = database
      .prepare(
        `SELECT version, name, applied_at FROM ${FINANZAS_SQLITE_TABLES.schemaMigrations} ORDER BY version`,
      )
      .all() as unknown as SqliteMigrationRow[];
    const storedLegacyAccount = getPayloadByKey<SeededAccountRecord>(
      database,
      FINANZAS_SQLITE_TABLES.accounts,
      "id",
      legacyAccount.id,
    );
    const missingSeededAccount = getPayloadByKey<SeededAccountRecord>(
      database,
      FINANZAS_SQLITE_TABLES.accounts,
      "id",
      seededAccount.id,
    );
    const storedOutbox = listPayloads<LegacyOutboxRecord>(
      database,
      FINANZAS_SQLITE_TABLES.outbox,
    );
    const storedCursor = getCursorValue(database, "0");

    expect(schemaVersion.user_version).toBe(FINANZAS_SQLITE_SCHEMA_VERSION);
    expect(metadataRows).toEqual([
      {
        key: "lastMigratedAt",
        value: metadataRows[0]?.value ?? "",
      },
      {
        key: "schemaVersion",
        value: String(FINANZAS_SQLITE_SCHEMA_VERSION),
      },
    ]);
    expect(migrationRows.map((row) => ({
      version: row.version,
      name: row.name,
    }))).toEqual([
      {
        version: 1,
        name: "create-core-tables",
      },
      {
        version: 2,
        name: "add-migration-metadata-tables",
      },
    ]);
    expect(storedLegacyAccount).toEqual(legacyAccount);
    expect(missingSeededAccount).toBeNull();
    expect(storedOutbox).toEqual([legacyOutbox]);
    expect(storedCursor).toBe("42");

    database.close();
  });
});

const createTempDatabasePath = (fileName: string): string => {
  const directory = mkdtempSync(join(tmpdir(), "finanzas-sqlite-"));

  tempDirectories.push(directory);

  return join(directory, fileName);
};

const seedLegacySqliteDatabase = (
  databasePath: string,
  account: SeededAccountRecord,
  outboxRecord: LegacyOutboxRecord,
): void => {
  const database = new DatabaseSync(databasePath);

  database.exec(`
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.accounts} (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.budgets} (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.categories} (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.recurringRules} (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.transactions} (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS transactions_by_account_id
      ON ${FINANZAS_SQLITE_TABLES.transactions}(account_id);
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.transactionTemplates} (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.outbox} (
      op_id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.syncState} (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  database
    .prepare(
      `INSERT INTO ${FINANZAS_SQLITE_TABLES.accounts}(id, payload) VALUES (?, ?)`,
    )
    .run(account.id, JSON.stringify(account));
  database
    .prepare(
      `INSERT INTO ${FINANZAS_SQLITE_TABLES.outbox}(op_id, payload) VALUES (?, ?)`,
    )
    .run(outboxRecord.opId, JSON.stringify(outboxRecord));
  database
    .prepare(
      `INSERT INTO ${FINANZAS_SQLITE_TABLES.syncState}(key, value) VALUES (?, ?)`,
    )
    .run("cursor", "42");

  database.close();
};
