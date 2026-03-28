import { openFinanzasSqlite } from "./finanzas-sqlite.js";
import { SqliteTransactionRepository } from "./sqlite-core-repositories.js";
import { runTransactionWindowRepositoryParitySuite } from "../testing/transaction-window-repository-parity.js";

runTransactionWindowRepositoryParitySuite("SqliteTransactionRepository", async (seed) => {
  const database = openFinanzasSqlite({
    databasePath: ":memory:",
  });
  const repository = new SqliteTransactionRepository(database);

  await repository.replaceAll(seed);

  return {
    repository,
    dispose: () => {
      database.close();
    },
  };
});
