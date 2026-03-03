import { describe, expect, it } from "vitest";

import { InMemoryTransactionRepository } from "@finanzas/data";

import { SyncError } from "../errors.js";
import type { SyncChange } from "../ports.js";
import { createTransactionSyncChangeApplier } from "./transaction-sync-change-applier.js";

describe("createTransactionSyncChangeApplier", () => {
  it("applies create and update changes for transactions", async () => {
    const repository = new InMemoryTransactionRepository();
    const applier = createTransactionSyncChangeApplier({
      transactions: repository,
    });

    await applier.apply([
      createTransactionChange({
        changeId: "chg-1",
        opType: "create",
        payload: {
          id: "tx-1",
          accountId: "acc-main",
          amountMinor: "-120000",
          currency: "COP",
          date: "2026-03-02T10:00:00.000Z",
          categoryId: "food",
          note: "Almuerzo",
          tags: ["food", "lunch"],
          createdAt: "2026-03-02T10:00:00.000Z",
          updatedAt: "2026-03-02T10:00:00.000Z",
          deletedAt: null,
        },
        serverVersion: 1,
      }),
      createTransactionChange({
        changeId: "chg-2",
        opType: "update",
        payload: {
          id: "tx-1",
          accountId: "acc-main",
          amountMinor: "-130000",
          currency: "COP",
          date: "2026-03-02T10:00:00.000Z",
          categoryId: "food",
          note: "Almuerzo oficina",
          tags: ["food", "office"],
          createdAt: "2026-03-02T10:00:00.000Z",
          updatedAt: "2026-03-02T10:05:00.000Z",
          deletedAt: null,
        },
        serverVersion: 2,
      }),
    ]);

    const storedTransaction = await repository.findById("tx-1");
    expect(storedTransaction).not.toBeNull();
    expect(storedTransaction?.amount.amountMinor).toBe(-130000n);
    expect(storedTransaction?.note).toBe("Almuerzo oficina");
    expect(storedTransaction?.tags).toEqual(["food", "office"]);
    expect(storedTransaction?.version).toBe(2);
  });

  it("applies delete changes with tombstone timestamp", async () => {
    const repository = new InMemoryTransactionRepository();
    const applier = createTransactionSyncChangeApplier({
      transactions: repository,
    });

    await applier.apply([
      createTransactionChange({
        changeId: "chg-del",
        opType: "delete",
        payload: {
          id: "tx-9",
          accountId: "acc-main",
          amountMinor: "-50000",
          currency: "COP",
          date: "2026-03-02T09:00:00.000Z",
          categoryId: "other",
          note: null,
          tags: [],
          createdAt: "2026-03-02T09:00:00.000Z",
          updatedAt: "2026-03-02T09:10:00.000Z",
          deletedAt: null,
        },
        serverVersion: 3,
        serverTimestamp: new Date("2026-03-02T09:10:00.000Z"),
      }),
    ]);

    const storedTransaction = await repository.findById("tx-9");
    expect(storedTransaction?.deletedAt?.toISOString()).toBe(
      "2026-03-02T09:10:00.000Z",
    );
    expect(storedTransaction?.version).toBe(3);
  });

  it("throws when payload is invalid", async () => {
    const repository = new InMemoryTransactionRepository();
    const applier = createTransactionSyncChangeApplier({
      transactions: repository,
    });

    await expect(
      applier.apply([
        createTransactionChange({
          changeId: "chg-invalid",
          payload: {
            id: "tx-err",
            accountId: "acc-main",
            amountMinor: "invalid-number",
            currency: "COP",
            date: "2026-03-02T09:00:00.000Z",
            categoryId: "other",
            note: null,
            tags: [],
            createdAt: "2026-03-02T09:00:00.000Z",
            updatedAt: "2026-03-02T09:10:00.000Z",
            deletedAt: null,
          },
        }),
      ]),
    ).rejects.toBeInstanceOf(SyncError);
  });
});

const createTransactionChange = (input: {
  changeId: string;
  opType?: SyncChange["opType"];
  payload: Record<string, unknown>;
  serverVersion?: number;
  serverTimestamp?: Date;
}): SyncChange => ({
  changeId: input.changeId,
  entityType: "transaction",
  entityId:
    typeof input.payload.id === "string" ? input.payload.id : `${input.changeId}-entity`,
  opType: input.opType ?? "create",
  payload: input.payload,
  ...(input.serverVersion !== undefined ? { serverVersion: input.serverVersion } : {}),
  serverTimestamp: input.serverTimestamp ?? new Date("2026-03-02T10:00:00.000Z"),
});
