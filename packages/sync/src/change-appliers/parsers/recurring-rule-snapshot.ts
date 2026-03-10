import {
  createRecurringRule,
  type RecurringRule,
  type RecurringRuleSchedule,
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
 * Converts a sync change payload into a `RecurringRule` aggregate snapshot.
 */
export const parseRecurringRuleSnapshot = (change: SyncChange): RecurringRule => {
  const payload = change.payload;

  const id = readRequiredString(payload.id, "id", change.changeId);
  const templateId = readRequiredString(payload.templateId, "templateId", change.changeId);
  const schedule = readSchedule(payload.schedule, change.changeId);
  const startsOn = readRequiredDate(payload.startsOn, "startsOn", change.changeId);
  const nextRunOn = readRequiredDate(payload.nextRunOn, "nextRunOn", change.changeId);
  const lastGeneratedOn = readOptionalDate(
    payload.lastGeneratedOn,
    "lastGeneratedOn",
    change.changeId,
  );
  const isActive = readBoolean(payload.isActive, "isActive", change.changeId);
  const createdAt = readRequiredDate(payload.createdAt, "createdAt", change.changeId);
  const updatedAt = readRequiredDate(payload.updatedAt, "updatedAt", change.changeId);
  const deletedAt = readOptionalDate(payload.deletedAt, "deletedAt", change.changeId);

  const normalizedDeletedAt =
    change.opType === "delete" && deletedAt === null ? change.serverTimestamp : deletedAt;

  try {
    const recurringRule = createRecurringRule({
      id,
      templateId,
      schedule,
      startsOn,
      nextRunOn,
      lastGeneratedOn,
      isActive,
      createdAt,
      updatedAt,
    });

    return {
      ...recurringRule,
      deletedAt: normalizedDeletedAt,
      version: readVersion(change.serverVersion),
    };
  } catch (error) {
    if (error instanceof SyncError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new SyncError(
        `Invalid recurring rule snapshot in change ${change.changeId}: ${error.message}`,
      );
    }

    throw error;
  }
};

const readSchedule = (value: unknown, changeId: string): RecurringRuleSchedule => {
  if (!value || typeof value !== "object") {
    throw new SyncError(`Invalid schedule in change ${changeId}.`);
  }

  const schedule = value as Record<string, unknown>;

  if (schedule.frequency === "weekly") {
    return {
      frequency: "weekly",
      interval: readInteger(schedule.interval, "interval", changeId),
      dayOfWeek: readInteger(schedule.dayOfWeek, "dayOfWeek", changeId),
    };
  }

  if (schedule.frequency === "monthly") {
    return {
      frequency: "monthly",
      interval: readInteger(schedule.interval, "interval", changeId),
      dayOfMonth: readInteger(schedule.dayOfMonth, "dayOfMonth", changeId),
    };
  }

  throw new SyncError(`Invalid schedule in change ${changeId}.`);
};

const readInteger = (value: unknown, fieldName: string, changeId: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new SyncError(`Invalid ${fieldName} in change ${changeId}.`);
  }

  return value;
};

const readBoolean = (value: unknown, fieldName: string, changeId: string): boolean => {
  if (typeof value !== "boolean") {
    throw new SyncError(`Invalid ${fieldName} in change ${changeId}.`);
  }

  return value;
};
