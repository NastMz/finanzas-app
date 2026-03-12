import type { AccountType } from "@finanzas/domain";
import {
  PERSISTENCE_COLLECTION_IDS,
  PERSISTENCE_INDEX_IDS,
  PERSISTENCE_METADATA_KEYS,
  PERSISTENCE_MIGRATIONS,
  PERSISTENCE_SCHEMA_VERSION,
  PERSISTENCE_SYNC_STATE_KEYS,
  buildIndexedDbStoreNames,
  getIndexedDbIndexName,
  getIndexedDbStoreName,
  getPersistenceCollectionDefinition,
  getPersistencePrimaryKeyPath,
  type PersistenceCollectionId,
  type PersistenceIndexId,
} from "../persistence/persistence-schema.js";

export const FINANZAS_INDEXED_DB_NAME = "finanzas-app";
export const FINANZAS_INDEXED_DB_VERSION = PERSISTENCE_SCHEMA_VERSION;
export const TRANSACTION_ACCOUNT_ID_INDEX = getIndexedDbIndexName(
  PERSISTENCE_COLLECTION_IDS.transactions,
  PERSISTENCE_INDEX_IDS.byAccountId,
);

export const FINANZAS_STORE_NAMES = buildIndexedDbStoreNames();

export type FinanzasStoreName = PersistenceCollectionId;

export type IndexedDbConnection = Promise<IDBDatabase>;

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

export interface OpenFinanzasIndexedDbOptions {
  databaseName?: string;
  indexedDb?: IDBFactory;
  seedAccount?: SeededAccountRecord;
  initialCursor?: string;
}

interface SyncStateSeedRecord {
  key: "cursor";
  value: string;
}

interface IndexedDbMetadataRecord {
  key: string;
  value: string;
}

interface IndexedDbMigrationRecord {
  version: number;
  name: string;
  appliedAt: string;
}

export const openFinanzasIndexedDb = (
  options: OpenFinanzasIndexedDbOptions = {},
): IndexedDbConnection => {
  const indexedDb = options.indexedDb ?? globalThis.indexedDB;

  if (indexedDb === undefined) {
    return Promise.reject(
      new Error("IndexedDB is not available in this runtime."),
    );
  }

  const databaseName = options.databaseName ?? FINANZAS_INDEXED_DB_NAME;
  const initialCursor = options.initialCursor ?? "0";

  return awaitOpenRequest(
    indexedDb.open(databaseName, FINANZAS_INDEXED_DB_VERSION),
    (database, transaction, previousVersion) => {
      applyIndexedDbMigrations(database, transaction, previousVersion);

      if (previousVersion === 0 && transaction !== null) {
        seedInitialState(transaction, options.seedAccount, initialCursor);
      }

      backfillMigrationState(database, transaction);
    },
  );
};

export const getRecord = async <T>(
  connection: IndexedDbConnection,
  collectionId: FinanzasStoreName,
  key: IDBValidKey,
): Promise<T | null> => {
  const value = await executeStoreRequest<T | undefined>(
    connection,
    collectionId,
    "readonly",
    (store) => store.get(key),
  );

  return value ?? null;
};

export const getAllRecords = <T>(
  connection: IndexedDbConnection,
  collectionId: FinanzasStoreName,
): Promise<T[]> =>
    executeStoreRequest<T[]>(connection, collectionId, "readonly", (store) =>
      store.getAll(),
    );

export const getAllRecordsByIndex = <T>(
  connection: IndexedDbConnection,
  collectionId: FinanzasStoreName,
  indexId: PersistenceIndexId,
  key: IDBValidKey,
): Promise<T[]> =>
    executeStoreRequest<T[]>(connection, collectionId, "readonly", (store) =>
      store.index(getIndexedDbIndexName(collectionId, indexId)).getAll(key),
    );

export const putRecord = async <T>(
  connection: IndexedDbConnection,
  collectionId: FinanzasStoreName,
  value: T,
): Promise<void> => {
  await executeStoreRequest<IDBValidKey>(
    connection,
    collectionId,
    "readwrite",
    (store) => store.put(value),
  );
};

export const clearStore = async (
  connection: IndexedDbConnection,
  collectionId: FinanzasStoreName,
): Promise<void> => {
  await executeStoreRequest<undefined>(
    connection,
    collectionId,
    "readwrite",
    (store) => store.clear(),
  );
};

const seedInitialState = (
  transaction: IDBTransaction,
  seedAccount: SeededAccountRecord | undefined,
  initialCursor: string,
): void => {
  if (seedAccount !== undefined) {
    transaction.objectStore(getIndexedDbStoreName(PERSISTENCE_COLLECTION_IDS.accounts)).put(
      seedAccount,
    );
  }

  transaction.objectStore(getIndexedDbStoreName(PERSISTENCE_COLLECTION_IDS.syncState)).put({
    key: PERSISTENCE_SYNC_STATE_KEYS.cursor,
    value: initialCursor,
  } satisfies SyncStateSeedRecord);
};

