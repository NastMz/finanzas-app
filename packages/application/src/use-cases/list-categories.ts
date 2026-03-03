import type { Category, CategoryType } from "@finanzas/domain";

import type { CategoryRepository } from "../ports.js";

/**
 * Query parameters for listing local categories.
 */
export interface ListCategoriesInput {
  includeDeleted?: boolean;
  type?: CategoryType;
  limit?: number;
}

/**
 * Runtime dependencies required by `listCategories`.
 */
export interface ListCategoriesDependencies {
  categories: CategoryRepository;
}

/**
 * Result payload returned by `listCategories`.
 */
export interface ListCategoriesResult {
  categories: Category[];
}

/**
 * Lists local categories with optional tombstone and type filters,
 * ordered by category name ascending.
 */
export const listCategories = async (
  dependencies: ListCategoriesDependencies,
  input: ListCategoriesInput = {},
): Promise<ListCategoriesResult> => {
  const categories = await dependencies.categories.listAll();
  const includeDeleted = input.includeDeleted ?? false;

  const filteredByDeletion = includeDeleted
    ? categories
    : categories.filter((category) => category.deletedAt === null);

  const filteredCategories =
    input.type === undefined
      ? filteredByDeletion
      : filteredByDeletion.filter((category) => category.type === input.type);

  const sortedCategories = [...filteredCategories].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  const limit = input.limit ?? null;

  return {
    categories:
      limit === null ? sortedCategories : sortedCategories.slice(0, limit),
  };
};
