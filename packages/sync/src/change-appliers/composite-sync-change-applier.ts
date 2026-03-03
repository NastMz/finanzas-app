import { SyncError } from "../errors.js";
import type { SyncChange, SyncChangeApplier } from "../ports.js";

export interface CompositeSyncChangeApplierDependencies {
  appliersByEntityType: Record<string, SyncChangeApplier>;
  failOnUnknownEntityType?: boolean;
}

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
