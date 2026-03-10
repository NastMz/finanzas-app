import type { BudgetRepository } from "@finanzas/application";

import type { SyncChange, SyncChangeApplier } from "../ports.js";
import { parseBudgetSnapshot } from "./parsers/budget-snapshot.js";

/**
 * Dependencies required to apply budget snapshots pulled from sync.
 */
export interface BudgetSyncChangeApplierDependencies {
  budgets: BudgetRepository;
}

/**
 * Creates an applier that persists pulled `budget` changes into local storage.
 */
export const createBudgetSyncChangeApplier = (
  dependencies: BudgetSyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.entityType !== "budget") {
        continue;
      }

      const budget = parseBudgetSnapshot(change);
      await dependencies.budgets.save(budget);
    }
  },
});
