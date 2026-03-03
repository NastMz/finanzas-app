import { describe, expect, it } from "vitest";

import { SyncError } from "../errors.js";
import type { SyncChange, SyncChangeApplier } from "../ports.js";
import { createCompositeSyncChangeApplier } from "./composite-sync-change-applier.js";

describe("createCompositeSyncChangeApplier", () => {
  it("routes each change to the matching entity applier preserving order", async () => {
    const appliedTransactionChanges: string[] = [];
    const appliedBudgetChanges: string[] = [];

    const transactionApplier: SyncChangeApplier = {
      async apply(changes: SyncChange[]): Promise<void> {
        for (const change of changes) {
          appliedTransactionChanges.push(change.changeId);
        }
      },
    };

    const budgetApplier: SyncChangeApplier = {
      async apply(changes: SyncChange[]): Promise<void> {
        for (const change of changes) {
          appliedBudgetChanges.push(change.changeId);
        }
      },
    };

    const applier = createCompositeSyncChangeApplier({
      appliersByEntityType: {
        transaction: transactionApplier,
        budget: budgetApplier,
      },
    });

    await applier.apply([
      createSyncChange("chg-1", "transaction"),
      createSyncChange("chg-2", "budget"),
      createSyncChange("chg-3", "transaction"),
    ]);

    expect(appliedTransactionChanges).toEqual(["chg-1", "chg-3"]);
    expect(appliedBudgetChanges).toEqual(["chg-2"]);
  });

  it("ignores unknown entity types by default", async () => {
    const appliedTransactionChanges: string[] = [];

    const applier = createCompositeSyncChangeApplier({
      appliersByEntityType: {
        transaction: {
          async apply(changes: SyncChange[]): Promise<void> {
            for (const change of changes) {
              appliedTransactionChanges.push(change.changeId);
            }
          },
        },
      },
    });

    await applier.apply([
      createSyncChange("chg-1", "transaction"),
      createSyncChange("chg-2", "category"),
    ]);

    expect(appliedTransactionChanges).toEqual(["chg-1"]);
  });

  it("throws when unknown entity type is configured as error", async () => {
    const applier = createCompositeSyncChangeApplier({
      appliersByEntityType: {},
      failOnUnknownEntityType: true,
    });

    await expect(applier.apply([createSyncChange("chg-1", "category")])).rejects.toBeInstanceOf(
      SyncError,
    );
  });
});

const createSyncChange = (changeId: string, entityType: string): SyncChange => ({
  changeId,
  entityType,
  entityId: `${changeId}-entity`,
  opType: "create",
  payload: {},
  serverVersion: 1,
  serverTimestamp: new Date("2026-03-02T10:00:00.000Z"),
});
