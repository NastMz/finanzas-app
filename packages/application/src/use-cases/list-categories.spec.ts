import { describe, expect, it } from "vitest";

import { createCategory } from "@finanzas/domain";
import { InMemoryCategoryRepository } from "@finanzas/data";

import { listCategories } from "./list-categories.js";

describe("listCategories", () => {
  it("lists local categories excluding tombstones by default", async () => {
    const now = new Date("2026-03-03T10:00:00.000Z");

    const categoryB = createCategory({
      id: "cat-b",
      name: "Transporte",
      type: "expense",
      createdAt: now,
    });

    const categoryA = createCategory({
      id: "cat-a",
      name: "Comida",
      type: "expense",
      createdAt: now,
    });

    const deletedCategory = {
      ...createCategory({
        id: "cat-deleted",
        name: "Deleted",
        type: "expense",
        createdAt: now,
      }),
      updatedAt: now,
      deletedAt: now,
    };

    const result = await listCategories(
      {
        categories: new InMemoryCategoryRepository([
          categoryB,
          deletedCategory,
          categoryA,
        ]),
      },
      {},
    );

    expect(result.categories.map((category) => category.id)).toEqual([
      "cat-a",
      "cat-b",
    ]);
  });

  it("filters by type and includes tombstones when requested", async () => {
    const now = new Date("2026-03-03T10:00:00.000Z");

    const incomeCategory = createCategory({
      id: "cat-income",
      name: "Salario",
      type: "income",
      createdAt: now,
    });

    const expenseCategory = createCategory({
      id: "cat-expense",
      name: "Comida",
      type: "expense",
      createdAt: now,
    });

    const deletedExpenseCategory = {
      ...createCategory({
        id: "cat-deleted-expense",
        name: "Deleted expense",
        type: "expense",
        createdAt: now,
      }),
      updatedAt: now,
      deletedAt: now,
    };

    const result = await listCategories(
      {
        categories: new InMemoryCategoryRepository([
          incomeCategory,
          expenseCategory,
          deletedExpenseCategory,
        ]),
      },
      {
        includeDeleted: true,
        type: "expense",
      },
    );

    expect(result.categories.map((category) => category.id)).toEqual([
      "cat-expense",
      "cat-deleted-expense",
    ]);
  });

  it("returns empty list when no categories exist", async () => {
    const result = await listCategories(
      {
        categories: new InMemoryCategoryRepository(),
      },
      {},
    );

    expect(result.categories).toEqual([]);
  });
});
