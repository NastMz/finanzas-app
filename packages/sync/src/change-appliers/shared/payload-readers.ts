import { SyncError } from "../../errors.js";

/**
 * Reads a required string field from a sync payload.
 * Throws a `SyncError` when the value is empty or not a string.
 */
export const readRequiredString = (
  value: unknown,
  fieldName: string,
  changeId: string,
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SyncError(`Invalid ${fieldName} in change ${changeId}.`);
  }

  return value;
};

/**
 * Reads a required date field from a sync payload.
 * Accepts `Date` or ISO date string values.
 */
export const readRequiredDate = (
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

/**
 * Reads an optional date field from a sync payload.
 * Returns `null` when the value is `null` or `undefined`.
 */
export const readOptionalDate = (
  value: unknown,
  fieldName: string,
  changeId: string,
): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return readRequiredDate(value, fieldName, changeId);
};

/**
 * Converts an optional server version to the local numeric version shape.
 */
export const readVersion = (value: string | number | undefined): number | null => {
  return typeof value === "number" ? value : null;
};