const applyIndexedDbMigrations = (
  database: IDBDatabase,
  transaction: IDBTransaction | null,
  previousVersion: number,
): void => {
  for (const migration of PERSISTENCE_MIGRATIONS) {
    if (migration.version <= previousVersion) {
      continue;
    }

    for (const collectionId of migration.collectionIds) {
      ensureStore(database, transaction, collectionId);
    }
  }
};

const backfillMigrationState = (
  database: IDBDatabase,
  transaction: IDBTransaction | null,
): void => {
  if (
    transaction === null ||
    !database.objectStoreNames.contains(
      getIndexedDbStoreName(PERSISTENCE_COLLECTION_IDS.metadata),
    ) ||
    !database.objectStoreNames.contains(
      getIndexedDbStoreName(PERSISTENCE_COLLECTION_IDS.schemaMigrations),
    )
  ) {
    return;
  }

  const appliedAt = new Date().toISOString();
  const metadataStore = transaction.objectStore(
    getIndexedDbStoreName(PERSISTENCE_COLLECTION_IDS.metadata),
  );
  const migrationsStore = transaction.objectStore(
    getIndexedDbStoreName(PERSISTENCE_COLLECTION_IDS.schemaMigrations),
  );

  metadataStore.put({
    key: PERSISTENCE_METADATA_KEYS.schemaVersion,
    value: String(FINANZAS_INDEXED_DB_VERSION),
  } satisfies IndexedDbMetadataRecord);
  metadataStore.put({
    key: PERSISTENCE_METADATA_KEYS.lastMigratedAt,
    value: appliedAt,
  } satisfies IndexedDbMetadataRecord);

  for (const migration of PERSISTENCE_MIGRATIONS) {
    migrationsStore.put({
      version: migration.version,
      name: migration.name,
      appliedAt,
    } satisfies IndexedDbMigrationRecord);
  }
};

const ensureStore = (
  database: IDBDatabase,
  transaction: IDBTransaction | null,
  collectionId: FinanzasStoreName,
): IDBObjectStore => {
  const storeName = getIndexedDbStoreName(collectionId);
  const keyPath = getPersistencePrimaryKeyPath(collectionId);
  const definition = getPersistenceCollectionDefinition(collectionId);

  if (database.objectStoreNames.contains(storeName)) {
    if (transaction === null) {
      throw new Error("IndexedDB upgrade transaction is required to access stores.");
    }

    const store = transaction.objectStore(storeName);

    if (definition.kind === "payload" && definition.indexes !== undefined) {
      ensureStoreIndexes(store, definition.indexes);
    }

    return store;
  }

  const store = database.createObjectStore(storeName, {
    keyPath,
  });

  if (definition.kind === "payload" && definition.indexes !== undefined) {
    ensureStoreIndexes(store, definition.indexes);
  }

  return store;
};

const awaitOpenRequest = (
  request: IDBOpenDBRequest,
  onUpgradeNeeded: (
    database: IDBDatabase,
    transaction: IDBTransaction | null,
    previousVersion: number,
  ) => void,
): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    request.onupgradeneeded = (event) => {
      onUpgradeNeeded(request.result, request.transaction, event.oldVersion);
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

const executeStoreRequest = async <T>(
  connection: IndexedDbConnection,
  collectionId: FinanzasStoreName,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const database = await connection;
  const storeName = getIndexedDbStoreName(collectionId);

  return await new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result: T | undefined;
    let settled = false;

    const resolveOnce = (value: T): void => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const rejectOnce = (error: unknown): void => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    let request: IDBRequest<T>;

    try {
      request = createRequest(store);
    } catch (error) {
      rejectOnce(error);
      transaction.abort();
      return;
    }

    request.onsuccess = () => {
      result = request.result;
    };

    request.onerror = () => {
      rejectOnce(request.error ?? new Error("IndexedDB request failed."));
    };

    transaction.oncomplete = () => {
      resolveOnce(result as T);
    };

    transaction.onerror = () => {
      rejectOnce(transaction.error ?? new Error("IndexedDB transaction failed."));
    };

    transaction.onabort = () => {
      rejectOnce(transaction.error ?? new Error("IndexedDB transaction was aborted."));
    };
  });
};

const ensureStoreIndexes = (
  store: IDBObjectStore,
  indexes:
  | ReadonlyArray<{
    indexedDbName: string;
    propertyPath: string;
  }>
  | undefined,
): void => {
  if (indexes === undefined) {
    return;
  }

  for (const index of indexes) {
    if (store.indexNames.contains(index.indexedDbName)) {
      continue;
    }

    store.createIndex(index.indexedDbName, index.propertyPath, {
      unique: false,
    });
  }
};
