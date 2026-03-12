import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type * as NodeSqliteModule from "node:sqlite";

import type { AccountType } from "@finanzas/domain";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof NodeSqliteModule;
type NodeSqliteDatabaseSync = NodeSqliteModule.DatabaseSync;

export const FINANZAS_SQLITE_DIRECTORY = ".finanzas";
export const FINANZAS_SQLITE_SCHEMA_VERSION = 2;

export const FINANZAS_SQLITE_TABLES = {
  accounts: "accounts",
  budgets: "budgets",
  categories: "categories",
  recurringRules: "recurring_rules",
  transactions: "transactions",
  transactionTemplates: "transaction_templates",
  outbox: "outbox_ops",
  syncState: "sync_state",
  metadata: "app_metadata",
  schemaMigrations: "schema_migrations",
} as const;

export type FinanzasSqliteTableName =
  (typeof FINANZAS_SQLITE_TABLES)[keyof typeof FINANZAS_SQLITE_TABLES];

export interface SeededAccountRecord {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export interface OpenFinanzasSqliteOptions {
  databasePath: string;
  seedAccount?: SeededAccountRecord;
  initialCursor?: string;
}

interface PayloadRow {
  payload: string;
}

interface SyncStateRow {
  value: string;
}

interface SqliteVersionRow {
  user_version: number;
}

interface SqliteTableCountRow {
  count: number;
}

interface SqliteMigration {
  version: number;
  name: string;
  up(database: NodeSqliteDatabaseSync): void;
}

type EncodedValue =
  | null
  | boolean
  | number
  | string
  | EncodedValue[]
  | {
    [key: string]: EncodedValue;
  };

const SQLITE_MIGRATIONS: SqliteMigration[] = [
  {
    version: 1,
    name: "create-core-tables",
    up: (database) => {
      createCoreTables(database);
    },
  },
  {
    version: 2,
    name: "add-migration-metadata-tables",
    up: (database) => {
      createMigrationTables(database);
    },
  },
];

export const openFinanzasSqlite = (
  options: OpenFinanzasSqliteOptions,
): NodeSqliteDatabaseSync => {
  const databasePath = normalizeDatabasePath(options.databasePath);

  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), {
      recursive: true,
    });
  }

  const database = new DatabaseSync(databasePath);

  if (databasePath !== ":memory:") {
    database.exec("PRAGMA journal_mode = WAL;");
  }

  const currentSchemaVersion = detectCurrentSqliteSchemaVersion(database);

  if (currentSchemaVersion < FINANZAS_SQLITE_SCHEMA_VERSION) {
    applySqliteMigrations(database, currentSchemaVersion);
  }

  if (options.seedAccount !== undefined) {
    const accountsCount = database
      .prepare(`SELECT COUNT(*) AS count FROM ${FINANZAS_SQLITE_TABLES.accounts}`)
      .get() as { count: number };

    if (accountsCount.count === 0) {
      putPayload(
        database,
        FINANZAS_SQLITE_TABLES.accounts,
        "id",
        options.seedAccount.id,
        options.seedAccount,
      );
    }
  }

  const cursorValue = options.initialCursor ?? "0";
  database
    .prepare(
      `INSERT OR IGNORE INTO ${FINANZAS_SQLITE_TABLES.syncState}(key, value) VALUES (?, ?)`,
    )
    .run("cursor", cursorValue);

  return database;
};

export const resolveFinanzasSqlitePath = (hostName: string): string =>
  resolve(process.cwd(), FINANZAS_SQLITE_DIRECTORY, `${hostName}.sqlite`);

export const getPayloadByKey = <T>(
  database: NodeSqliteDatabaseSync,
  tableName: FinanzasSqliteTableName,
  keyColumn: string,
  key: string,
): T | null => {
  const row = database
    .prepare(`SELECT payload FROM ${tableName} WHERE ${keyColumn} = ?`)
    .get(key) as PayloadRow | undefined;

  return row ? deserializePayload<T>(row.payload) : null;
};

export const listPayloads = <T>(
  database: NodeSqliteDatabaseSync,
  tableName: FinanzasSqliteTableName,
): T[] => {
  const rows = database
    .prepare(`SELECT payload FROM ${tableName}`)
    .all() as unknown as PayloadRow[];

  return rows.map((row) => deserializePayload<T>(row.payload));
};

export const listPayloadsByColumn = <T>(
  database: NodeSqliteDatabaseSync,
  tableName: FinanzasSqliteTableName,
  columnName: string,
  value: string,
): T[] => {
  const rows = database
    .prepare(`SELECT payload FROM ${tableName} WHERE ${columnName} = ?`)
    .all(value) as unknown as PayloadRow[];

  return rows.map((row) => deserializePayload<T>(row.payload));
};

export const putPayload = (
  database: NodeSqliteDatabaseSync,
  tableName: FinanzasSqliteTableName,
  keyColumn: string,
  key: string,
  payload: unknown,
  extraColumns: Record<string, string> = {},
): void => {
  const columns = [keyColumn, ...Object.keys(extraColumns), "payload"];
  const values = [key, ...Object.values(extraColumns), serializePayload(payload)];
  const placeholders = columns.map(() => "?").join(", ");

  database
    .prepare(
      `INSERT OR REPLACE INTO ${tableName}(${columns.join(", ")}) VALUES (${placeholders})`,
    )
    .run(...values);
};

