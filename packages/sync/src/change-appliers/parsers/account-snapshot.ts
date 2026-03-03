import { createAccount, type Account, type AccountType } from "@finanzas/domain";

import { SyncError } from "../../errors.js";
import type { SyncChange } from "../../ports.js";
import {
  readOptionalDate,
  readRequiredDate,
  readRequiredString,
  readVersion,
} from "../shared/payload-readers.js";

/**
 * Converts a sync change payload into an `Account` aggregate snapshot.
 */
export const parseAccountSnapshot = (change: SyncChange): Account => {
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

const readAccountType = (value: unknown, changeId: string): AccountType => {
  if (value === "cash" || value === "bank" || value === "credit") {
    return value;
  }

  throw new SyncError(`Invalid account type in change ${changeId}.`);
};
