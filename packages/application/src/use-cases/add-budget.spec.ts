import { describe, expect, it } from "vitest";

import { createBudget, createCategory, createMoney, DomainError } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryBudgetRepository,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { addBudget } from "./add-budget.js";

describe("addBudget", () => {
  it("stores the budget and queues an outbox operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const categories = new InMemoryCategoryRepository([
      createCategory({
        id: "cat-food",
        name: "Comida",
        type: "expense",
        createdAt: now,
      }),
    ]);
    const budgets = new InMemoryBudgetRepository();
    const outbox = new InMemoryOutboxRepository();

    const result = await addBudget(
      {
        budgets,
        categories,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["bdg-1", "op-1"]),
        deviceId: "web-device-1",
      },
      {
        categoryId: "cat-food",
        period: "2026-03",
        limitAmountMinor: 450000,
        currency: "COP",
      },
    );

    expect(result.budget.id).toBe("bdg-1");
    expect(result.budget.limit.amountMinor).toBe(450000n);
    expect(result.outboxOpId).toBe("op-1");

    const storedBudget = await budgets.findById("bdg-1");
    expect(storedBudget?.period).toBe("2026-03");

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("budget");
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "bdg-1",
      categoryId: "cat-food",
      period: "2026-03",
      limitAmountMinor: "450000",
      currency: "COP",
    });
  });

  it("fails when the category is not an active expense category", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addBudget(
        {
          budgets: new InMemoryBudgetRepository(),
          categories: new InMemoryCategoryRepository([
            createCategory({
              id: "cat-income",
              name: "Salario",
              type: "income",
              createdAt: now,
            }),
          ]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["bdg-1", "op-1"]),
          deviceId: "web-device-1",
        },
        {
          categoryId: "cat-income",
          period: "2026-03",
          limitAmountMinor: 250000,
          currency: "COP",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when an active budget already exists for the same category and period", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingBudget = createBudget({
      id: "bdg-existing",
      categoryId: "cat-food",
      period: "2026-03",
      limit: createMoney(300000, "COP"),
      createdAt: now,
    });

    await expect(
      addBudget(
        {
          budgets: new InMemoryBudgetRepository([existingBudget]),
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
          ids: new SequenceIdGenerator(["bdg-1", "op-1"]),
          deviceId: "web-device-1",
        },
        {
          categoryId: "cat-food",
          period: "2026-03",
          limitAmountMinor: 400000,
          currency: "COP",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when budget amount is invalid", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addBudget(
        {
          budgets: new InMemoryBudgetRepository(),
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
          ids: new SequenceIdGenerator(["bdg-1", "op-1"]),
          deviceId: "web-device-1",
        },
        {
          categoryId: "cat-food",
          period: "2026-03",
          limitAmountMinor: -1,
          currency: "COP",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
