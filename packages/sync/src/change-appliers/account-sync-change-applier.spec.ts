import { describe, expect, it } from "vitest";

import { InMemoryAccountRepository } from "@finanzas/data";

import { SyncError } from "../errors.js";
import type { SyncChange } from "../ports.js";
import { createAccountSyncChangeApplier } from "./account-sync-change-applier.js";

describe("createAccountSyncChangeApplier", () => {
  it("applies create and update account changes", async () => {
    const repository = new InMemoryAccountRepository();
    const applier = createAccountSyncChangeApplier({
      accounts: repository,
    });

    await applier.apply([
      createAccountChange({
        changeId: "chg-1",
        opType: "create",
        payload: {
          id: "acc-main",
          name: "Cuenta principal",
          type: "bank",
          currency: "COP",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:00:00.000Z",
          deletedAt: null,
        },
        serverVersion: 1,
      }),
      createAccountChange({
        changeId: "chg-2",
        opType: "update",
        payload: {
          id: "acc-main",
          name: "Cuenta principal editada",
          type: "bank",
          currency: "COP",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:05:00.000Z",
          deletedAt: null,
        },
        serverVersion: 2,
      }),
    ]);

    const storedAccount = await repository.findById("acc-main");
    expect(storedAccount).not.toBeNull();
    expect(storedAccount?.name).toBe("Cuenta principal editada");
    expect(storedAccount?.version).toBe(2);
    expect(storedAccount?.deletedAt).toBeNull();
  });

  it("applies delete changes using server timestamp when deletedAt is null", async () => {
    const repository = new InMemoryAccountRepository();
    const applier = createAccountSyncChangeApplier({
      accounts: repository,
    });

    await applier.apply([
      createAccountChange({
        changeId: "chg-del",
        opType: "delete",
        payload: {
          id: "acc-main",
          name: "Cuenta principal",
          type: "bank",
          currency: "COP",
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:10:00.000Z",
          deletedAt: null,
        },
        serverVersion: 3,
        serverTimestamp: new Date("2026-03-02T08:10:00.000Z"),
      }),
    ]);

    const storedAccount = await repository.findById("acc-main");
    expect(storedAccount?.deletedAt?.toISOString()).toBe("2026-03-02T08:10:00.000Z");
    expect(storedAccount?.version).toBe(3);
  });

  it("throws when account payload is invalid", async () => {
    const repository = new InMemoryAccountRepository();
    const applier = createAccountSyncChangeApplier({
      accounts: repository,
    });

    await expect(
      applier.apply([
        createAccountChange({
          changeId: "chg-invalid",
          payload: {
            id: "acc-main",
            name: "Cuenta principal",
            type: "investment",
            currency: "COP",
            createdAt: "2026-03-02T08:00:00.000Z",
            updatedAt: "2026-03-02T08:00:00.000Z",
            deletedAt: null,
          },
        }),
      ]),
    ).rejects.toBeInstanceOf(SyncError);
  });
});

const createAccountChange = (input: {
  changeId: string;
  opType?: SyncChange["opType"];
  payload: Record<string, unknown>;
  serverVersion?: number;
  serverTimestamp?: Date;
}): SyncChange => ({
  changeId: input.changeId,
  entityType: "account",
  entityId:
    typeof input.payload.id === "string" ? input.payload.id : `${input.changeId}-entity`,
  opType: input.opType ?? "create",
  payload: input.payload,
  ...(input.serverVersion !== undefined ? { serverVersion: input.serverVersion } : {}),
  serverTimestamp: input.serverTimestamp ?? new Date("2026-03-02T10:00:00.000Z"),
});
