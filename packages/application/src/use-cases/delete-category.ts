import type { Category } from "@finanzas/domain";

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
 * Input required to tombstone a category.
 */
export interface DeleteCategoryInput {
  categoryId: string;
}

/**
 * Runtime dependencies required by `deleteCategory`.
 */
export interface DeleteCategoryDependencies {
  categories: CategoryRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `deleteCategory` execution.
 */
export interface DeleteCategoryResult {
  category: Category;
  outboxOpId: string;
}

/**
 * Applies a local tombstone to a category and appends a pending delete
 * operation to the outbox for remote propagation.
 */
export const deleteCategory = async (
  dependencies: DeleteCategoryDependencies,
  input: DeleteCategoryInput,
): Promise<DeleteCategoryResult> => {
  const category = await dependencies.categories.findById(input.categoryId);

  if (!category) {
    throw new ApplicationError(`Category ${input.categoryId} does not exist.`);
  }

  if (category.deletedAt) {
    throw new ApplicationError(`Category ${input.categoryId} is already deleted.`);
  }

  const now = dependencies.clock.now();
  const deletedAt = now < category.updatedAt ? category.updatedAt : now;

  const deletedCategory: Category = {
    ...category,
    updatedAt: deletedAt,
    deletedAt,
  };

  await dependencies.categories.save(deletedCategory);

  const outboxOpId = dependencies.ids.nextId();
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "category",
    entityId: deletedCategory.id,
    opType: "delete",
    ...(deletedCategory.version !== null
      ? { baseVersion: deletedCategory.version }
      : {}),
    payload: toCategoryOutboxPayload(deletedCategory),
    createdAt: deletedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    category: deletedCategory,
    outboxOpId,
  };
};
