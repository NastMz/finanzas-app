import type { AccountRepository } from "@finanzas/application";
import { createAccount, type Account, type AccountType } from "@finanzas/domain";

import { SyncError } from "../errors.js";
import type { SyncChange, SyncChangeApplier } from "../ports.js";

export interface AccountSyncChangeApplierDependencies {
  accounts: AccountRepository;
}

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

const parseAccountSnapshot = (change: SyncChange): Account => {
  const payload = change.payload;

  const id = readRequiredString(payload.id, "id", change.changeId);
  const name = readRequiredString(payload.name, "name", change.changeId);
  const type = readAccountType(payload.type, change.changeId);
  const currency = readRequiredString(payload.currency, "currency", change.changeId);
  const createdAt = readRequiredDate(payload.createdAt, "createdAt", change.changeId);
  const updatedAt = readRequiredDate(payload.updatedAt, "updatedAt", change.changeId);
  const deletedAt = readOptionalDate(payload.deletedAt, "deletedAt", change.changeId);

  const normalizedDeletedAt =
    change.opType === "delete" && deletedAt === null ? change.serverTimestamp : deletedAt;

  const account = createAccount({
    id,
    name,
    type,
    currency,
    createdAt,
    updatedAt,
  });

  return {
    ...account,
    deletedAt: normalizedDeletedAt,
    version: readVersion(change.serverVersion),
  };
};

const readRequiredString = (
  value: unknown,
  fieldName: string,
  changeId: string,
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SyncError(`Invalid ${fieldName} in change ${changeId}.`);
  }

  return value;
};

const readAccountType = (value: unknown, changeId: string): AccountType => {
  if (value === "cash" || value === "bank" || value === "credit") {
    return value;
  }

  throw new SyncError(`Invalid account type in change ${changeId}.`);
};

const readRequiredDate = (
  value: unknown,
  fieldName: string,
  changeId: string,
): Date => {
  if (value instanceof Date) {
    return new Date(value);
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  throw new SyncError(`Invalid ${fieldName} in change ${changeId}.`);
};

const readOptionalDate = (
  value: unknown,
  fieldName: string,
  changeId: string,
): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return readRequiredDate(value, fieldName, changeId);
};

const readVersion = (value: string | number | undefined): number | null => {
  return typeof value === "number" ? value : null;
};
