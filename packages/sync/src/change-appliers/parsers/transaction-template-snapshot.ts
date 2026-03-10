import {
  createMoney,
  createTransactionTemplate,
  type TransactionTemplate,
} from "@finanzas/domain";

import { SyncError } from "../../errors.js";
import type { SyncChange } from "../../ports.js";
import {
  readOptionalDate,
  readRequiredDate,
  readRequiredString,
  readVersion,
} from "../shared/payload-readers.js";

/**
 * Converts a sync change payload into a `TransactionTemplate` aggregate snapshot.
 */
export const parseTransactionTemplateSnapshot = (
  change: SyncChange,
): TransactionTemplate => {
  const payload = change.payload;

  const id = readRequiredString(payload.id, "id", change.changeId);
  const name = readRequiredString(payload.name, "name", change.changeId);
  const accountId = readRequiredString(payload.accountId, "accountId", change.changeId);
  const amountMinor = readAmountMinor(payload.amountMinor, change.changeId);
  const currency = readRequiredString(payload.currency, "currency", change.changeId);
  const categoryId = readRequiredString(payload.categoryId, "categoryId", change.changeId);
  const createdAt = readRequiredDate(payload.createdAt, "createdAt", change.changeId);
  const updatedAt = readRequiredDate(payload.updatedAt, "updatedAt", change.changeId);
  const note = readNote(payload.note, change.changeId);
  const tags = readTags(payload.tags, change.changeId);
  const deletedAt = readOptionalDate(payload.deletedAt, "deletedAt", change.changeId);

  const normalizedDeletedAt =
    change.opType === "delete" && deletedAt === null ? change.serverTimestamp : deletedAt;

  try {
    const template = createTransactionTemplate(
      {
        id,
        name,
        accountId,
        amount: createMoney(amountMinor, currency),
        categoryId,
        ...(note !== null ? { note } : {}),
        tags,
        createdAt,
        updatedAt,
      },
      {
        id: accountId,
        name: "sync-account",
        type: "bank",
        currency,
        createdAt,
        updatedAt,
        deletedAt: null,
        version: null,
      },
    );

    return {
      ...template,
      deletedAt: normalizedDeletedAt,
      version: readVersion(change.serverVersion),
    };
  } catch (error) {
    if (error instanceof SyncError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new SyncError(
        `Invalid transaction template snapshot in change ${change.changeId}: ${error.message}`,
      );
    }

    throw error;
  }
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
