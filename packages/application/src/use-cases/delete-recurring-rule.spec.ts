import { describe, expect, it } from "vitest";

import { createRecurringRule } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryOutboxRepository,
  InMemoryRecurringRuleRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { deleteRecurringRule } from "./delete-recurring-rule.js";

describe("deleteRecurringRule", () => {
  it("tombstones the recurring rule and queues a delete operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    const result = await deleteRecurringRule(
      {
        recurringRules: new InMemoryRecurringRuleRepository([
          createRecurringRule({
            id: "rr-1",
            templateId: "tpl-1",
            schedule: {
              frequency: "monthly",
              interval: 1,
              dayOfMonth: 5,
            },
            startsOn: new Date("2026-03-01T00:00:00.000Z"),
            createdAt: now,
          }),
        ]),
        outbox: new InMemoryOutboxRepository(),
        clock: new FixedClock(new Date("2026-03-03T10:00:00.000Z")),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        recurringRuleId: "rr-1",
      },
    );

    expect(result.recurringRule.deletedAt).not.toBeNull();
    expect(result.recurringRule.isActive).toBe(false);
  });

  it("fails when deleting a missing rule", async () => {
    await expect(
      deleteRecurringRule(
        {
          recurringRules: new InMemoryRecurringRuleRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-03T10:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-1"]),
          deviceId: "web-device-1",
        },
        {
          recurringRuleId: "rr-missing",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
