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
import { deleteTransactionTemplate } from "./delete-transaction-template.js";

describe("deleteTransactionTemplate", () => {
  it("tombstones the template and queues a delete operation", async () => {
    const createdAt = new Date("2026-03-02T10:00:00.000Z");
    const deletedAt = new Date("2026-03-02T12:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });
    const templates = new InMemoryTransactionTemplateRepository([
      createTransactionTemplate(
        {
          id: "tpl-1",
          name: "Arriendo",
          accountId: "acc-main",
          amount: createMoney(-900000, "COP"),
          categoryId: "home",
          createdAt,
        },
        account,
      ),
    ]);

    const result = await deleteTransactionTemplate(
      {
        templates,
        recurringRules: new InMemoryRecurringRuleRepository(),
        outbox: new InMemoryOutboxRepository(),
        clock: new FixedClock(deletedAt),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        templateId: "tpl-1",
      },
    );

    expect(result.template.deletedAt?.toISOString()).toBe("2026-03-02T12:00:00.000Z");
  });

  it("fails when the template is still used by an active recurring rule", async () => {
    const now = new Date("2026-03-02T10:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    await expect(
      deleteTransactionTemplate(
        {
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
          recurringRules: new InMemoryRecurringRuleRepository([
            createRecurringRule({
              id: "rr-1",
              templateId: "tpl-1",
              schedule: {
                frequency: "monthly",
                interval: 1,
                dayOfMonth: 5,
              },
              startsOn: new Date("2026-03-05T00:00:00.000Z"),
              createdAt: now,
            }),
          ]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-1"]),
          deviceId: "web-device-1",
        },
        {
          templateId: "tpl-1",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
