import type { Transaction } from "@finanzas/domain";
import type { TransactionRepository } from "@finanzas/application";
import { createMoney } from "@finanzas/domain";

import { SyncError } from "../errors.js";
import type { SyncChange, SyncChangeApplier } from "../ports.js";

export interface TransactionSyncChangeApplierDependencies {
  transactions: TransactionRepository;
}

export const createTransactionSyncChangeApplier = (
  dependencies: TransactionSyncChangeApplierDependencies,
): SyncChangeApplier => ({
  async apply(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.entityType !== "transaction") {
        continue;
      }

      const transaction = parseTransactionSnapshot(change);
      await dependencies.transactions.save(transaction);
    }
  },
});

const parseTransactionSnapshot = (change: SyncChange): Transaction => {
  const payload = change.payload;

  const id = readRequiredString(payload.id, "id", change.changeId);
  const accountId = readRequiredString(payload.accountId, "accountId", change.changeId);
  const amountMinor = readAmountMinor(payload.amountMinor, change.changeId);
  const currency = readRequiredString(payload.currency, "currency", change.changeId);
  const date = readRequiredDate(payload.date, "date", change.changeId);
  const categoryId = readRequiredString(payload.categoryId, "categoryId", change.changeId);
  const createdAt = readRequiredDate(payload.createdAt, "createdAt", change.changeId);
  const updatedAt = readRequiredDate(payload.updatedAt, "updatedAt", change.changeId);
  const note = readNote(payload.note, change.changeId);
  const tags = readTags(payload.tags, change.changeId);
  const deletedAt = readOptionalDate(payload.deletedAt, "deletedAt", change.changeId);

  const normalizedDeletedAt =
    change.opType === "delete" && deletedAt === null ? change.serverTimestamp : deletedAt;

  return {
    id,
    accountId,
    amount: createMoney(amountMinor, currency),
    date,
    categoryId,
    note,
    tags,
    createdAt,
    updatedAt,
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

const readAmountMinor = (value: unknown, changeId: string): bigint => {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new SyncError(`Invalid amountMinor in change ${changeId}.`);
    }

    return BigInt(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new SyncError(`Invalid amountMinor in change ${changeId}.`);
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

const readNote = (value: unknown, changeId: string): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new SyncError(`Invalid note in change ${changeId}.`);
  }

  const normalizedNote = value.trim();
  return normalizedNote.length === 0 ? null : normalizedNote;
};

const readTags = (value: unknown, changeId: string): string[] => {
  if (value === null || value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new SyncError(`Invalid tags in change ${changeId}.`);
  }

  const tags: string[] = [];

  for (const tag of value) {
    if (typeof tag !== "string") {
      throw new SyncError(`Invalid tags in change ${changeId}.`);
    }

    const normalizedTag = tag.trim().toLowerCase();

    if (normalizedTag.length > 0 && !tags.includes(normalizedTag)) {
      tags.push(normalizedTag);
    }
  }

  return tags;
};

const readVersion = (value: string | number | undefined): number | null => {
  return typeof value === "number" ? value : null;
};
