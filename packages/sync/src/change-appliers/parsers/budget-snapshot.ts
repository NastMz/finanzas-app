import { createBudget, createMoney, type Budget } from "@finanzas/domain";

import { SyncError } from "../../errors.js";
import type { SyncChange } from "../../ports.js";
import {
  readOptionalDate,
  readRequiredDate,
  readRequiredString,
  readVersion,
} from "../shared/payload-readers.js";

/**
 * Converts a sync change payload into a `Budget` aggregate snapshot.
 */
export const parseBudgetSnapshot = (change: SyncChange): Budget => {
  const payload = change.payload;

  const id = readRequiredString(payload.id, "id", change.changeId);
  const categoryId = readRequiredString(payload.categoryId, "categoryId", change.changeId);
  const period = readRequiredString(payload.period, "period", change.changeId);
  const limitAmountMinor = readAmountMinor(payload.limitAmountMinor, change.changeId);
  const currency = readRequiredString(payload.currency, "currency", change.changeId);
  const createdAt = readRequiredDate(payload.createdAt, "createdAt", change.changeId);
  const updatedAt = readRequiredDate(payload.updatedAt, "updatedAt", change.changeId);
  const deletedAt = readOptionalDate(payload.deletedAt, "deletedAt", change.changeId);

  const normalizedDeletedAt =
    change.opType === "delete" && deletedAt === null ? change.serverTimestamp : deletedAt;

  try {
    const budget = createBudget({
      id,
      categoryId,
      period,
      limit: createMoney(limitAmountMinor, currency),
      createdAt,
      updatedAt,
    });

    return {
      ...budget,
      deletedAt: normalizedDeletedAt,
      version: readVersion(change.serverVersion),
    };
  } catch (error) {
    if (error instanceof SyncError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new SyncError(`Invalid budget snapshot in change ${change.changeId}: ${error.message}`);
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
      throw new SyncError(`Invalid limitAmountMinor in change ${changeId}.`);
    }

    return BigInt(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new SyncError(`Invalid limitAmountMinor in change ${changeId}.`);
};
