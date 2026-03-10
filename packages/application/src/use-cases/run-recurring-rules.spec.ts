import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createRecurringRule,
  createTransactionTemplate,
} from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryRecurringRuleRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionTemplateRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { runRecurringRules } from "./run-recurring-rules.js";

describe("runRecurringRules", () => {
  it("generates due transactions and advances the rule", async () => {
    const now = new Date("2026-03-10T12:00:00.000Z");
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
    const recurringRule = createRecurringRule({
      id: "rr-1",
      templateId: "tpl-1",
      schedule: {
        frequency: "monthly",
        interval: 1,
        dayOfMonth: 5,
      },
      startsOn: new Date("2026-01-01T00:00:00.000Z"),
      createdAt: now,
    });

    const result = await runRecurringRules(
      {
        accounts: new InMemoryAccountRepository([account]),
        transactions: new InMemoryTransactionRepository(),
        templates: new InMemoryTransactionTemplateRepository([template]),
        recurringRules: new InMemoryRecurringRuleRepository([recurringRule]),
        outbox: new InMemoryOutboxRepository(),
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator([
          "tx-1",
          "op-1",
          "tx-2",
          "op-2",
          "tx-3",
          "op-3",
          "op-4",
        ]),
        deviceId: "web-device-1",
      },
      {
        asOf: new Date("2026-03-10T12:00:00.000Z"),
      },
    );

    expect(result.generatedTransactions.map((transaction) => transaction.id)).toEqual([
      "tx-1",
      "tx-2",
      "tx-3",
    ]);
    expect(result.generatedTransactions.map((transaction) => transaction.date.toISOString())).toEqual([
      "2026-01-05T00:00:00.000Z",
      "2026-02-05T00:00:00.000Z",
      "2026-03-05T00:00:00.000Z",
    ]);
    expect(result.updatedRecurringRules[0]?.nextRunOn.toISOString()).toBe(
      "2026-04-05T00:00:00.000Z",
    );
    expect(result.recurringRuleOutboxOpIds).toEqual(["op-4"]);
  });

  it("skips inactive rules", async () => {
    const now = new Date("2026-03-10T12:00:00.000Z");

    const result = await runRecurringRules(
      {
        accounts: new InMemoryAccountRepository([
          createAccount({
            id: "acc-main",
            name: "Cuenta principal",
            type: "bank",
            currency: "COP",
            createdAt: now,
          }),
        ]),
        transactions: new InMemoryTransactionRepository(),
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
            isActive: false,
            createdAt: now,
          }),
        ]),
        outbox: new InMemoryOutboxRepository(),
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["tx-1", "op-1"]),
        deviceId: "web-device-1",
      },
      {
        asOf: now,
      },
    );

    expect(result.generatedTransactions).toEqual([]);
    expect(result.updatedRecurringRules).toEqual([]);
  });
});
