import { DomainError } from "./errors.js";

/**
 * Supported category directions.
 */
export type CategoryType = "income" | "expense";

/**
 * Category aggregate root.
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

/**
 * Input required to create a valid `Category`.
 */
export interface CreateCategoryInput {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Creates a validated `Category` aggregate.
 */
export const createCategory = (input: CreateCategoryInput): Category => {
  if (input.id.trim().length === 0) {
    throw new DomainError("Category id is required.");
  }

  if (input.name.trim().length === 0) {
    throw new DomainError("Category name is required.");
  }

  const updatedAt = input.updatedAt ?? input.createdAt;

  if (updatedAt < input.createdAt) {
    throw new DomainError("Category updatedAt cannot be before createdAt.");
  }

  return {
    id: input.id,
    name: input.name.trim(),
    type: input.type,
    createdAt: input.createdAt,
    updatedAt,
    deletedAt: null,
    version: null,
  };
};
