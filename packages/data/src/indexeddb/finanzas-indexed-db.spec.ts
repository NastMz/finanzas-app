import { indexedDB as fakeIndexedDb } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import {
  FINANZAS_INDEXED_DB_VERSION,
  FINANZAS_STORE_NAMES,
  TRANSACTION_ACCOUNT_ID_INDEX,
  getAllRecords,
  getRecord,
  openFinanzasIndexedDb,
  type SeededAccountRecord,
} from "@finanzas/data";

interface IndexedDbMetadataRecord {
  key: string;
  value: string;
}

interface IndexedDbMigrationRecord {
  version: number;
  name: string;
  appliedAt: string;
}

interface SyncStateRecord {
  key: "cursor";
  value: string;
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

describe("openFinanzasIndexedDb", () => {
  it("creates migration metadata for fresh databases", async () => {
    const databaseName = createDatabaseName();
    const connection = openFinanzasIndexedDb({
      indexedDb: fakeIndexedDb,
      databaseName,
      seedAccount: seededAccount,
      initialCursor: "15",
    });
    const database = await connection;

    expect(database.version).toBe(FINANZAS_INDEXED_DB_VERSION);
    expect(database.objectStoreNames.contains(FINANZAS_STORE_NAMES.metadata)).toBe(
      true,
    );
    expect(
      database.objectStoreNames.contains(FINANZAS_STORE_NAMES.schemaMigrations),
    ).toBe(true);

    const schemaVersion = await getRecord<IndexedDbMetadataRecord>(
      connection,
      FINANZAS_STORE_NAMES.metadata,
      "schemaVersion",
    );
    const lastMigratedAt = await getRecord<IndexedDbMetadataRecord>(
      connection,
      FINANZAS_STORE_NAMES.metadata,
      "lastMigratedAt",
    );
    const migrations = await getAllRecords<IndexedDbMigrationRecord>(
      connection,
      FINANZAS_STORE_NAMES.schemaMigrations,
    );
    const account = await getRecord<SeededAccountRecord>(
      connection,
      FINANZAS_STORE_NAMES.accounts,
      seededAccount.id,
    );
    const cursor = await getRecord<SyncStateRecord>(
      connection,
      FINANZAS_STORE_NAMES.syncState,
      "cursor",
    );

    expect(schemaVersion).toEqual({
      key: "schemaVersion",
      value: String(FINANZAS_INDEXED_DB_VERSION),
    });
    expect(lastMigratedAt?.value).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    expect(migrations).toHaveLength(2);
    expect(
      migrations.map((migration) => ({
        version: migration.version,
        name: migration.name,
      })),
    ).toEqual([
      {
        version: 1,
        name: "create-core-stores",
      },
      {
        version: 2,
        name: "add-migration-metadata-stores",
      },
    ]);
    expect(migrations.every((migration) => migration.appliedAt.length > 0)).toBe(
      true,
    );
    expect(account).toEqual(seededAccount);
    expect(cursor).toEqual({
      key: "cursor",
      value: "15",
    });

    database.close();
  });

  it("upgrades legacy databases without losing persisted records", async () => {
    const databaseName = createDatabaseName();
    const legacyAccount: SeededAccountRecord = {
      id: "acc-legacy",
      name: "Cuenta legacy",
      type: "cash",
      currency: "USD",
      createdAt: "2025-12-01T09:00:00.000Z",
      updatedAt: "2025-12-01T09:00:00.000Z",
      deletedAt: null,
      version: 3,
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

    const legacyDatabase = await openLegacyIndexedDb(databaseName);

    await putLegacyRecord(
      legacyDatabase,
      FINANZAS_STORE_NAMES.accounts,
      legacyAccount,
    );
    await putLegacyRecord(
      legacyDatabase,
      FINANZAS_STORE_NAMES.outbox,
      legacyOutbox,
    );
    await putLegacyRecord(
      legacyDatabase,
      FINANZAS_STORE_NAMES.syncState,
      {
        key: "cursor",
        value: "42",
      } satisfies SyncStateRecord,
    );
    legacyDatabase.close();

    const connection = openFinanzasIndexedDb({
      indexedDb: fakeIndexedDb,
      databaseName,
      seedAccount: seededAccount,
      initialCursor: "0",
    });
    const upgradedDatabase = await connection;

    expect(upgradedDatabase.version).toBe(FINANZAS_INDEXED_DB_VERSION);
    expect(
      upgradedDatabase.objectStoreNames.contains(FINANZAS_STORE_NAMES.metadata),
    ).toBe(true);
    expect(
      upgradedDatabase.objectStoreNames.contains(
        FINANZAS_STORE_NAMES.schemaMigrations,
      ),
    ).toBe(true);

    const storedLegacyAccount = await getRecord<SeededAccountRecord>(
      connection,
      FINANZAS_STORE_NAMES.accounts,
      legacyAccount.id,
    );
    const missingSeededAccount = await getRecord<SeededAccountRecord>(
      connection,
      FINANZAS_STORE_NAMES.accounts,
      seededAccount.id,
    );
    const storedOutbox = await getRecord<LegacyOutboxRecord>(
      connection,
      FINANZAS_STORE_NAMES.outbox,
      legacyOutbox.opId,
    );
    const cursor = await getRecord<SyncStateRecord>(
      connection,
      FINANZAS_STORE_NAMES.syncState,
      "cursor",
    );
    const schemaVersion = await getRecord<IndexedDbMetadataRecord>(
      connection,
      FINANZAS_STORE_NAMES.metadata,
      "schemaVersion",
    );
    const migrations = await getAllRecords<IndexedDbMigrationRecord>(
      connection,
      FINANZAS_STORE_NAMES.schemaMigrations,
    );

    expect(storedLegacyAccount).toEqual(legacyAccount);
    expect(missingSeededAccount).toBeNull();
    expect(storedOutbox).toEqual(legacyOutbox);
    expect(cursor).toEqual({
      key: "cursor",
      value: "42",
    });
    expect(schemaVersion).toEqual({
      key: "schemaVersion",
      value: String(FINANZAS_INDEXED_DB_VERSION),
    });
    expect(
      migrations.map((migration) => ({
        version: migration.version,
        name: migration.name,
      })),
    ).toEqual([
      {
        version: 1,
        name: "create-core-stores",
      },
      {
        version: 2,
        name: "add-migration-metadata-stores",
      },
    ]);

    upgradedDatabase.close();
  });
});

const createDatabaseName = (): string =>
  `finanzas-indexeddb-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const openLegacyIndexedDb = async (databaseName: string): Promise<IDBDatabase> =>
  await awaitOpenRequest(fakeIndexedDb.open(databaseName, 1), (database) => {
    database.createObjectStore(FINANZAS_STORE_NAMES.accounts, {
      keyPath: "id",
    });
    database.createObjectStore(FINANZAS_STORE_NAMES.budgets, {
      keyPath: "id",
    });
    database.createObjectStore(FINANZAS_STORE_NAMES.categories, {
      keyPath: "id",
    });
    database.createObjectStore(FINANZAS_STORE_NAMES.recurringRules, {
      keyPath: "id",
    });

    const transactionsStore = database.createObjectStore(
      FINANZAS_STORE_NAMES.transactions,
      {
        keyPath: "id",
      },
    );

    transactionsStore.createIndex(TRANSACTION_ACCOUNT_ID_INDEX, "accountId", {
      unique: false,
    });

    database.createObjectStore(FINANZAS_STORE_NAMES.transactionTemplates, {
      keyPath: "id",
    });
    database.createObjectStore(FINANZAS_STORE_NAMES.outbox, {
      keyPath: "opId",
    });
    database.createObjectStore(FINANZAS_STORE_NAMES.syncState, {
      keyPath: "key",
    });
  });

const putLegacyRecord = async (
  database: IDBDatabase,
  storeName: string,
  value: unknown,
): Promise<void> => {
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).put(value);

    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB put request failed."));
    };

    transaction.oncomplete = () => {
      resolve(undefined);
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
    };
  });
};

const awaitOpenRequest = (
  request: IDBOpenDBRequest,
  onUpgradeNeeded?: (database: IDBDatabase) => void,
): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    request.onupgradeneeded = () => {
      onUpgradeNeeded?.(request.result);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB open request failed."));
    };

    request.onblocked = () => {
      reject(new Error("IndexedDB open request was blocked."));
    };
  });
