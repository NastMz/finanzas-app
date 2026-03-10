import type { Budget } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type { BudgetRepository } from "../ports.js";

/**
 * Query parameters for listing local budgets.
 */
export interface ListBudgetsInput {
  includeDeleted?: boolean;
  categoryId?: string;
  period?: string;
  limit?: number;
}

/**
 * Runtime dependencies required by `listBudgets`.
 */
export interface ListBudgetsDependencies {
  budgets: BudgetRepository;
}

/**
 * Result payload returned by `listBudgets`.
 */
export interface ListBudgetsResult {
  budgets: Budget[];
}

/**
 * Lists local budgets with optional tombstone, category and period filters,
 * ordered by period descending and category id ascending.
 */
export const listBudgets = async (
  dependencies: ListBudgetsDependencies,
  input: ListBudgetsInput = {},
): Promise<ListBudgetsResult> => {
  const budgets = await dependencies.budgets.listAll();
  const includeDeleted = input.includeDeleted ?? false;
  const categoryId = normalizeOptionalFilter(
    input.categoryId,
    "Budget category filter cannot be empty.",
  );
  const period = normalizeOptionalFilter(
    input.period,
    "Budget period filter cannot be empty.",
  );

  const filteredByDeletion = includeDeleted
    ? budgets
    : budgets.filter((budget) => budget.deletedAt === null);

  const filteredByCategory =
    categoryId === null
      ? filteredByDeletion
      : filteredByDeletion.filter((budget) => budget.categoryId === categoryId);

  const filteredBudgets =
    period === null
      ? filteredByCategory
      : filteredByCategory.filter((budget) => budget.period === period);

  const sortedBudgets = [...filteredBudgets].sort((left, right) => {
    const periodDiff = right.period.localeCompare(left.period);

    if (periodDiff !== 0) {
      return periodDiff;
    }

    const categoryDiff = left.categoryId.localeCompare(right.categoryId);

    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });

  const limit = input.limit ?? null;

  return {
    budgets: limit === null ? sortedBudgets : sortedBudgets.slice(0, limit),
  };
};

const normalizeOptionalFilter = (
  value: string | undefined,
  errorMessage: string,
): string | null => {
  if (value === undefined) {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new ApplicationError(errorMessage);
  }

  return normalizedValue;
};
