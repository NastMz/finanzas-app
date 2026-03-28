import { InMemoryTransactionRepository } from "./in-memory-transaction-repository.js";
import { runTransactionWindowRepositoryParitySuite } from "../testing/transaction-window-repository-parity.js";

runTransactionWindowRepositoryParitySuite("InMemoryTransactionRepository", (seed) => ({
  repository: new InMemoryTransactionRepository(seed),
}));
