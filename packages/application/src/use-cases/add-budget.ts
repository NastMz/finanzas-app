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
 * Input required to create a budget and enqueue its sync operation.
 */
export interface AddBudgetInput {
  categoryId: string;
  period: string;
  limitAmountMinor: number | bigint;
  currency: string;
}

/**
 * Runtime dependencies required by `addBudget`.
 */
export interface AddBudgetDependencies {
  budgets: BudgetRepository;
  categories: CategoryRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `addBudget` execution.
 */
export interface AddBudgetResult {
  budget: Budget;
  outboxOpId: string;
}

/**
 * Creates a new local budget and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const addBudget = async (
  dependencies: AddBudgetDependencies,
  input: AddBudgetInput,
): Promise<AddBudgetResult> => {
  const now = dependencies.clock.now();
  const budgetId = dependencies.ids.nextId("budget");
  const existingBudget = await dependencies.budgets.findById(budgetId);

  if (existingBudget) {
    throw new ApplicationError(`Budget ${budgetId} already exists.`);
  }

  const category = await resolveBudgetCategory(dependencies.categories, input.categoryId);
  const budget = createBudget({
    id: budgetId,
    categoryId: category.id,
    period: input.period,
    limit: createMoney(input.limitAmountMinor, input.currency),
    createdAt: now,
    updatedAt: now,
  });

  const duplicateBudget = await dependencies.budgets.findActiveByCategoryIdAndPeriod(
    budget.categoryId,
    budget.period,
  );

  if (duplicateBudget) {
    throw new ApplicationError(
      `Budget for category ${budget.categoryId} and period ${budget.period} already exists.`,
    );
  }

  await dependencies.budgets.save(budget);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "budget",
    entityId: budget.id,
    opType: "create",
    payload: toBudgetOutboxPayload(budget),
    createdAt: now,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    budget,
    outboxOpId,
  };
};
