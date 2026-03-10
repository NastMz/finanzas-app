import { describe, expect, it } from "vitest";

import { createRecurringRule } from "@finanzas/domain";
import { InMemoryRecurringRuleRepository } from "@finanzas/data";

import { listRecurringRules } from "./list-recurring-rules.js";

describe("listRecurringRules", () => {
  it("lists recurring rules ordered by next run", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    const result = await listRecurringRules(
      {
        recurringRules: new InMemoryRecurringRuleRepository([
          createRecurringRule({
            id: "rr-2",
            templateId: "tpl-1",
            schedule: {
              frequency: "monthly",
              interval: 1,
              dayOfMonth: 20,
            },
            startsOn: new Date("2026-03-01T00:00:00.000Z"),
            createdAt: now,
          }),
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
      },
      {},
    );

    expect(result.recurringRules.map((rule) => rule.id)).toEqual(["rr-1", "rr-2"]);
  });
});
