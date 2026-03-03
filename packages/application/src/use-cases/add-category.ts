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
 * Input required to create a category and enqueue its sync operation.
 */
export interface AddCategoryInput {
  name: string;
  type: CategoryType;
}

/**
 * Runtime dependencies required by `addCategory`.
 */
export interface AddCategoryDependencies {
  categories: CategoryRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `addCategory` execution.
 */
export interface AddCategoryResult {
  category: Category;
  outboxOpId: string;
}

/**
 * Creates a new local category and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const addCategory = async (
  dependencies: AddCategoryDependencies,
  input: AddCategoryInput,
): Promise<AddCategoryResult> => {
  const now = dependencies.clock.now();
  const categoryId = dependencies.ids.nextId();
  const existingCategory = await dependencies.categories.findById(categoryId);

  if (existingCategory) {
    throw new ApplicationError(`Category ${categoryId} already exists.`);
  }

  const category = createCategory({
    id: categoryId,
    name: input.name,
    type: input.type,
    createdAt: now,
    updatedAt: now,
  });

  await dependencies.categories.save(category);

  const outboxOpId = dependencies.ids.nextId();
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "category",
    entityId: category.id,
    opType: "create",
    payload: toCategoryOutboxPayload(category),
    createdAt: now,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    category,
    outboxOpId,
  };
};
