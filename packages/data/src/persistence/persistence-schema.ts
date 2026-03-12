export const PERSISTENCE_SCHEMA_VERSION = 2;

export const PERSISTENCE_COLLECTION_IDS = {
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

export type PersistenceCollectionId =
  (typeof PERSISTENCE_COLLECTION_IDS)[keyof typeof PERSISTENCE_COLLECTION_IDS];

export const PERSISTENCE_INDEX_IDS = {
  byAccountId: "byAccountId",
} as const;

export type PersistenceIndexId =
  (typeof PERSISTENCE_INDEX_IDS)[keyof typeof PERSISTENCE_INDEX_IDS];

export const PERSISTENCE_SYNC_STATE_KEYS = {
  cursor: "cursor",
} as const;

export const PERSISTENCE_METADATA_KEYS = {
  schemaVersion: "schemaVersion",
  lastMigratedAt: "lastMigratedAt",
} as const;

interface PersistenceIndexDefinition {
  id: PersistenceIndexId;
  propertyPath: string;
  indexedDbName: string;
  sqlite: {
    indexName: string;
    columnName: string;
  };
}

interface PersistenceSqliteExtraColumnDefinition {
  columnName: string;
  sourcePath: string;
  type: "INTEGER" | "TEXT";
}

interface BasePersistenceCollectionDefinition {
  id: PersistenceCollectionId;
  introducedInVersion: number;
  primaryKeyPath: string;
  indexedDb: {
    storeName: string;
  };
  sqlite: {
    tableName: string;
    primaryKeyColumn: string;
  };
}

interface PayloadPersistenceCollectionDefinition
  extends BasePersistenceCollectionDefinition {
  kind: "payload";
  payloadColumn: string;
  extraSqliteColumns?: readonly PersistenceSqliteExtraColumnDefinition[];
  indexes?: readonly PersistenceIndexDefinition[];
}

interface KeyValuePersistenceCollectionDefinition
  extends BasePersistenceCollectionDefinition {
  kind: "key-value";
  valueColumn: string;
}

interface MigrationHistoryPersistenceCollectionDefinition
  extends BasePersistenceCollectionDefinition {
  kind: "migration-history";
  columns: {
    name: string;
    appliedAt: string;
  };
}

export type PersistenceCollectionDefinition =
  | PayloadPersistenceCollectionDefinition
  | KeyValuePersistenceCollectionDefinition
  | MigrationHistoryPersistenceCollectionDefinition;

export interface PersistenceMigrationDefinition {
  version: number;
  name: string;
  collectionIds: readonly PersistenceCollectionId[];
}

export const PERSISTENCE_COLLECTION_ORDER: readonly PersistenceCollectionId[] = [
  PERSISTENCE_COLLECTION_IDS.accounts,
  PERSISTENCE_COLLECTION_IDS.budgets,
  PERSISTENCE_COLLECTION_IDS.categories,
  PERSISTENCE_COLLECTION_IDS.recurringRules,
  PERSISTENCE_COLLECTION_IDS.transactions,
  PERSISTENCE_COLLECTION_IDS.transactionTemplates,
  PERSISTENCE_COLLECTION_IDS.outbox,
  PERSISTENCE_COLLECTION_IDS.syncState,
  PERSISTENCE_COLLECTION_IDS.metadata,
  PERSISTENCE_COLLECTION_IDS.schemaMigrations,
] as const;

export const PERSISTENCE_COLLECTION_DEFINITIONS: Readonly<
Record<PersistenceCollectionId, PersistenceCollectionDefinition>
> = {
  accounts: {
    id: PERSISTENCE_COLLECTION_IDS.accounts,
    introducedInVersion: 1,
    kind: "payload",
    primaryKeyPath: "id",
    payloadColumn: "payload",
    indexedDb: {
      storeName: "accounts",
    },
    sqlite: {
      tableName: "accounts",
      primaryKeyColumn: "id",
    },
  },
  budgets: {
    id: PERSISTENCE_COLLECTION_IDS.budgets,
    introducedInVersion: 1,
    kind: "payload",
    primaryKeyPath: "id",
    payloadColumn: "payload",
    indexedDb: {
      storeName: "budgets",
    },
    sqlite: {
      tableName: "budgets",
      primaryKeyColumn: "id",
    },
  },
  categories: {
    id: PERSISTENCE_COLLECTION_IDS.categories,
    introducedInVersion: 1,
    kind: "payload",
    primaryKeyPath: "id",
    payloadColumn: "payload",
    indexedDb: {
      storeName: "categories",
    },
    sqlite: {
      tableName: "categories",
      primaryKeyColumn: "id",
    },
  },
  recurringRules: {
    id: PERSISTENCE_COLLECTION_IDS.recurringRules,
    introducedInVersion: 1,
    kind: "payload",
    primaryKeyPath: "id",
    payloadColumn: "payload",
    indexedDb: {
      storeName: "recurringRules",
    },
    sqlite: {
      tableName: "recurring_rules",
      primaryKeyColumn: "id",
    },
  },
  transactions: {
    id: PERSISTENCE_COLLECTION_IDS.transactions,
    introducedInVersion: 1,
    kind: "payload",
    primaryKeyPath: "id",
    payloadColumn: "payload",
    extraSqliteColumns: [
      {
        columnName: "account_id",
        sourcePath: "accountId",
        type: "TEXT",
      },
    ],
    indexes: [
      {
        id: PERSISTENCE_INDEX_IDS.byAccountId,
        propertyPath: "accountId",
        indexedDbName: "by-account-id",
        sqlite: {
          indexName: "transactions_by_account_id",
          columnName: "account_id",
        },
      },
    ],
    indexedDb: {
      storeName: "transactions",
    },
    sqlite: {
      tableName: "transactions",
      primaryKeyColumn: "id",
    },
  },
  transactionTemplates: {
    id: PERSISTENCE_COLLECTION_IDS.transactionTemplates,
    introducedInVersion: 1,
    kind: "payload",
    primaryKeyPath: "id",
    payloadColumn: "payload",
    indexedDb: {
      storeName: "transactionTemplates",
    },
    sqlite: {
      tableName: "transaction_templates",
      primaryKeyColumn: "id",
    },
  },
  outbox: {
    id: PERSISTENCE_COLLECTION_IDS.outbox,
    introducedInVersion: 1,
    kind: "payload",
    primaryKeyPath: "opId",
    payloadColumn: "payload",
    indexedDb: {
      storeName: "outbox",
    },
    sqlite: {
      tableName: "outbox_ops",
      primaryKeyColumn: "op_id",
    },
  },
  syncState: {
    id: PERSISTENCE_COLLECTION_IDS.syncState,
    introducedInVersion: 1,
    kind: "key-value",
    primaryKeyPath: "key",
    valueColumn: "value",
    indexedDb: {
      storeName: "syncState",
    },
    sqlite: {
      tableName: "sync_state",
      primaryKeyColumn: "key",
    },
  },
  metadata: {
    id: PERSISTENCE_COLLECTION_IDS.metadata,
    introducedInVersion: 2,
    kind: "key-value",
    primaryKeyPath: "key",
    valueColumn: "value",
    indexedDb: {
      storeName: "metadata",
    },
    sqlite: {
      tableName: "app_metadata",
      primaryKeyColumn: "key",
    },
  },
  schemaMigrations: {
    id: PERSISTENCE_COLLECTION_IDS.schemaMigrations,
    introducedInVersion: 2,
    kind: "migration-history",
    primaryKeyPath: "version",
    columns: {
      name: "name",
      appliedAt: "applied_at",
    },
    indexedDb: {
      storeName: "schemaMigrations",
    },
    sqlite: {
      tableName: "schema_migrations",
      primaryKeyColumn: "version",
    },
  },
} as const;

export const PERSISTENCE_MIGRATIONS: readonly PersistenceMigrationDefinition[] = [
  {
    version: 1,
    name: "create-core-storage",
    collectionIds: [
      PERSISTENCE_COLLECTION_IDS.accounts,
      PERSISTENCE_COLLECTION_IDS.budgets,
      PERSISTENCE_COLLECTION_IDS.categories,
      PERSISTENCE_COLLECTION_IDS.recurringRules,
      PERSISTENCE_COLLECTION_IDS.transactions,
      PERSISTENCE_COLLECTION_IDS.transactionTemplates,
      PERSISTENCE_COLLECTION_IDS.outbox,
      PERSISTENCE_COLLECTION_IDS.syncState,
    ],
  },
  {
    version: 2,
    name: "add-schema-tracking-storage",
    collectionIds: [
      PERSISTENCE_COLLECTION_IDS.metadata,
      PERSISTENCE_COLLECTION_IDS.schemaMigrations,
    ],
  },
] as const;

export const getPersistenceCollectionDefinition = (
  collectionId: PersistenceCollectionId,
): PersistenceCollectionDefinition => PERSISTENCE_COLLECTION_DEFINITIONS[collectionId];

export const listPersistenceCollectionDefinitions = (): PersistenceCollectionDefinition[] =>
  PERSISTENCE_COLLECTION_ORDER.map((collectionId) =>
    getPersistenceCollectionDefinition(collectionId),
  );

export const getPersistenceMigration = (
  version: number,
): PersistenceMigrationDefinition => {
  const migration = PERSISTENCE_MIGRATIONS.find(
    (entry) => entry.version === version,
  );

  if (migration === undefined) {
    throw new Error(`Unknown persistence migration version: ${version}`);
  }

  return migration;
};

export const getIndexedDbStoreName = (
  collectionId: PersistenceCollectionId,
): string => getPersistenceCollectionDefinition(collectionId).indexedDb.storeName;

export const getSqliteTableName = (
  collectionId: PersistenceCollectionId,
): string => getPersistenceCollectionDefinition(collectionId).sqlite.tableName;

export const getPersistencePrimaryKeyPath = (
  collectionId: PersistenceCollectionId,
): string => getPersistenceCollectionDefinition(collectionId).primaryKeyPath;

export const getSqlitePrimaryKeyColumn = (
  collectionId: PersistenceCollectionId,
): string => getPersistenceCollectionDefinition(collectionId).sqlite.primaryKeyColumn;

export const getPersistenceIndexDefinition = (
  collectionId: PersistenceCollectionId,
  indexId: PersistenceIndexId,
): PersistenceIndexDefinition => {
  const collection = getPersistenceCollectionDefinition(collectionId);

  if (collection.kind !== "payload" || collection.indexes === undefined) {
    throw new Error(`Collection ${collectionId} does not define indexes.`);
  }

  const index = collection.indexes.find((entry) => entry.id === indexId);

  if (index === undefined) {
    throw new Error(`Unknown index ${indexId} for collection ${collectionId}.`);
  }

  return index;
};

export const getIndexedDbIndexName = (
  collectionId: PersistenceCollectionId,
  indexId: PersistenceIndexId,
): string => getPersistenceIndexDefinition(collectionId, indexId).indexedDbName;

export const getSqliteIndexName = (
  collectionId: PersistenceCollectionId,
  indexId: PersistenceIndexId,
): string => getPersistenceIndexDefinition(collectionId, indexId).sqlite.indexName;

export const getSqliteIndexColumnName = (
  collectionId: PersistenceCollectionId,
  indexId: PersistenceIndexId,
): string => getPersistenceIndexDefinition(collectionId, indexId).sqlite.columnName;

export const getSqliteValueColumn = (
  collectionId: PersistenceCollectionId,
): string => {
  const collection = getPersistenceCollectionDefinition(collectionId);

  if (collection.kind !== "key-value") {
    throw new Error(`Collection ${collectionId} is not key-value storage.`);
  }

  return collection.valueColumn;
};

export const getSqlitePayloadColumn = (
  collectionId: PersistenceCollectionId,
): string => {
  const collection = getPersistenceCollectionDefinition(collectionId);

  if (collection.kind !== "payload") {
    throw new Error(`Collection ${collectionId} is not payload storage.`);
  }

  return collection.payloadColumn;
};

export const getSqliteMigrationColumns = (
  collectionId: PersistenceCollectionId,
): MigrationHistoryPersistenceCollectionDefinition["columns"] => {
  const collection = getPersistenceCollectionDefinition(collectionId);

  if (collection.kind !== "migration-history") {
    throw new Error(`Collection ${collectionId} is not migration history storage.`);
  }

  return collection.columns;
};

export const getSqliteExtraColumnDefinitions = (
  collectionId: PersistenceCollectionId,
): readonly PersistenceSqliteExtraColumnDefinition[] => {
  const collection = getPersistenceCollectionDefinition(collectionId);

  if (collection.kind !== "payload" || collection.extraSqliteColumns === undefined) {
    return [];
  }

  return collection.extraSqliteColumns;
};

export const getSqliteExtraColumnValues = (
  collectionId: PersistenceCollectionId,
  record: Record<string, unknown>,
): Record<string, string | number> =>
  Object.fromEntries(
    getSqliteExtraColumnDefinitions(collectionId).map((definition) => [
      definition.columnName,
      readRecordPath(record, definition.sourcePath),
    ]),
  ) as Record<string, string | number>;

export const buildIndexedDbStoreNames = (): Record<
PersistenceCollectionId,
string
> =>
  Object.fromEntries(
    PERSISTENCE_COLLECTION_ORDER.map((collectionId) => [
      collectionId,
      getIndexedDbStoreName(collectionId),
    ]),
  ) as Record<PersistenceCollectionId, string>;

export const buildSqliteTableNames = (): Record<
PersistenceCollectionId,
string
> =>
  Object.fromEntries(
    PERSISTENCE_COLLECTION_ORDER.map((collectionId) => [
      collectionId,
      getSqliteTableName(collectionId),
    ]),
  ) as Record<PersistenceCollectionId, string>;

const readRecordPath = (
  record: Record<string, unknown>,
  sourcePath: string,
): string | number => {
  const value = sourcePath
    .split(".")
    .reduce<unknown>((currentValue, key) => {
    if (currentValue === null || typeof currentValue !== "object") {
      return undefined;
    }

    return (currentValue as Record<string, unknown>)[key];
  }, record);

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  throw new Error(
    `Expected a string or number at path ${sourcePath} for SQLite extra column.`,
  );
};
