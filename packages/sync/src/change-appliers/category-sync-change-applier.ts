import type { CategoryRepository } from "@finanzas/application";
import type { SyncChange, SyncChangeApplier } from "../ports.js";
import { parseCategorySnapshot } from "./parsers/category-snapshot.js";

/**
 * Dependencies required to apply category snapshots pulled from sync.
 */
export interface CategorySyncChangeApplierDependencies {
  categories: CategoryRepository;
}

/**
 * Creates an applier that persists pulled `category` changes into local storage.
 */
export const createCategorySyncChangeApplier = (
  dependencies: CategorySyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.entityType !== "category") {
        continue;
      }

      const category = parseCategorySnapshot(change);
      await dependencies.categories.save(category);
    }
  },
});
