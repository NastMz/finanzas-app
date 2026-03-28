import { IDBKeyRange, indexedDB as fakeIndexedDb } from "fake-indexeddb";

import { openFinanzasIndexedDb } from "./finanzas-indexed-db.js";
import { IndexedDbTransactionRepository } from "./indexeddb-core-repositories.js";
import { runTransactionWindowRepositoryParitySuite } from "../testing/transaction-window-repository-parity.js";

runTransactionWindowRepositoryParitySuite("IndexedDbTransactionRepository", async (seed) => {
  globalThis.IDBKeyRange = IDBKeyRange;

  const connection = openFinanzasIndexedDb({
    indexedDb: fakeIndexedDb,
    databaseName: `finanzas-indexeddb-window-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  });
  const repository = new IndexedDbTransactionRepository(connection);

  await repository.replaceAll(seed);

  return {
    repository,
    dispose: async () => {
      const database = await connection;
      database.close();
    },
  };
});
