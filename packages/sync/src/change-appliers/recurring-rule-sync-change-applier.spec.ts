import { describe, expect, it } from "vitest";

import { InMemoryRecurringRuleRepository } from "@finanzas/data";

import { SyncError } from "../errors.js";
import type { SyncChange } from "../ports.js";
import { createRecurringRuleSyncChangeApplier } from "./recurring-rule-sync-change-applier.js";

describe("createRecurringRuleSyncChangeApplier", () => {
  it("applies create and update changes for recurring rules", async () => {
    const repository = new InMemoryRecurringRuleRepository();
    const applier = createRecurringRuleSyncChangeApplier({
      recurringRules: repository,
    });

    await applier.apply([
      createRecurringRuleChange({
        changeId: "chg-1",
        opType: "create",
        payload: {
          id: "rr-1",
          templateId: "tpl-1",
          schedule: {
            frequency: "monthly",
            interval: 1,
            dayOfMonth: 5,
          },
          startsOn: "2026-03-01T00:00:00.000Z",
          nextRunOn: "2026-03-05T00:00:00.000Z",
          lastGeneratedOn: null,
          isActive: true,
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:00:00.000Z",
          deletedAt: null,
        },
        serverVersion: 1,
      }),
      createRecurringRuleChange({
        changeId: "chg-2",
        opType: "update",
        payload: {
          id: "rr-1",
          templateId: "tpl-1",
          schedule: {
            frequency: "weekly",
            interval: 1,
            dayOfWeek: 1,
          },
          startsOn: "2026-03-01T00:00:00.000Z",
          nextRunOn: "2026-03-02T00:00:00.000Z",
          lastGeneratedOn: null,
          isActive: true,
          createdAt: "2026-03-02T08:00:00.000Z",
          updatedAt: "2026-03-02T08:10:00.000Z",
          deletedAt: null,
        },
        serverVersion: 2,
      }),
    ]);

    const storedRule = await repository.findById("rr-1");
    expect(storedRule?.schedule.frequency).toBe("weekly");
    expect(storedRule?.version).toBe(2);
  });

  it("throws when payload is invalid", async () => {
    const repository = new InMemoryRecurringRuleRepository();
    const applier = createRecurringRuleSyncChangeApplier({
      recurringRules: repository,
    });

    await expect(
      applier.apply([
        createRecurringRuleChange({
          changeId: "chg-invalid",
          payload: {
            id: "rr-1",
            templateId: "tpl-1",
            schedule: {
              frequency: "monthly",
              interval: 1,
              dayOfMonth: 31,
            },
            startsOn: "2026-03-01T00:00:00.000Z",
            nextRunOn: "2026-03-05T00:00:00.000Z",
            lastGeneratedOn: null,
            isActive: true,
            createdAt: "2026-03-02T08:00:00.000Z",
            updatedAt: "2026-03-02T08:10:00.000Z",
            deletedAt: null,
          },
        }),
      ]),
    ).rejects.toBeInstanceOf(SyncError);
  });
});

const createRecurringRuleChange = (input: {
  changeId: string;
  opType?: SyncChange["opType"];
  payload: Record<string, unknown>;
  serverVersion?: number;
  serverTimestamp?: Date;
}): SyncChange => ({
  changeId: input.changeId,
  entityType: "recurring-rule",
  entityId:
    typeof input.payload.id === "string" ? input.payload.id : `${input.changeId}-entity`,
  opType: input.opType ?? "create",
  payload: input.payload,
  ...(input.serverVersion !== undefined ? { serverVersion: input.serverVersion } : {}),
  serverTimestamp: input.serverTimestamp ?? new Date("2026-03-02T10:00:00.000Z"),
});
