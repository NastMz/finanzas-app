import type { AccountRepository } from "@finanzas/application";
import type { SyncChange, SyncChangeApplier } from "../ports.js";
import { parseAccountSnapshot } from "./parsers/account-snapshot.js";

/**
 * Dependencies required to apply account snapshots pulled from sync.
 */
export interface AccountSyncChangeApplierDependencies {
  accounts: AccountRepository;
}

/**
 * Creates an applier that persists pulled `account` changes into local storage.
 */
export const createAccountSyncChangeApplier = (
  dependencies: AccountSyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.entityType !== "account") {
        continue;
      }

      const account = parseAccountSnapshot(change);
      await dependencies.accounts.save(account);
    }
  },
});
