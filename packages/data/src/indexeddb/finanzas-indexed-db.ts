import type { AccountType } from "@finanzas/domain";

export const FINANZAS_INDEXED_DB_NAME = "finanzas-app";
export const FINANZAS_INDEXED_DB_VERSION = 2;
export const TRANSACTION_ACCOUNT_ID_INDEX = "by-account-id";

export const FINANZAS_STORE_NAMES = {
  accounts: "accounts",
  budgets: "budgets",
  categories: "categories",
  recurringRules: "recurringRules",
  transactions: "transactions",
  transactionTemplates: "transactionTemplates",
  outbox: "outbox",
  syncState: "syncState",
  metadata: "metadata",
  schemaMigrations: "schemaMigrations",
} as const;

export type FinanzasStoreName =
  (typeof FINANZAS_STORE_NAMES)[keyof typeof FINANZAS_STORE_NAMES];

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

interface IndexedDbMigration {
  version: number;
  name: string;
  up(database: IDBDatabase, transaction: IDBTransaction | null): void;
}

const INDEXED_DB_MIGRATIONS: IndexedDbMigration[] = [
  {
    version: 1,
    name: "create-core-stores",
    up: (database, transaction) => {
      ensureStore(database, transaction, FINANZAS_STORE_NAMES.accounts, "id");
      ensureStore(database, transaction, FINANZAS_STORE_NAMES.budgets, "id");
      ensureStore(database, transaction, FINANZAS_STORE_NAMES.categories, "id");
      ensureStore(database, transaction, FINANZAS_STORE_NAMES.recurringRules, "id");
      ensureStore(
        database,
        transaction,
        FINANZAS_STORE_NAMES.transactionTemplates,
        "id",
      );
      ensureStore(database, transaction, FINANZAS_STORE_NAMES.outbox, "opId");
      ensureStore(database, transaction, FINANZAS_STORE_NAMES.syncState, "key");

      const transactionsStore = ensureStore(
        database,
        transaction,
        FINANZAS_STORE_NAMES.transactions,
        "id",
      );

      if (!transactionsStore.indexNames.contains(TRANSACTION_ACCOUNT_ID_INDEX)) {
        transactionsStore.createIndex(TRANSACTION_ACCOUNT_ID_INDEX, "accountId", {
          unique: false,
        });
      }
    },
  },
  {
    version: 2,
    name: "add-migration-metadata-stores",
    up: (database, transaction) => {
      ensureStore(database, transaction, FINANZAS_STORE_NAMES.metadata, "key");
      ensureStore(
        database,
        transaction,
        FINANZAS_STORE_NAMES.schemaMigrations,
        "version",
      );
    },
  },
];

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
  storeName: FinanzasStoreName,
  key: IDBValidKey,
): Promise<T | null> => {
  const value = await executeStoreRequest<T | undefined>(
    connection,
    storeName,
    "readonly",
    (store) => store.get(key),
  );

  return value ?? null;
};

export const getAllRecords = <T>(
  connection: IndexedDbConnection,
  storeName: FinanzasStoreName,
): Promise<T[]> =>
    executeStoreRequest<T[]>(connection, storeName, "readonly", (store) =>
      store.getAll(),
    );

export const getAllRecordsByIndex = <T>(
  connection: IndexedDbConnection,
  storeName: FinanzasStoreName,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> =>
    executeStoreRequest<T[]>(connection, storeName, "readonly", (store) =>
      store.index(indexName).getAll(key),
    );

export const putRecord = async <T>(
  connection: IndexedDbConnection,
  storeName: FinanzasStoreName,
  value: T,
): Promise<void> => {
  await executeStoreRequest<IDBValidKey>(
    connection,
    storeName,
    "readwrite",
    (store) => store.put(value),
  );
};

export const clearStore = async (
  connection: IndexedDbConnection,
  storeName: FinanzasStoreName,
): Promise<void> => {
  await executeStoreRequest<undefined>(
    connection,
    storeName,
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
    transaction.objectStore(FINANZAS_STORE_NAMES.accounts).put(seedAccount);
  }

  transaction.objectStore(FINANZAS_STORE_NAMES.syncState).put({
    key: "cursor",
    value: initialCursor,
  } satisfies SyncStateSeedRecord);
};

const applyIndexedDbMigrations = (
  database: IDBDatabase,
  transaction: IDBTransaction | null,
  previousVersion: number,
): void => {
  for (const migration of INDEXED_DB_MIGRATIONS) {
    if (migration.version <= previousVersion) {
      continue;
    }

    migration.up(database, transaction);
  }
};

const backfillMigrationState = (
  database: IDBDatabase,
  transaction: IDBTransaction | null,
): void => {
  if (
    transaction === null ||
    !database.objectStoreNames.contains(FINANZAS_STORE_NAMES.metadata) ||
    !database.objectStoreNames.contains(FINANZAS_STORE_NAMES.schemaMigrations)
  ) {
    return;
  }

  const appliedAt = new Date().toISOString();
  const metadataStore = transaction.objectStore(FINANZAS_STORE_NAMES.metadata);
  const migrationsStore = transaction.objectStore(
    FINANZAS_STORE_NAMES.schemaMigrations,
  );

  metadataStore.put({
    key: "schemaVersion",
    value: String(FINANZAS_INDEXED_DB_VERSION),
  } satisfies IndexedDbMetadataRecord);
  metadataStore.put({
    key: "lastMigratedAt",
    value: appliedAt,
  } satisfies IndexedDbMetadataRecord);

  for (const migration of INDEXED_DB_MIGRATIONS) {
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
  storeName: FinanzasStoreName,
  keyPath: string,
): IDBObjectStore => {
  if (database.objectStoreNames.contains(storeName)) {
    if (transaction === null) {
      throw new Error("IndexedDB upgrade transaction is required to access stores.");
    }

    return transaction.objectStore(storeName);
  }

  return database.createObjectStore(storeName, {
    keyPath,
  });
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
  storeName: FinanzasStoreName,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const database = await connection;

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
