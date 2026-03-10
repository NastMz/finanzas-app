import type { TransactionTemplateRepository } from "@finanzas/application";

import type { SyncChange, SyncChangeApplier } from "../ports.js";
import { parseTransactionTemplateSnapshot } from "./parsers/transaction-template-snapshot.js";

/**
 * Dependencies required to apply transaction template snapshots pulled from sync.
 */
export interface TransactionTemplateSyncChangeApplierDependencies {
  templates: TransactionTemplateRepository;
}

/**
 * Creates an applier that persists pulled `transaction-template` changes into local storage.
 */
export const createTransactionTemplateSyncChangeApplier = (
  dependencies: TransactionTemplateSyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.entityType !== "transaction-template") {
        continue;
      }

      const template = parseTransactionTemplateSnapshot(change);
      await dependencies.templates.save(template);
    }
  },
});
