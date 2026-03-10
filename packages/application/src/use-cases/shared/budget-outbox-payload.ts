import type { Budget } from "@finanzas/domain";

/**
 * Serializes a budget aggregate into the JSON payload format expected
 * by outbox sync operations.
 */
export const toBudgetOutboxPayload = (budget: Budget): Record<string, unknown> => ({
  id: budget.id,
  categoryId: budget.categoryId,
  period: budget.period,
  limitAmountMinor: budget.limit.amountMinor.toString(),
  currency: budget.limit.currency,
  createdAt: budget.createdAt.toISOString(),
  updatedAt: budget.updatedAt.toISOString(),
  deletedAt: budget.deletedAt ? budget.deletedAt.toISOString() : null,
});
