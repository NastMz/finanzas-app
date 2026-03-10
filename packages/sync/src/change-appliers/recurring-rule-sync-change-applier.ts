import type { RecurringRuleRepository } from "@finanzas/application";

import type { SyncChange, SyncChangeApplier } from "../ports.js";
import { parseRecurringRuleSnapshot } from "./parsers/recurring-rule-snapshot.js";

/**
 * Dependencies required to apply recurring rule snapshots pulled from sync.
 */
export interface RecurringRuleSyncChangeApplierDependencies {
  recurringRules: RecurringRuleRepository;
}

/**
 * Creates an applier that persists pulled `recurring-rule` changes into local storage.
 */
export const createRecurringRuleSyncChangeApplier = (
  dependencies: RecurringRuleSyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.entityType !== "recurring-rule") {
        continue;
      }

      const recurringRule = parseRecurringRuleSnapshot(change);
      await dependencies.recurringRules.save(recurringRule);
    }
  },
});
