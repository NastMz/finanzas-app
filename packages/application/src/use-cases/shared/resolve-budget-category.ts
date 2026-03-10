import type { Category } from "@finanzas/domain";

import { ApplicationError } from "../../errors.js";
import type { CategoryRepository } from "../../ports.js";

/**
 * Loads and validates the category referenced by a budget operation.
 */
export const resolveBudgetCategory = async (
  categories: CategoryRepository,
  categoryId: string,
): Promise<Category> => {
  const normalizedCategoryId = categoryId.trim();

  if (normalizedCategoryId.length === 0) {
    throw new ApplicationError("Category id is required.");
  }

  const category = await categories.findById(normalizedCategoryId);

  if (!category) {
    throw new ApplicationError(`Category ${normalizedCategoryId} does not exist.`);
  }

  if (category.deletedAt) {
    throw new ApplicationError(`Category ${normalizedCategoryId} is already deleted.`);
  }

  if (category.type !== "expense") {
    throw new ApplicationError(
      `Category ${normalizedCategoryId} must be an active expense category.`,
    );
  }

  return category;
};
