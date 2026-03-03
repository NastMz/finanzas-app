import { describe, expect, it } from "vitest";

import { createCategory } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { deleteCategory } from "./delete-category.js";

describe("deleteCategory", () => {
  it("tombstones the category and queues a delete outbox operation", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingCategory = {
      ...createCategory({
        id: "cat-food",
        name: "Comida",
        type: "expense",
        createdAt,
      }),
      version: 4,
    };

    const categories = new InMemoryCategoryRepository([existingCategory]);
    const outbox = new InMemoryOutboxRepository();

    const result = await deleteCategory(
      {
        categories,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["op-del-1"]),
        deviceId: "web-device-1",
      },
      {
        categoryId: "cat-food",
      },
    );

    expect(result.category.deletedAt?.toISOString()).toBe("2026-03-02T14:00:00.000Z");
    expect(result.outboxOpId).toBe("op-del-1");

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("category");
    expect(pendingOps[0]?.opType).toBe("delete");
    expect(pendingOps[0]?.baseVersion).toBe(4);
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "cat-food",
    });
  });

  it("fails when category does not exist", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      deleteCategory(
        {
          categories: new InMemoryCategoryRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-missing"]),
          deviceId: "web-device-1",
        },
        {
          categoryId: "cat-missing",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when category is already deleted", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const deletedAt = new Date("2026-03-02T14:00:00.000Z");
    const now = new Date("2026-03-02T15:00:00.000Z");
    const deletedCategory = {
      ...createCategory({
        id: "cat-food",
        name: "Comida",
        type: "expense",
        createdAt,
      }),
      updatedAt: deletedAt,
      deletedAt,
    };

    await expect(
      deleteCategory(
        {
          categories: new InMemoryCategoryRepository([deletedCategory]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-deleted"]),
          deviceId: "web-device-1",
        },
        {
          categoryId: "cat-food",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
