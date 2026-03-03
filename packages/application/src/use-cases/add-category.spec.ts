import { describe, expect, it } from "vitest";

import { createCategory, DomainError } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { addCategory } from "./add-category.js";

describe("addCategory", () => {
  it("stores the category and queues an outbox operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const categories = new InMemoryCategoryRepository();
    const outbox = new InMemoryOutboxRepository();

    const result = await addCategory(
      {
        categories,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["cat-1", "op-1"]),
        deviceId: "web-device-1",
      },
      {
        name: "Comida",
        type: "expense",
      },
    );

    expect(result.category.id).toBe("cat-1");
    expect(result.outboxOpId).toBe("op-1");

    const storedCategory = await categories.findById("cat-1");
    expect(storedCategory?.name).toBe("Comida");

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("category");
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "cat-1",
      type: "expense",
    });
  });

  it("fails when generated category id already exists", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingCategory = createCategory({
      id: "cat-main",
      name: "Comida",
      type: "expense",
      createdAt: now,
    });

    await expect(
      addCategory(
        {
          categories: new InMemoryCategoryRepository([existingCategory]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["cat-main", "op-duplicate"]),
          deviceId: "web-device-1",
        },
        {
          name: "Transporte",
          type: "expense",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when category name is invalid", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addCategory(
        {
          categories: new InMemoryCategoryRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["cat-invalid", "op-invalid"]),
          deviceId: "web-device-1",
        },
        {
          name: "   ",
          type: "expense",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
