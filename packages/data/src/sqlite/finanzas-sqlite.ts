import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type * as NodeSqliteModule from "node:sqlite";

import type { AccountType } from "@finanzas/domain";
import {
  PERSISTENCE_COLLECTION_IDS,
  PERSISTENCE_METADATA_KEYS,
  PERSISTENCE_MIGRATIONS,
  PERSISTENCE_SCHEMA_VERSION,
  PERSISTENCE_SYNC_STATE_KEYS,
  buildSqliteTableNames,
  getPersistenceCollectionDefinition,
  getSqliteExtraColumnDefinitions,
  getSqliteExtraColumnValues,
  getSqliteIndexColumnName,
  getSqliteMigrationColumns,
  getSqlitePayloadColumn,
  getSqlitePrimaryKeyColumn,
  getSqliteTableName,
  getSqliteValueColumn,
  type PersistenceCollectionId,
  type PersistenceIndexId,
} from "../persistence/persistence-schema.js";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof NodeSqliteModule;
type NodeSqliteDatabaseSync = NodeSqliteModule.DatabaseSync;

export const FINANZAS_SQLITE_DIRECTORY = ".finanzas";
export const FINANZAS_SQLITE_SCHEMA_VERSION = PERSISTENCE_SCHEMA_VERSION;

export const FINANZAS_SQLITE_TABLES = buildSqliteTableNames();

export type FinanzasSqliteTableName = PersistenceCollectionId;

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

type EncodedValue =
  | null
  | boolean
  | number
  | string
  | EncodedValue[]
  | {
    [key: string]: EncodedValue;
  };

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
      .prepare(
        `SELECT COUNT(*) AS count FROM ${getSqliteTableName(PERSISTENCE_COLLECTION_IDS.accounts)}`,
      )
      .get() as { count: number };

    if (accountsCount.count === 0) {
      putPayload(
        database,
        PERSISTENCE_COLLECTION_IDS.accounts,
        options.seedAccount.id,
        options.seedAccount,
      );
    }
  }

  const cursorValue = options.initialCursor ?? "0";
  insertKeyValueIfMissing(
    database,
    PERSISTENCE_COLLECTION_IDS.syncState,
    PERSISTENCE_SYNC_STATE_KEYS.cursor,
    cursorValue,
  );

  return database;
};

export const resolveFinanzasSqlitePath = (hostName: string): string =>
  resolve(process.cwd(), FINANZAS_SQLITE_DIRECTORY, `${hostName}.sqlite`);

export const getPayloadByKey = <T>(
  database: NodeSqliteDatabaseSync,
  collectionId: FinanzasSqliteTableName,
  key: string,
): T | null => {
  const tableName = getSqliteTableName(collectionId);
  const keyColumn = getSqlitePrimaryKeyColumn(collectionId);
  const payloadColumn = getSqlitePayloadColumn(collectionId);
  const row = database
    .prepare(`SELECT ${payloadColumn} AS payload FROM ${tableName} WHERE ${keyColumn} = ?`)
    .get(key) as PayloadRow | undefined;

  return row ? deserializePayload<T>(row.payload) : null;
};

export const listPayloads = <T>(
  database: NodeSqliteDatabaseSync,
  collectionId: FinanzasSqliteTableName,
): T[] => {
  const tableName = getSqliteTableName(collectionId);
  const payloadColumn = getSqlitePayloadColumn(collectionId);
  const rows = database
    .prepare(`SELECT ${payloadColumn} AS payload FROM ${tableName}`)
    .all() as unknown as PayloadRow[];

  return rows.map((row) => deserializePayload<T>(row.payload));
};

export const listPayloadsByIndex = <T>(
  database: NodeSqliteDatabaseSync,
  collectionId: FinanzasSqliteTableName,
  indexId: PersistenceIndexId,
  value: string,
): T[] => {
  const tableName = getSqliteTableName(collectionId);
  const payloadColumn = getSqlitePayloadColumn(collectionId);
  const columnName = getSqliteIndexColumnName(collectionId, indexId);
  const rows = database
    .prepare(`SELECT ${payloadColumn} AS payload FROM ${tableName} WHERE ${columnName} = ?`)
    .all(value) as unknown as PayloadRow[];

  return rows.map((row) => deserializePayload<T>(row.payload));
};

