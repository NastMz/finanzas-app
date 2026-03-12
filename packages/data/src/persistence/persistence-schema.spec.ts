import { describe, expect, it } from "vitest";

import {
  PERSISTENCE_COLLECTION_DEFINITIONS,
  PERSISTENCE_COLLECTION_IDS,
  PERSISTENCE_COLLECTION_ORDER,
  PERSISTENCE_INDEX_IDS,
  PERSISTENCE_MIGRATIONS,
  PERSISTENCE_SCHEMA_VERSION,
  getIndexedDbIndexName,
  getIndexedDbStoreName,
  getSqliteIndexColumnName,
  getSqliteIndexName,
  getSqliteTableName,
} from "@finanzas/data";

describe("persistence schema manifest", () => {
  it("keeps the schema version aligned with the latest migration", () => {
    expect(PERSISTENCE_MIGRATIONS.at(-1)?.version).toBe(PERSISTENCE_SCHEMA_VERSION);
  });

  it("defines a unique physical projection for every logical collection", () => {
    expect(Object.keys(PERSISTENCE_COLLECTION_DEFINITIONS).sort()).toEqual(
      [...PERSISTENCE_COLLECTION_ORDER].sort(),
    );

    const indexedDbStoreNames = PERSISTENCE_COLLECTION_ORDER.map((collectionId) =>
      getIndexedDbStoreName(collectionId),
    );
    const sqliteTableNames = PERSISTENCE_COLLECTION_ORDER.map((collectionId) =>
      getSqliteTableName(collectionId),
    );

    expect(new Set(indexedDbStoreNames).size).toBe(indexedDbStoreNames.length);
    expect(new Set(sqliteTableNames).size).toBe(sqliteTableNames.length);
  });

  it("defines the transaction account index once for both adapters", () => {
    expect(
      getIndexedDbIndexName(
        PERSISTENCE_COLLECTION_IDS.transactions,
        PERSISTENCE_INDEX_IDS.byAccountId,
      ),
    ).toBe("by-account-id");
    expect(
      getSqliteIndexName(
        PERSISTENCE_COLLECTION_IDS.transactions,
        PERSISTENCE_INDEX_IDS.byAccountId,
      ),
    ).toBe("transactions_by_account_id");
    expect(
      getSqliteIndexColumnName(
        PERSISTENCE_COLLECTION_IDS.transactions,
        PERSISTENCE_INDEX_IDS.byAccountId,
      ),
    ).toBe("account_id");
  });
});
