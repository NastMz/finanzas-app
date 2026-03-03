import { describe, expect, it } from "vitest";

import { createCategory, DomainError } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { updateCategory } from "./update-category.js";

describe("updateCategory", () => {
  it("updates the category and queues an outbox operation", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingCategory = {
      ...createCategory({
        id: "cat-food",
        name: "Comida",
        type: "expense",
        createdAt,
      }),
      version: 3,
    };

    const categories = new InMemoryCategoryRepository([existingCategory]);
    const outbox = new InMemoryOutboxRepository();

    const result = await updateCategory(
      {
        categories,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        categoryId: "cat-food",
        name: "Comida y snacks",
      },
    );

    expect(result.category.name).toBe("Comida y snacks");
    expect(result.outboxOpId).toBe("op-1");

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("category");
    expect(pendingOps[0]?.opType).toBe("update");
    expect(pendingOps[0]?.baseVersion).toBe(3);
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "cat-food",
      name: "Comida y snacks",
    });
  });

  it("fails when category does not exist", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      updateCategory(
        {
          categories: new InMemoryCategoryRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-missing"]),
          deviceId: "web-device-1",
        },
        {
          categoryId: "cat-missing",
          name: "Transporte",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when updated category name is invalid", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingCategory = createCategory({
      id: "cat-food",
      name: "Comida",
      type: "expense",
      createdAt,
    });

    await expect(
      updateCategory(
        {
          categories: new InMemoryCategoryRepository([existingCategory]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-invalid"]),
          deviceId: "web-device-1",
        },
        {
          categoryId: "cat-food",
          name: "   ",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
