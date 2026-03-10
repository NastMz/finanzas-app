import { describe, expect, it } from "vitest";

import { createBudget, createCategory, createMoney } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryBudgetRepository,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { updateBudget } from "./update-budget.js";

describe("updateBudget", () => {
  it("updates the budget and queues an outbox operation", async () => {
    const createdAt = new Date("2026-03-02T10:00:00.000Z");
    const updatedAt = new Date("2026-03-02T12:00:00.000Z");
    const budgets = new InMemoryBudgetRepository([
      createBudget({
        id: "bdg-1",
        categoryId: "cat-food",
        period: "2026-03",
        limit: createMoney(300000, "COP"),
        createdAt,
      }),
    ]);
    const categories = new InMemoryCategoryRepository([
      createCategory({
        id: "cat-food",
        name: "Comida",
        type: "expense",
        createdAt,
      }),
    ]);
    const outbox = new InMemoryOutboxRepository();

    const result = await updateBudget(
      {
        budgets,
        categories,
        outbox,
        clock: new FixedClock(updatedAt),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        budgetId: "bdg-1",
        period: "2026-04",
        limitAmountMinor: 350000,
      },
    );

    expect(result.budget.period).toBe("2026-04");
    expect(result.budget.limit.amountMinor).toBe(350000n);
    expect(result.budget.updatedAt.toISOString()).toBe("2026-03-02T12:00:00.000Z");
    expect(result.outboxOpId).toBe("op-1");

    const pendingOps = await outbox.listPending();
    expect(pendingOps[0]?.entityType).toBe("budget");
    expect(pendingOps[0]?.opType).toBe("update");
  });

  it("fails when no fields are provided", async () => {
    const now = new Date("2026-03-02T10:00:00.000Z");

    await expect(
      updateBudget(
        {
          budgets: new InMemoryBudgetRepository([
            createBudget({
              id: "bdg-1",
              categoryId: "cat-food",
              period: "2026-03",
              limit: createMoney(300000, "COP"),
              createdAt: now,
            }),
          ]),
          categories: new InMemoryCategoryRepository([
            createCategory({
              id: "cat-food",
              name: "Comida",
              type: "expense",
              createdAt: now,
            }),
          ]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-1"]),
          deviceId: "web-device-1",
        },
        {
          budgetId: "bdg-1",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when another active budget already exists for the target category and period", async () => {
    const now = new Date("2026-03-02T10:00:00.000Z");

    await expect(
      updateBudget(
        {
          budgets: new InMemoryBudgetRepository([
            createBudget({
              id: "bdg-1",
              categoryId: "cat-food",
              period: "2026-03",
              limit: createMoney(300000, "COP"),
              createdAt: now,
            }),
            createBudget({
              id: "bdg-2",
              categoryId: "cat-food",
              period: "2026-04",
              limit: createMoney(350000, "COP"),
              createdAt: now,
            }),
          ]),
          categories: new InMemoryCategoryRepository([
            createCategory({
              id: "cat-food",
              name: "Comida",
              type: "expense",
              createdAt: now,
            }),
          ]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-1"]),
          deviceId: "web-device-1",
        },
        {
          budgetId: "bdg-1",
          period: "2026-04",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
