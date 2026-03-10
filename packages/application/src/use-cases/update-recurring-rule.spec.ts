import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createRecurringRule,
  createTransactionTemplate,
} from "@finanzas/domain";
import {
  FixedClock,
  InMemoryOutboxRepository,
  InMemoryRecurringRuleRepository,
  InMemoryTransactionTemplateRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { updateRecurringRule } from "./update-recurring-rule.js";

describe("updateRecurringRule", () => {
  it("updates the recurring rule and queues an outbox operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });
    const template = createTransactionTemplate(
      {
        id: "tpl-1",
        name: "Arriendo",
        accountId: "acc-main",
        amount: createMoney(-900000, "COP"),
        categoryId: "home",
        createdAt: now,
      },
      account,
    );

    const result = await updateRecurringRule(
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
        templates: new InMemoryTransactionTemplateRepository([template]),
        outbox: new InMemoryOutboxRepository(),
        clock: new FixedClock(new Date("2026-03-03T10:00:00.000Z")),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        recurringRuleId: "rr-1",
        schedule: {
          frequency: "weekly",
          interval: 1,
          dayOfWeek: 1,
        },
      },
    );

    expect(result.recurringRule.schedule.frequency).toBe("weekly");
    expect(result.outboxOpId).toBe("op-1");
  });

  it("fails when no fields are provided", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      updateRecurringRule(
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
          templates: new InMemoryTransactionTemplateRepository([
            createTransactionTemplate(
              {
                id: "tpl-1",
                name: "Arriendo",
                accountId: "acc-main",
                amount: createMoney(-900000, "COP"),
                categoryId: "home",
                createdAt: now,
              },
              createAccount({
                id: "acc-main",
                name: "Cuenta principal",
                type: "bank",
                currency: "COP",
                createdAt: now,
              }),
            ),
          ]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-1"]),
          deviceId: "web-device-1",
        },
        {
          recurringRuleId: "rr-1",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
