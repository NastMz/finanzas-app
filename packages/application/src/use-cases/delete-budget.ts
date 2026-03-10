import type { Budget } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  BudgetRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
} from "../ports.js";
import { toBudgetOutboxPayload } from "./shared/budget-outbox-payload.js";

/**
 * Input required to tombstone a budget.
 */
export interface DeleteBudgetInput {
  budgetId: string;
}

/**
 * Runtime dependencies required by `deleteBudget`.
 */
export interface DeleteBudgetDependencies {
  budgets: BudgetRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `deleteBudget` execution.
 */
export interface DeleteBudgetResult {
  budget: Budget;
  outboxOpId: string;
}

/**
 * Applies a local tombstone to a budget and appends a pending delete
 * operation to the outbox for remote propagation.
 */
export const deleteBudget = async (
  dependencies: DeleteBudgetDependencies,
  input: DeleteBudgetInput,
): Promise<DeleteBudgetResult> => {
  const budget = await dependencies.budgets.findById(input.budgetId);

  if (!budget) {
    throw new ApplicationError(`Budget ${input.budgetId} does not exist.`);
  }

  if (budget.deletedAt) {
    throw new ApplicationError(`Budget ${input.budgetId} is already deleted.`);
  }

  const now = dependencies.clock.now();
  const deletedAt = now < budget.updatedAt ? budget.updatedAt : now;

  const deletedBudget: Budget = {
    ...budget,
    updatedAt: deletedAt,
    deletedAt,
  };

  await dependencies.budgets.save(deletedBudget);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "budget",
    entityId: deletedBudget.id,
    opType: "delete",
    ...(deletedBudget.version !== null ? { baseVersion: deletedBudget.version } : {}),
    payload: toBudgetOutboxPayload(deletedBudget),
    createdAt: deletedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    budget: deletedBudget,
    outboxOpId,
  };
};
