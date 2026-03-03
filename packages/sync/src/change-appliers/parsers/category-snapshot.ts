import { createCategory, type Category, type CategoryType } from "@finanzas/domain";

import { SyncError } from "../../errors.js";
import type { SyncChange } from "../../ports.js";
import {
  readOptionalDate,
  readRequiredDate,
  readRequiredString,
  readVersion,
} from "../shared/payload-readers.js";

/**
 * Converts a sync change payload into a `Category` aggregate snapshot.
 */
export const parseCategorySnapshot = (change: SyncChange): Category => {
  const payload = change.payload;

  const id = readRequiredString(payload.id, "id", change.changeId);
  const name = readRequiredString(payload.name, "name", change.changeId);
  const type = readCategoryType(payload.type, change.changeId);
  const createdAt = readRequiredDate(payload.createdAt, "createdAt", change.changeId);
  const updatedAt = readRequiredDate(payload.updatedAt, "updatedAt", change.changeId);
  const deletedAt = readOptionalDate(payload.deletedAt, "deletedAt", change.changeId);

  const normalizedDeletedAt =
    change.opType === "delete" && deletedAt === null ? change.serverTimestamp : deletedAt;

  const category = createCategory({
    id,
    name,
    type,
    createdAt,
    updatedAt,
  });

  return {
    ...category,
    deletedAt: normalizedDeletedAt,
    version: readVersion(change.serverVersion),
  };
};

const readCategoryType = (value: unknown, changeId: string): CategoryType => {
  if (value === "income" || value === "expense") {
    return value;
  }

  throw new SyncError(`Invalid category type in change ${changeId}.`);
};

