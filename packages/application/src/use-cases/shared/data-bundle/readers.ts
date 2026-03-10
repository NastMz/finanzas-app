import type {
  AccountType,
  CategoryType,
  RecurringRuleSchedule,
} from "@finanzas/domain";

import { ApplicationError } from "../../../errors.js";

export const readRecord = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value as Record<string, unknown>;
};

export const readArray = (value: unknown, fieldName: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

export const readString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

export const readNullableString = (
  value: unknown,
  fieldName: string,
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

export const readDate = (value: unknown, fieldName: string): Date => {
  const date =
    value instanceof Date
      ? new Date(value)
      : typeof value === "string"
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return date;
};

export const readNullableDate = (
  value: unknown,
  fieldName: string,
): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return readDate(value, fieldName);
};

export const readVersion = (value: unknown, fieldName: string): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

export const readInteger = (value: unknown, fieldName: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

export const readBigInt = (value: unknown, fieldName: string): bigint => {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" && Number.isInteger(value)) {
    return BigInt(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new ApplicationError(`Invalid ${fieldName}.`);
};

export const readBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== "boolean") {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

export const readStringArray = (value: unknown, fieldName: string): string[] => {
  if (!Array.isArray(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value.map((item, index) => readString(item, `${fieldName}[${index}]`));
};

export const readAccountType = (value: unknown, fieldName: string): AccountType => {
  if (value === "cash" || value === "bank" || value === "credit") {
    return value;
  }

  throw new ApplicationError(`Invalid ${fieldName}.`);
};

export const readCategoryType = (
  value: unknown,
  fieldName: string,
): CategoryType => {
  if (value === "income" || value === "expense") {
    return value;
  }

  throw new ApplicationError(`Invalid ${fieldName}.`);
};

export const readRecurringRuleSchedule = (
  value: unknown,
  fieldName: string,
): RecurringRuleSchedule => {
  const record = readRecord(value, fieldName);
  const frequency = readString(record.frequency, `${fieldName}.frequency`);
  const interval = readInteger(record.interval, `${fieldName}.interval`);

  if (frequency === "weekly") {
    return {
      frequency: "weekly",
      interval,
      dayOfWeek: readInteger(record.dayOfWeek, `${fieldName}.dayOfWeek`),
    };
  }

  if (frequency === "monthly") {
    return {
      frequency: "monthly",
      interval,
      dayOfMonth: readInteger(record.dayOfMonth, `${fieldName}.dayOfMonth`),
    };
  }

  throw new ApplicationError(`Invalid ${fieldName}.frequency.`);
};
