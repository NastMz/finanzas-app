import { describe, expect, it } from "vitest";

import { createBudget, createMoney } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryBudgetRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { deleteBudget } from "./delete-budget.js";

describe("deleteBudget", () => {
  it("tombstones the budget and queues a delete operation", async () => {
    const createdAt = new Date("2026-03-02T10:00:00.000Z");
    const deletedAt = new Date("2026-03-02T12:00:00.000Z");
    const budgets = new InMemoryBudgetRepository([
      createBudget({
        id: "bdg-1",
        categoryId: "cat-food",
        period: "2026-03",
        limit: createMoney(300000, "COP"),
        createdAt,
      }),
    ]);
    const outbox = new InMemoryOutboxRepository();

    const result = await deleteBudget(
      {
        budgets,
        outbox,
        clock: new FixedClock(deletedAt),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        budgetId: "bdg-1",
      },
    );

    expect(result.budget.deletedAt?.toISOString()).toBe("2026-03-02T12:00:00.000Z");
    expect(result.outboxOpId).toBe("op-1");

    const pendingOps = await outbox.listPending();
    expect(pendingOps[0]?.entityType).toBe("budget");
    expect(pendingOps[0]?.opType).toBe("delete");
  });

  it("fails when deleting an unknown budget", async () => {
    await expect(
      deleteBudget(
        {
          budgets: new InMemoryBudgetRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-02T12:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-1"]),
          deviceId: "web-device-1",
        },
        {
          budgetId: "bdg-missing",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
