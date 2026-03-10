import { describe, expect, it } from "vitest";

import { InMemoryBudgetRepository } from "@finanzas/data";

import { SyncError } from "../errors.js";
import type { SyncChange } from "../ports.js";
import { createBudgetSyncChangeApplier } from "./budget-sync-change-applier.js";

describe("createBudgetSyncChangeApplier", () => {
  it("applies create and update changes for budgets", async () => {
    const repository = new InMemoryBudgetRepository();
    const applier = createBudgetSyncChangeApplier({
      budgets: repository,
    });

    await applier.apply([
      createBudgetChange({
        changeId: "chg-1",
        opType: "create",
        payload: {
          id: "bdg-food",
          categoryId: "cat-food",
          period: "2026-03",
          limitAmountMinor: "300000",
          currency: "COP",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:00:00.000Z",
          deletedAt: null,
        },
        serverVersion: 1,
      }),
      createBudgetChange({
        changeId: "chg-2",
        opType: "update",
        payload: {
          id: "bdg-food",
          categoryId: "cat-food",
          period: "2026-03",
          limitAmountMinor: "350000",
          currency: "COP",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:10:00.000Z",
          deletedAt: null,
        },
        serverVersion: 2,
      }),
    ]);

    const storedBudget = await repository.findById("bdg-food");
    expect(storedBudget).not.toBeNull();
    expect(storedBudget?.limit.amountMinor).toBe(350000n);
    expect(storedBudget?.period).toBe("2026-03");
    expect(storedBudget?.version).toBe(2);
  });

  it("applies delete changes with tombstone timestamp", async () => {
    const repository = new InMemoryBudgetRepository();
    const applier = createBudgetSyncChangeApplier({
      budgets: repository,
    });

    await applier.apply([
      createBudgetChange({
        changeId: "chg-del",
        opType: "delete",
        payload: {
          id: "bdg-home",
          categoryId: "cat-home",
          period: "2026-03",
          limitAmountMinor: "500000",
          currency: "COP",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:20:00.000Z",
          deletedAt: null,
        },
        serverVersion: 3,
        serverTimestamp: new Date("2026-03-02T08:20:00.000Z"),
      }),
    ]);

    const storedBudget = await repository.findById("bdg-home");
    expect(storedBudget?.deletedAt?.toISOString()).toBe("2026-03-02T08:20:00.000Z");
    expect(storedBudget?.version).toBe(3);
  });

  it("throws when budget payload is invalid", async () => {
    const repository = new InMemoryBudgetRepository();
    const applier = createBudgetSyncChangeApplier({
      budgets: repository,
    });

    await expect(
      applier.apply([
        createBudgetChange({
          changeId: "chg-invalid",
          payload: {
            id: "bdg-invalid",
            categoryId: "cat-food",
            period: "2026/03",
            limitAmountMinor: "300000",
            currency: "COP",
            createdAt: "2026-03-02T08:00:00.000Z",
            updatedAt: "2026-03-02T08:20:00.000Z",
            deletedAt: null,
          },
        }),
      ]),
    ).rejects.toBeInstanceOf(SyncError);
  });
});

const createBudgetChange = (input: {
  changeId: string;
  opType?: SyncChange["opType"];
  payload: Record<string, unknown>;
  serverVersion?: number;
  serverTimestamp?: Date;
}): SyncChange => ({
  changeId: input.changeId,
  entityType: "budget",
  entityId:
    typeof input.payload.id === "string" ? input.payload.id : `${input.changeId}-entity`,
  opType: input.opType ?? "create",
  payload: input.payload,
  ...(input.serverVersion !== undefined ? { serverVersion: input.serverVersion } : {}),
  serverTimestamp: input.serverTimestamp ?? new Date("2026-03-02T10:00:00.000Z"),
});
