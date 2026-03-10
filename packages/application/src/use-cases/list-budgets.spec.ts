import { describe, expect, it } from "vitest";

import { createBudget, createMoney } from "@finanzas/domain";
import { InMemoryBudgetRepository } from "@finanzas/data";

import { listBudgets } from "./list-budgets.js";

describe("listBudgets", () => {
  it("lists local budgets excluding tombstones by default", async () => {
    const now = new Date("2026-03-03T10:00:00.000Z");

    const budgetMarch = createBudget({
      id: "bdg-march",
      categoryId: "cat-food",
      period: "2026-03",
      limit: createMoney(300000, "COP"),
      createdAt: now,
    });

    const budgetApril = createBudget({
      id: "bdg-april",
      categoryId: "cat-transport",
      period: "2026-04",
      limit: createMoney(150000, "COP"),
      createdAt: now,
    });

    const deletedBudget = {
      ...createBudget({
        id: "bdg-deleted",
        categoryId: "cat-home",
        period: "2026-03",
        limit: createMoney(500000, "COP"),
        createdAt: now,
      }),
      updatedAt: now,
      deletedAt: now,
    };

    const result = await listBudgets(
      {
        budgets: new InMemoryBudgetRepository([budgetMarch, deletedBudget, budgetApril]),
      },
      {},
    );

    expect(result.budgets.map((budget) => budget.id)).toEqual([
      "bdg-april",
      "bdg-march",
    ]);
  });

  it("supports period and category filters including tombstones", async () => {
    const now = new Date("2026-03-03T10:00:00.000Z");

    const budgetFood = createBudget({
      id: "bdg-food",
      categoryId: "cat-food",
      period: "2026-03",
      limit: createMoney(300000, "COP"),
      createdAt: now,
    });

    const budgetTransport = createBudget({
      id: "bdg-transport",
      categoryId: "cat-transport",
      period: "2026-03",
      limit: createMoney(150000, "COP"),
      createdAt: now,
    });

    const deletedBudget = {
      ...createBudget({
        id: "bdg-home",
        categoryId: "cat-home",
        period: "2026-03",
        limit: createMoney(500000, "COP"),
        createdAt: now,
      }),
      updatedAt: now,
      deletedAt: now,
    };

    const result = await listBudgets(
      {
        budgets: new InMemoryBudgetRepository([
          budgetTransport,
          deletedBudget,
          budgetFood,
        ]),
      },
      {
        includeDeleted: true,
        period: "2026-03",
        categoryId: "cat-home",
      },
    );

    expect(result.budgets.map((budget) => budget.id)).toEqual(["bdg-home"]);
  });
});
