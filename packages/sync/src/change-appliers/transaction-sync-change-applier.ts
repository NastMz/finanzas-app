import type { TransactionRepository } from "@finanzas/application";

import type { SyncChange, SyncChangeApplier } from "../ports.js";
import { parseTransactionSnapshot } from "./parsers/transaction-snapshot.js";

/**
 * Dependencies required to apply transaction snapshots pulled from sync.
 */
export interface TransactionSyncChangeApplierDependencies {
  transactions: TransactionRepository;
}

/**
 * Creates an applier that persists pulled `transaction` changes into local storage.
 */
export const createTransactionSyncChangeApplier = (
  dependencies: TransactionSyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.entityType !== "transaction") {
        continue;
      }

      const transaction = parseTransactionSnapshot(change);
      await dependencies.transactions.save(transaction);
    }
  },
});
