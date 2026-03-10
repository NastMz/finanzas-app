import { createBudget, createMoney, type Budget } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  BudgetRepository,
  CategoryRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
} from "../ports.js";
import { toBudgetOutboxPayload } from "./shared/budget-outbox-payload.js";
import { resolveBudgetCategory } from "./shared/resolve-budget-category.js";

/**
 * Input required to update a budget and enqueue its sync operation.
 */
export interface UpdateBudgetInput {
  budgetId: string;
  categoryId?: string;
  period?: string;
  limitAmountMinor?: number | bigint;
  currency?: string;
}

/**
 * Runtime dependencies required by `updateBudget`.
 */
export interface UpdateBudgetDependencies {
  budgets: BudgetRepository;
  categories: CategoryRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `updateBudget` execution.
 */
export interface UpdateBudgetResult {
  budget: Budget;
  outboxOpId: string;
}

/**
 * Updates a local budget and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const updateBudget = async (
  dependencies: UpdateBudgetDependencies,
  input: UpdateBudgetInput,
): Promise<UpdateBudgetResult> => {
  const budget = await dependencies.budgets.findById(input.budgetId);

  if (!budget) {
    throw new ApplicationError(`Budget ${input.budgetId} does not exist.`);
  }

  if (budget.deletedAt) {
    throw new ApplicationError(`Budget ${input.budgetId} is already deleted.`);
  }

  const hasFieldsToUpdate =
    input.categoryId !== undefined ||
    input.period !== undefined ||
    input.limitAmountMinor !== undefined ||
    input.currency !== undefined;

  if (!hasFieldsToUpdate) {
    throw new ApplicationError("At least one budget field must be provided to update.");
  }

  const category = await resolveBudgetCategory(
    dependencies.categories,
    input.categoryId ?? budget.categoryId,
  );
  const now = dependencies.clock.now();
  const updatedAt = now < budget.updatedAt ? budget.updatedAt : now;

  const updatedBudgetBase = createBudget({
    id: budget.id,
    categoryId: category.id,
    period: input.period ?? budget.period,
    limit: createMoney(
      input.limitAmountMinor ?? budget.limit.amountMinor,
      input.currency ?? budget.limit.currency,
    ),
    createdAt: budget.createdAt,
    updatedAt,
  });

  const duplicateBudget = await dependencies.budgets.findActiveByCategoryIdAndPeriod(
    updatedBudgetBase.categoryId,
    updatedBudgetBase.period,
  );

  if (duplicateBudget && duplicateBudget.id !== budget.id) {
    throw new ApplicationError(
      `Budget for category ${updatedBudgetBase.categoryId} and period ${updatedBudgetBase.period} already exists.`,
    );
  }

  const updatedBudget: Budget = {
    ...updatedBudgetBase,
    deletedAt: budget.deletedAt,
    version: budget.version,
  };

  await dependencies.budgets.save(updatedBudget);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "budget",
    entityId: updatedBudget.id,
    opType: "update",
    ...(updatedBudget.version !== null ? { baseVersion: updatedBudget.version } : {}),
    payload: toBudgetOutboxPayload(updatedBudget),
    createdAt: updatedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    budget: updatedBudget,
    outboxOpId,
  };
};
