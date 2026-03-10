import type { RecurringRule } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type { RecurringRuleRepository } from "../ports.js";

/**
 * Query parameters for listing local recurring rules.
 */
export interface ListRecurringRulesInput {
  includeDeleted?: boolean;
  templateId?: string;
  isActive?: boolean;
  limit?: number;
}

/**
 * Runtime dependencies required by `listRecurringRules`.
 */
export interface ListRecurringRulesDependencies {
  recurringRules: RecurringRuleRepository;
}

/**
 * Result payload returned by `listRecurringRules`.
 */
export interface ListRecurringRulesResult {
  recurringRules: RecurringRule[];
}

/**
 * Lists local recurring rules with optional tombstone, template and active filters,
 * ordered by next run ascending.
 */
export const listRecurringRules = async (
  dependencies: ListRecurringRulesDependencies,
  input: ListRecurringRulesInput = {},
): Promise<ListRecurringRulesResult> => {
  const recurringRules = await dependencies.recurringRules.listAll();
  const includeDeleted = input.includeDeleted ?? false;
  const templateId = normalizeOptionalFilter(
    input.templateId,
    "Recurring rule template filter cannot be empty.",
  );

  const filteredByDeletion = includeDeleted
    ? recurringRules
    : recurringRules.filter((rule) => rule.deletedAt === null);

  const filteredByTemplate =
    templateId === null
      ? filteredByDeletion
      : filteredByDeletion.filter((rule) => rule.templateId === templateId);

  const filteredRules =
    input.isActive === undefined
      ? filteredByTemplate
      : filteredByTemplate.filter((rule) => rule.isActive === input.isActive);

  const sortedRules = [...filteredRules].sort((left, right) => {
    const nextRunDiff = left.nextRunOn.getTime() - right.nextRunOn.getTime();

    if (nextRunDiff !== 0) {
      return nextRunDiff;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });

  const limit = input.limit ?? null;

  return {
    recurringRules: limit === null ? sortedRules : sortedRules.slice(0, limit),
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
