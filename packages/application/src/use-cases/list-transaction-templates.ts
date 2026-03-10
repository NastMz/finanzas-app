import type { TransactionTemplate } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type { TransactionTemplateRepository } from "../ports.js";

/**
 * Query parameters for listing local transaction templates.
 */
export interface ListTransactionTemplatesInput {
  includeDeleted?: boolean;
  accountId?: string;
  limit?: number;
}

/**
 * Runtime dependencies required by `listTransactionTemplates`.
 */
export interface ListTransactionTemplatesDependencies {
  templates: TransactionTemplateRepository;
}

/**
 * Result payload returned by `listTransactionTemplates`.
 */
export interface ListTransactionTemplatesResult {
  templates: TransactionTemplate[];
}

/**
 * Lists local transaction templates with optional tombstone and account filters,
 * ordered by template name ascending.
 */
export const listTransactionTemplates = async (
  dependencies: ListTransactionTemplatesDependencies,
  input: ListTransactionTemplatesInput = {},
): Promise<ListTransactionTemplatesResult> => {
  const templates = await dependencies.templates.listAll();
  const includeDeleted = input.includeDeleted ?? false;
  const accountId = normalizeOptionalFilter(
    input.accountId,
    "Template account filter cannot be empty.",
  );

  const filteredByDeletion = includeDeleted
    ? templates
    : templates.filter((template) => template.deletedAt === null);

  const filteredTemplates =
    accountId === null
      ? filteredByDeletion
      : filteredByDeletion.filter((template) => template.accountId === accountId);

  const sortedTemplates = [...filteredTemplates].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  const limit = input.limit ?? null;

  return {
    templates: limit === null ? sortedTemplates : sortedTemplates.slice(0, limit),
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