export const clearTable = (
  database: NodeSqliteDatabaseSync,
  tableName: FinanzasSqliteTableName,
): void => {
  database.prepare(`DELETE FROM ${tableName}`).run();
};

export const getCursorValue = (
  database: NodeSqliteDatabaseSync,
  defaultCursor: string,
): string => {
  const row = database
    .prepare(
      `SELECT value FROM ${FINANZAS_SQLITE_TABLES.syncState} WHERE key = ?`,
    )
    .get("cursor") as SyncStateRow | undefined;

  return row?.value ?? defaultCursor;
};

export const setCursorValue = (
  database: NodeSqliteDatabaseSync,
  cursor: string,
): void => {
  database
    .prepare(
      `INSERT OR REPLACE INTO ${FINANZAS_SQLITE_TABLES.syncState}(key, value) VALUES (?, ?)`,
    )
    .run("cursor", cursor);
};

const normalizeDatabasePath = (databasePath: string): string =>
  databasePath === ":memory:" ? databasePath : resolve(databasePath);

const createCoreTables = (database: NodeSqliteDatabaseSync): void => {
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
};

const createMigrationTables = (database: NodeSqliteDatabaseSync): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.metadata} (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${FINANZAS_SQLITE_TABLES.schemaMigrations} (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
};

const detectCurrentSqliteSchemaVersion = (
  database: NodeSqliteDatabaseSync,
): number => {
  const versionRow = database
    .prepare("PRAGMA user_version")
    .get() as unknown as SqliteVersionRow | undefined;

  if (versionRow !== undefined && versionRow.user_version > 0) {
    return versionRow.user_version;
  }

  const legacyTables = [
    FINANZAS_SQLITE_TABLES.accounts,
    FINANZAS_SQLITE_TABLES.budgets,
    FINANZAS_SQLITE_TABLES.categories,
    FINANZAS_SQLITE_TABLES.recurringRules,
    FINANZAS_SQLITE_TABLES.transactions,
    FINANZAS_SQLITE_TABLES.transactionTemplates,
    FINANZAS_SQLITE_TABLES.outbox,
    FINANZAS_SQLITE_TABLES.syncState,
  ];
  const placeholders = legacyTables.map(() => "?").join(", ");
  const legacyCount = database
    .prepare(
      `SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`,
    )
    .get(...legacyTables) as unknown as SqliteTableCountRow;

  return legacyCount.count > 0 ? 1 : 0;
};

const applySqliteMigrations = (
  database: NodeSqliteDatabaseSync,
  currentSchemaVersion: number,
): void => {
  for (const migration of SQLITE_MIGRATIONS) {
    if (migration.version <= currentSchemaVersion) {
      continue;
    }

    migration.up(database);
  }

  if (FINANZAS_SQLITE_SCHEMA_VERSION >= 2) {
    backfillSqliteMigrationState(database);
  }

  database.exec(`PRAGMA user_version = ${FINANZAS_SQLITE_SCHEMA_VERSION}`);
};

const backfillSqliteMigrationState = (database: NodeSqliteDatabaseSync): void => {
  const appliedAt = new Date().toISOString();

  database
    .prepare(
      `INSERT OR REPLACE INTO ${FINANZAS_SQLITE_TABLES.metadata}(key, value) VALUES (?, ?)`,
    )
    .run("schemaVersion", String(FINANZAS_SQLITE_SCHEMA_VERSION));
  database
    .prepare(
      `INSERT OR REPLACE INTO ${FINANZAS_SQLITE_TABLES.metadata}(key, value) VALUES (?, ?)`,
    )
    .run("lastMigratedAt", appliedAt);

  for (const migration of SQLITE_MIGRATIONS) {
    database
      .prepare(
        `INSERT OR IGNORE INTO ${FINANZAS_SQLITE_TABLES.schemaMigrations}(version, name, applied_at) VALUES (?, ?, ?)`,
      )
      .run(migration.version, migration.name, appliedAt);
  }
};

const serializePayload = (payload: unknown): string =>
  JSON.stringify(encodePayloadNode(payload));

const deserializePayload = <T>(payload: string): T =>
  decodePayloadNode(JSON.parse(payload) as EncodedValue) as T;

const encodePayloadNode = (value: unknown): EncodedValue => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    return {
      __finanzasPersistType: "bigint",
      value: value.toString(),
    };
  }

  if (value instanceof Date) {
    return {
      __finanzasPersistType: "date",
      value: value.toISOString(),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => encodePayloadNode(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, encodePayloadNode(item)]),
    ) as EncodedValue;
  }

  return value as EncodedValue;
};

const decodePayloadNode = (value: EncodedValue): unknown => {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => decodePayloadNode(item));
  }

  if (typeof value === "object") {
    if (
      value.__finanzasPersistType === "bigint" &&
      typeof value.value === "string"
    ) {
      return BigInt(value.value);
    }

    if (
      value.__finanzasPersistType === "date" &&
      typeof value.value === "string"
    ) {
      return new Date(value.value);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, decodePayloadNode(item)]),
    );
  }

  return value;
};
