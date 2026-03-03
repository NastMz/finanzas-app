import type { CategoryRepository } from "@finanzas/application";
import { createCategory, type Category, type CategoryType } from "@finanzas/domain";

import { SyncError } from "../errors.js";
import type { SyncChange, SyncChangeApplier } from "../ports.js";

export interface CategorySyncChangeApplierDependencies {
  categories: CategoryRepository;
}

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

const parseCategorySnapshot = (change: SyncChange): Category => {
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

const readCategoryType = (value: unknown, changeId: string): CategoryType => {
  if (value === "income" || value === "expense") {
    return value;
  }

  throw new SyncError(`Invalid category type in change ${changeId}.`);
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
