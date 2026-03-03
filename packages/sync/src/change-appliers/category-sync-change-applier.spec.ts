import { describe, expect, it } from "vitest";

import { InMemoryCategoryRepository } from "@finanzas/data";

import { SyncError } from "../errors.js";
import type { SyncChange } from "../ports.js";
import { createCategorySyncChangeApplier } from "./category-sync-change-applier.js";

describe("createCategorySyncChangeApplier", () => {
  it("applies create and update category changes", async () => {
    const repository = new InMemoryCategoryRepository();
    const applier = createCategorySyncChangeApplier({
      categories: repository,
    });

    await applier.apply([
      createCategoryChange({
        changeId: "chg-1",
        opType: "create",
        payload: {
          id: "cat-food",
          name: "Comida",
          type: "expense",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:00:00.000Z",
          deletedAt: null,
        },
        serverVersion: 1,
      }),
      createCategoryChange({
        changeId: "chg-2",
        opType: "update",
        payload: {
          id: "cat-food",
          name: "Comida y snacks",
          type: "expense",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:10:00.000Z",
          deletedAt: null,
        },
        serverVersion: 2,
      }),
    ]);

    const storedCategory = await repository.findById("cat-food");
    expect(storedCategory).not.toBeNull();
    expect(storedCategory?.name).toBe("Comida y snacks");
    expect(storedCategory?.version).toBe(2);
    expect(storedCategory?.deletedAt).toBeNull();
  });

  it("applies delete changes with tombstone timestamp", async () => {
    const repository = new InMemoryCategoryRepository();
    const applier = createCategorySyncChangeApplier({
      categories: repository,
    });

    await applier.apply([
      createCategoryChange({
        changeId: "chg-del",
        opType: "delete",
        payload: {
          id: "cat-salary",
          name: "Salario",
          type: "income",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:20:00.000Z",
          deletedAt: null,
        },
        serverVersion: 3,
        serverTimestamp: new Date("2026-03-02T08:20:00.000Z"),
      }),
    ]);

    const storedCategory = await repository.findById("cat-salary");
    expect(storedCategory?.deletedAt?.toISOString()).toBe("2026-03-02T08:20:00.000Z");
    expect(storedCategory?.version).toBe(3);
  });

  it("throws when category payload is invalid", async () => {
    const repository = new InMemoryCategoryRepository();
    const applier = createCategorySyncChangeApplier({
      categories: repository,
    });

    await expect(
      applier.apply([
        createCategoryChange({
          changeId: "chg-invalid",
          payload: {
            id: "cat-food",
            name: "Comida",
            type: "mixed",
            createdAt: "2026-03-02T08:00:00.000Z",
            updatedAt: "2026-03-02T08:20:00.000Z",
            deletedAt: null,
          },
        }),
      ]),
    ).rejects.toBeInstanceOf(SyncError);
  });
});

const createCategoryChange = (input: {
  changeId: string;
  opType?: SyncChange["opType"];
  payload: Record<string, unknown>;
  serverVersion?: number;
  serverTimestamp?: Date;
}): SyncChange => ({
  changeId: input.changeId,
  entityType: "category",
  entityId:
    typeof input.payload.id === "string" ? input.payload.id : `${input.changeId}-entity`,
  opType: input.opType ?? "create",
  payload: input.payload,
  ...(input.serverVersion !== undefined ? { serverVersion: input.serverVersion } : {}),
  serverTimestamp: input.serverTimestamp ?? new Date("2026-03-02T10:00:00.000Z"),
});
