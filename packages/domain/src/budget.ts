import { DomainError } from "./errors.js";
import { type Money } from "./money.js";

const BUDGET_PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Budget aggregate root.
 */
export interface Budget {
  id: string;
  categoryId: string;
  period: string;
  limit: Money;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

/**
 * Input required to create a valid `Budget`.
 */
export interface CreateBudgetInput {
  id: string;
  categoryId: string;
  period: string;
  limit: Money;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Creates a validated `Budget` aggregate.
 */
export const createBudget = (input: CreateBudgetInput): Budget => {
  if (input.id.trim().length === 0) {
    throw new DomainError("Budget id is required.");
  }

  if (input.categoryId.trim().length === 0) {
    throw new DomainError("Budget category id is required.");
  }

  if (input.limit.amountMinor <= 0n) {
    throw new DomainError("Budget limit must be greater than zero.");
  }

  const updatedAt = input.updatedAt ?? input.createdAt;

  if (updatedAt < input.createdAt) {
    throw new DomainError("Budget updatedAt cannot be before createdAt.");
  }

  return {
    id: input.id,
    categoryId: input.categoryId.trim(),
    period: normalizeBudgetPeriod(input.period),
    limit: input.limit,
    createdAt: input.createdAt,
    updatedAt,
    deletedAt: null,
    version: null,
  };
};

const normalizeBudgetPeriod = (period: string): string => {
  const normalizedPeriod = period.trim();

  if (!BUDGET_PERIOD_REGEX.test(normalizedPeriod)) {
    throw new DomainError("Budget period must follow YYYY-MM format.");
  }

  return normalizedPeriod;
};
