import { createCategory, type Category, type CategoryType } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  CategoryRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
} from "../ports.js";
import { toCategoryOutboxPayload } from "./shared/category-outbox-payload.js";

/**
 * Input required to update a category and enqueue its sync operation.
 */
export interface UpdateCategoryInput {
  categoryId: string;
  name?: string;
  type?: CategoryType;
}

/**
 * Runtime dependencies required by `updateCategory`.
 */
export interface UpdateCategoryDependencies {
  categories: CategoryRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `updateCategory` execution.
 */
export interface UpdateCategoryResult {
  category: Category;
  outboxOpId: string;
}

/**
 * Updates a local category and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const updateCategory = async (
  dependencies: UpdateCategoryDependencies,
  input: UpdateCategoryInput,
): Promise<UpdateCategoryResult> => {
  const category = await dependencies.categories.findById(input.categoryId);

  if (!category) {
    throw new ApplicationError(`Category ${input.categoryId} does not exist.`);
  }

  if (category.deletedAt) {
    throw new ApplicationError(`Category ${input.categoryId} is already deleted.`);
  }

  const hasFieldsToUpdate = input.name !== undefined || input.type !== undefined;

  if (!hasFieldsToUpdate) {
    throw new ApplicationError("At least one category field must be provided to update.");
  }

  const now = dependencies.clock.now();
  const updatedAt = now < category.updatedAt ? category.updatedAt : now;

  const updatedCategoryBase = createCategory({
    id: category.id,
    name: input.name ?? category.name,
    type: input.type ?? category.type,
    createdAt: category.createdAt,
    updatedAt,
  });

  const updatedCategory: Category = {
    ...updatedCategoryBase,
    deletedAt: category.deletedAt,
    version: category.version,
  };

  await dependencies.categories.save(updatedCategory);

  const outboxOpId = dependencies.ids.nextId();
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "category",
    entityId: updatedCategory.id,
    opType: "update",
    ...(updatedCategory.version !== null
      ? { baseVersion: updatedCategory.version }
      : {}),
    payload: toCategoryOutboxPayload(updatedCategory),
    createdAt: updatedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    category: updatedCategory,
    outboxOpId,
  };
};
