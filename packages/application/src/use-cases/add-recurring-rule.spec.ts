import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createTransactionTemplate,
  DomainError,
} from "@finanzas/domain";
import {
  FixedClock,
  InMemoryOutboxRepository,
  InMemoryRecurringRuleRepository,
  InMemoryTransactionTemplateRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { addRecurringRule } from "./add-recurring-rule.js";

describe("addRecurringRule", () => {
  it("stores the recurring rule and queues an outbox operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });
    const templates = new InMemoryTransactionTemplateRepository([
      createTransactionTemplate(
        {
          id: "tpl-1",
          name: "Arriendo",
          accountId: "acc-main",
          amount: createMoney(-900000, "COP"),
          categoryId: "home",
          createdAt: now,
        },
        account,
      ),
    ]);

    const result = await addRecurringRule(
      {
        recurringRules: new InMemoryRecurringRuleRepository(),
        templates,
        outbox: new InMemoryOutboxRepository(),
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["rr-1", "op-1"]),
        deviceId: "web-device-1",
      },
      {
        templateId: "tpl-1",
        schedule: {
          frequency: "monthly",
          interval: 1,
          dayOfMonth: 5,
        },
        startsOn: new Date("2026-03-01T12:00:00.000Z"),
      },
    );

    expect(result.recurringRule.id).toBe("rr-1");
    expect(result.recurringRule.nextRunOn.toISOString()).toBe("2026-03-05T00:00:00.000Z");
    expect(result.outboxOpId).toBe("op-1");
  });

  it("fails when template does not exist", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addRecurringRule(
        {
          recurringRules: new InMemoryRecurringRuleRepository(),
          templates: new InMemoryTransactionTemplateRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["rr-1", "op-1"]),
          deviceId: "web-device-1",
        },
        {
          templateId: "tpl-missing",
          schedule: {
            frequency: "monthly",
            interval: 1,
            dayOfMonth: 5,
          },
          startsOn: now,
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when schedule is invalid", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    await expect(
      addRecurringRule(
        {
          recurringRules: new InMemoryRecurringRuleRepository(),
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
              account,
            ),
          ]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["rr-1", "op-1"]),
          deviceId: "web-device-1",
        },
        {
          templateId: "tpl-1",
          schedule: {
            frequency: "monthly",
            interval: 1,
            dayOfMonth: 31,
          },
          startsOn: now,
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