export const putPayload = (
  database: NodeSqliteDatabaseSync,
  collectionId: FinanzasSqliteTableName,
  key: string,
  payload: unknown,
): void => {
  const tableName = getSqliteTableName(collectionId);
  const keyColumn = getSqlitePrimaryKeyColumn(collectionId);
  const payloadColumn = getSqlitePayloadColumn(collectionId);
  const extraColumns =
    getSqliteExtraColumnDefinitions(collectionId).length === 0
      ? {}
      : getSqliteExtraColumnValues(collectionId, toRecordPayload(payload));
  const columns = [keyColumn, ...Object.keys(extraColumns), payloadColumn];
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
  collectionId: FinanzasSqliteTableName,
): void => {
  const tableName = getSqliteTableName(collectionId);
  database.prepare(`DELETE FROM ${tableName}`).run();
};

export const getCursorValue = (
  database: NodeSqliteDatabaseSync,
  defaultCursor: string,
): string => {
  const row = readKeyValue(
    database,
    PERSISTENCE_COLLECTION_IDS.syncState,
    PERSISTENCE_SYNC_STATE_KEYS.cursor,
  );

  return row ?? defaultCursor;
};

export const setCursorValue = (
  database: NodeSqliteDatabaseSync,
  cursor: string,
): void => {
  upsertKeyValue(
    database,
    PERSISTENCE_COLLECTION_IDS.syncState,
    PERSISTENCE_SYNC_STATE_KEYS.cursor,
    cursor,
  );
};

const normalizeDatabasePath = (databasePath: string): string =>
  databasePath === ":memory:" ? databasePath : resolve(databasePath);

const createCoreTables = (database: NodeSqliteDatabaseSync): void => {
  const coreMigration = PERSISTENCE_MIGRATIONS.find((migration) => migration.version === 1);

  if (coreMigration === undefined) {
    throw new Error("Core persistence migration is not defined.");
  }

  for (const collectionId of coreMigration.collectionIds) {
    createSqliteCollectionTable(database, collectionId);
  }
};

const createMigrationTables = (database: NodeSqliteDatabaseSync): void => {
  const migrationTracking = PERSISTENCE_MIGRATIONS.find(
    (migration) => migration.version === 2,
  );

  if (migrationTracking === undefined) {
    throw new Error("Schema tracking migration is not defined.");
  }

  for (const collectionId of migrationTracking.collectionIds) {
    createSqliteCollectionTable(database, collectionId);
  }
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

  const coreMigration = PERSISTENCE_MIGRATIONS.find((migration) => migration.version === 1);

  if (coreMigration === undefined) {
    throw new Error("Core persistence migration is not defined.");
  }

  const legacyTables = coreMigration.collectionIds.map((collectionId) =>
    getSqliteTableName(collectionId),
  );
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
  for (const migration of PERSISTENCE_MIGRATIONS) {
    if (migration.version <= currentSchemaVersion) {
      continue;
    }

    if (migration.version === 1) {
      createCoreTables(database);
      continue;
    }

    if (migration.version === 2) {
      createMigrationTables(database);
      continue;
    }

    for (const collectionId of migration.collectionIds) {
      createSqliteCollectionTable(database, collectionId);
    }
  }

  if (FINANZAS_SQLITE_SCHEMA_VERSION >= 2) {
    backfillSqliteMigrationState(database);
  }

  database.exec(`PRAGMA user_version = ${FINANZAS_SQLITE_SCHEMA_VERSION}`);
};

