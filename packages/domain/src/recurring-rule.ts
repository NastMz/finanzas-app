import { DomainError } from "./errors.js";

/**
 * Supported recurrence frequencies.
 */
export type RecurringFrequency = "weekly" | "monthly";

/**
 * Weekly recurrence schedule.
 */
export interface WeeklyRecurringRuleSchedule {
  frequency: "weekly";
  interval: number;
  dayOfWeek: number;
}

/**
 * Monthly recurrence schedule.
 */
export interface MonthlyRecurringRuleSchedule {
  frequency: "monthly";
  interval: number;
  dayOfMonth: number;
}

/**
 * Supported recurrence schedule shapes.
 */
export type RecurringRuleSchedule =
  | WeeklyRecurringRuleSchedule
  | MonthlyRecurringRuleSchedule;

/**
 * Recurring rule aggregate root.
 */
export interface RecurringRule {
  id: string;
  templateId: string;
  schedule: RecurringRuleSchedule;
  startsOn: Date;
  nextRunOn: Date;
  lastGeneratedOn: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

/**
 * Input required to create a valid `RecurringRule`.
 */
export interface CreateRecurringRuleInput {
  id: string;
  templateId: string;
  schedule: RecurringRuleSchedule;
  startsOn: Date;
  nextRunOn?: Date;
  lastGeneratedOn?: Date | null;
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Creates a validated `RecurringRule` aggregate.
 */
export const createRecurringRule = (
  input: CreateRecurringRuleInput,
): RecurringRule => {
  if (input.id.trim().length === 0) {
    throw new DomainError("Recurring rule id is required.");
  }

  if (input.templateId.trim().length === 0) {
    throw new DomainError("Recurring rule template id is required.");
  }

  const schedule = normalizeRecurringRuleSchedule(input.schedule);
  const startsOn = normalizeRecurringDate(input.startsOn);
  const lastGeneratedOn =
    input.lastGeneratedOn === undefined || input.lastGeneratedOn === null
      ? null
      : normalizeRecurringDate(input.lastGeneratedOn);
  const expectedNextRunOn = findRecurringRuleOccurrenceOnOrAfter(
    schedule,
    startsOn,
    lastGeneratedOn === null ? startsOn : addUtcDays(lastGeneratedOn, 1),
  );
  const nextRunOn =
    input.nextRunOn === undefined
      ? expectedNextRunOn
      : normalizeRecurringDate(input.nextRunOn);
  const updatedAt = input.updatedAt ?? input.createdAt;

  if (updatedAt < input.createdAt) {
    throw new DomainError("Recurring rule updatedAt cannot be before createdAt.");
  }

  if (lastGeneratedOn !== null && nextRunOn <= lastGeneratedOn) {
    throw new DomainError(
      "Recurring rule nextRunOn must be after lastGeneratedOn when present.",
    );
  }

  if (!isSameUtcDate(nextRunOn, expectedNextRunOn)) {
    throw new DomainError(
      "Recurring rule nextRunOn must match the configured schedule.",
    );
  }

  return {
    id: input.id,
    templateId: input.templateId.trim(),
    schedule,
    startsOn,
    nextRunOn,
    lastGeneratedOn,
    isActive: input.isActive ?? true,
    createdAt: input.createdAt,
    updatedAt,
    deletedAt: null,
    version: null,
  };
};

/**
 * Returns the next occurrence strictly after the provided occurrence.
 */
export const calculateNextRecurringRuleRun = (
  schedule: RecurringRuleSchedule,
  occurrence: Date,
): Date => {
  const normalizedOccurrence = normalizeRecurringDate(occurrence);
  const normalizedSchedule = normalizeRecurringRuleSchedule(schedule);

  if (normalizedSchedule.frequency === "weekly") {
    return addUtcDays(
      normalizedOccurrence,
      normalizedSchedule.interval * 7,
    );
  }

  return createUtcDate(
    normalizedOccurrence.getUTCFullYear(),
    normalizedOccurrence.getUTCMonth() + normalizedSchedule.interval,
    normalizedSchedule.dayOfMonth,
  );
};

/**
 * Finds the first occurrence on or after the target date.
 */
export const findRecurringRuleOccurrenceOnOrAfter = (
  schedule: RecurringRuleSchedule,
  startsOn: Date,
  targetDate: Date,
): Date => {
  const normalizedSchedule = normalizeRecurringRuleSchedule(schedule);
  const normalizedStartsOn = normalizeRecurringDate(startsOn);
  const normalizedTargetDate = normalizeRecurringDate(targetDate);
  let occurrence = getFirstRecurringRuleOccurrence(
    normalizedSchedule,
    normalizedStartsOn,
  );

  while (occurrence < normalizedTargetDate) {
    occurrence = calculateNextRecurringRuleRun(normalizedSchedule, occurrence);
  }

  return occurrence;
};

const getFirstRecurringRuleOccurrence = (
  schedule: RecurringRuleSchedule,
  startsOn: Date,
): Date => {
  if (schedule.frequency === "weekly") {
    let occurrence = normalizeRecurringDate(startsOn);

    while (occurrence.getUTCDay() !== schedule.dayOfWeek) {
      occurrence = addUtcDays(occurrence, 1);
    }

    return occurrence;
  }

  const year = startsOn.getUTCFullYear();
  const month = startsOn.getUTCMonth();
  const startsDay = startsOn.getUTCDate();

  return startsDay <= schedule.dayOfMonth
    ? createUtcDate(year, month, schedule.dayOfMonth)
    : createUtcDate(year, month + 1, schedule.dayOfMonth);
};

const normalizeRecurringRuleSchedule = (
  schedule: RecurringRuleSchedule,
): RecurringRuleSchedule => {
  if (!Number.isInteger(schedule.interval) || schedule.interval <= 0) {
    throw new DomainError("Recurring rule interval must be a positive integer.");
  }

  if (schedule.frequency === "weekly") {
    if (
      !Number.isInteger(schedule.dayOfWeek) ||
      schedule.dayOfWeek < 0 ||
      schedule.dayOfWeek > 6
    ) {
      throw new DomainError(
        "Recurring rule dayOfWeek must be an integer between 0 and 6.",
      );
    }

    return {
      frequency: "weekly",
      interval: schedule.interval,
      dayOfWeek: schedule.dayOfWeek,
    };
  }

  if (
    !Number.isInteger(schedule.dayOfMonth) ||
    schedule.dayOfMonth < 1 ||
    schedule.dayOfMonth > 28
  ) {
    throw new DomainError(
      "Recurring rule dayOfMonth must be an integer between 1 and 28.",
    );
  }

  return {
    frequency: "monthly",
    interval: schedule.interval,
    dayOfMonth: schedule.dayOfMonth,
  };
};

const normalizeRecurringDate = (date: Date): Date =>
  createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const createUtcDate = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month, day));

const addUtcDays = (date: Date, days: number): Date =>
  createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days);

const isSameUtcDate = (left: Date, right: Date): boolean =>
  left.getUTCFullYear() === right.getUTCFullYear() &&
  left.getUTCMonth() === right.getUTCMonth() &&
  left.getUTCDate() === right.getUTCDate();
