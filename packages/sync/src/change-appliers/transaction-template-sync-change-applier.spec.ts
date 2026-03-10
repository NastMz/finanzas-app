import { describe, expect, it } from "vitest";

import { InMemoryTransactionTemplateRepository } from "@finanzas/data";

import { SyncError } from "../errors.js";
import type { SyncChange } from "../ports.js";
import { createTransactionTemplateSyncChangeApplier } from "./transaction-template-sync-change-applier.js";

describe("createTransactionTemplateSyncChangeApplier", () => {
  it("applies create and update changes for transaction templates", async () => {
    const repository = new InMemoryTransactionTemplateRepository();
    const applier = createTransactionTemplateSyncChangeApplier({
      templates: repository,
    });

    await applier.apply([
      createTransactionTemplateChange({
        changeId: "chg-1",
        opType: "create",
        payload: {
          id: "tpl-1",
          name: "Arriendo",
          accountId: "acc-main",
          amountMinor: "-900000",
          currency: "COP",
          categoryId: "home",
          note: null,
          tags: ["hogar"],
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:00:00.000Z",
          deletedAt: null,
        },
        serverVersion: 1,
      }),
      createTransactionTemplateChange({
        changeId: "chg-2",
        opType: "update",
        payload: {
          id: "tpl-1",
          name: "Arriendo mensual",
          accountId: "acc-main",
          amountMinor: "-900000",
          currency: "COP",
          categoryId: "home",
          note: null,
          tags: ["hogar", "mensual"],
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:10:00.000Z",
          deletedAt: null,
        },
        serverVersion: 2,
      }),
    ]);

    const storedTemplate = await repository.findById("tpl-1");
    expect(storedTemplate?.name).toBe("Arriendo mensual");
    expect(storedTemplate?.tags).toEqual(["hogar", "mensual"]);
    expect(storedTemplate?.version).toBe(2);
  });

  it("throws when payload is invalid", async () => {
    const repository = new InMemoryTransactionTemplateRepository();
    const applier = createTransactionTemplateSyncChangeApplier({
      templates: repository,
    });

    await expect(
      applier.apply([
        createTransactionTemplateChange({
          changeId: "chg-invalid",
          payload: {
            id: "tpl-1",
            name: "Arriendo",
            accountId: "acc-main",
            amountMinor: "invalid",
            currency: "COP",
            categoryId: "home",
            note: null,
            tags: [],
            createdAt: "2026-03-02T08:00:00.000Z",
            updatedAt: "2026-03-02T08:10:00.000Z",
            deletedAt: null,
          },
        }),
      ]),
    ).rejects.toBeInstanceOf(SyncError);
  });
});

const createTransactionTemplateChange = (input: {
  changeId: string;
  opType?: SyncChange["opType"];
  payload: Record<string, unknown>;
  serverVersion?: number;
  serverTimestamp?: Date;
}): SyncChange => ({
  changeId: input.changeId,
  entityType: "transaction-template",
  entityId:
    typeof input.payload.id === "string" ? input.payload.id : `${input.changeId}-entity`,
  opType: input.opType ?? "create",
  payload: input.payload,
  ...(input.serverVersion !== undefined ? { serverVersion: input.serverVersion } : {}),
  serverTimestamp: input.serverTimestamp ?? new Date("2026-03-02T10:00:00.000Z"),
});
