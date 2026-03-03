import { SyncError } from "../errors.js";
import type { SyncChange, SyncChangeApplier } from "../ports.js";

/**
 * Dependencies for a composed change applier routed by `entityType`.
 */
export interface CompositeSyncChangeApplierDependencies {
  appliersByEntityType: Record<string, SyncChangeApplier>;
  failOnUnknownEntityType?: boolean;
}

/**
 * Creates a `SyncChangeApplier` that delegates each change to the matching
 * entity applier while preserving input order.
 */
export const createCompositeSyncChangeApplier = (
  dependencies: CompositeSyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      const applier = dependencies.appliersByEntityType[change.entityType];

      if (!applier) {
        if (dependencies.failOnUnknownEntityType ?? false) {
          throw new SyncError(
            `No SyncChangeApplier registered for entityType '${change.entityType}'.`,
          );
        }

        continue;
      }

      await applier.apply([change]);
    }
  },
});