const backfillSqliteMigrationState = (database: NodeSqliteDatabaseSync): void => {
  const appliedAt = new Date().toISOString();

  upsertKeyValue(
    database,
    PERSISTENCE_COLLECTION_IDS.metadata,
    PERSISTENCE_METADATA_KEYS.schemaVersion,
    String(FINANZAS_SQLITE_SCHEMA_VERSION),
  );
  upsertKeyValue(
    database,
    PERSISTENCE_COLLECTION_IDS.metadata,
    PERSISTENCE_METADATA_KEYS.lastMigratedAt,
    appliedAt,
  );

  for (const migration of PERSISTENCE_MIGRATIONS) {
    const tableName = getSqliteTableName(PERSISTENCE_COLLECTION_IDS.schemaMigrations);
    const primaryKeyColumn = getSqlitePrimaryKeyColumn(
      PERSISTENCE_COLLECTION_IDS.schemaMigrations,
    );
    const migrationColumns = getSqliteMigrationColumns(
      PERSISTENCE_COLLECTION_IDS.schemaMigrations,
    );
    database
      .prepare(
        `INSERT OR IGNORE INTO ${tableName}(${primaryKeyColumn}, ${migrationColumns.name}, ${migrationColumns.appliedAt}) VALUES (?, ?, ?)`,
      )
      .run(migration.version, migration.name, appliedAt);
  }
};

const createSqliteCollectionTable = (
  database: NodeSqliteDatabaseSync,
  collectionId: PersistenceCollectionId,
): void => {
  const collection = getPersistenceCollectionDefinition(collectionId);
  const tableName = getSqliteTableName(collectionId);
  const primaryKeyColumn = getSqlitePrimaryKeyColumn(collectionId);

  if (collection.kind === "payload") {
    const columns = [
      `${primaryKeyColumn} TEXT PRIMARY KEY NOT NULL`,
      ...collection.extraSqliteColumns?.map(
        (column) => `${column.columnName} ${column.type} NOT NULL`,
      ) ?? [],
      `${collection.payloadColumn} TEXT NOT NULL`,
    ];

    database.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.join(",\n        ")}
      );
    `);

    for (const index of collection.indexes ?? []) {
      database.exec(`
        CREATE INDEX IF NOT EXISTS ${index.sqlite.indexName}
          ON ${tableName}(${index.sqlite.columnName});
      `);
    }

    return;
  }

  if (collection.kind === "key-value") {
    database.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${primaryKeyColumn} TEXT PRIMARY KEY NOT NULL,
        ${collection.valueColumn} TEXT NOT NULL
      );
    `);
    return;
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${primaryKeyColumn} INTEGER PRIMARY KEY NOT NULL,
      ${collection.columns.name} TEXT NOT NULL,
      ${collection.columns.appliedAt} TEXT NOT NULL
    );
  `);
};

const readKeyValue = (
  database: NodeSqliteDatabaseSync,
  collectionId: PersistenceCollectionId,
  key: string,
): string | null => {
  const tableName = getSqliteTableName(collectionId);
  const primaryKeyColumn = getSqlitePrimaryKeyColumn(collectionId);
  const valueColumn = getSqliteValueColumn(collectionId);
  const row = database
    .prepare(
      `SELECT ${valueColumn} AS value FROM ${tableName} WHERE ${primaryKeyColumn} = ?`,
    )
    .get(key) as SyncStateRow | undefined;

  return row?.value ?? null;
};

const upsertKeyValue = (
  database: NodeSqliteDatabaseSync,
  collectionId: PersistenceCollectionId,
  key: string,
  value: string,
): void => {
  const tableName = getSqliteTableName(collectionId);
  const primaryKeyColumn = getSqlitePrimaryKeyColumn(collectionId);
  const valueColumn = getSqliteValueColumn(collectionId);

  database
    .prepare(
      `INSERT OR REPLACE INTO ${tableName}(${primaryKeyColumn}, ${valueColumn}) VALUES (?, ?)`,
    )
    .run(key, value);
};

const insertKeyValueIfMissing = (
  database: NodeSqliteDatabaseSync,
  collectionId: PersistenceCollectionId,
  key: string,
  value: string,
): void => {
  const tableName = getSqliteTableName(collectionId);
  const primaryKeyColumn = getSqlitePrimaryKeyColumn(collectionId);
  const valueColumn = getSqliteValueColumn(collectionId);

  database
    .prepare(
      `INSERT OR IGNORE INTO ${tableName}(${primaryKeyColumn}, ${valueColumn}) VALUES (?, ?)`,
    )
    .run(key, value);
};

const toRecordPayload = (payload: unknown): Record<string, unknown> => {
  if (payload !== null && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }

  throw new Error("Expected an object payload for SQLite persistence.");
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
