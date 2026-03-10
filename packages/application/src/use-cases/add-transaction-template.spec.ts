import { describe, expect, it } from "vitest";

import { DomainError, createAccount } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryTransactionTemplateRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { addTransactionTemplate } from "./add-transaction-template.js";

describe("addTransactionTemplate", () => {
  it("stores the template and queues an outbox operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const accounts = new InMemoryAccountRepository([
      createAccount({
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        createdAt: now,
      }),
    ]);
    const templates = new InMemoryTransactionTemplateRepository();
    const outbox = new InMemoryOutboxRepository();

    const result = await addTransactionTemplate(
      {
        accounts,
        templates,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["tpl-1", "op-1"]),
        deviceId: "web-device-1",
      },
      {
        name: "Arriendo",
        accountId: "acc-main",
        amountMinor: -900000,
        currency: "COP",
        categoryId: "home",
        tags: ["hogar"],
      },
    );

    expect(result.template.id).toBe("tpl-1");
    expect(result.template.tags).toEqual(["hogar"]);
    expect(result.outboxOpId).toBe("op-1");

    const storedTemplate = await templates.findById("tpl-1");
    expect(storedTemplate?.name).toBe("Arriendo");

    const pendingOps = await outbox.listPending();
    expect(pendingOps[0]?.entityType).toBe("transaction-template");
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "tpl-1",
      name: "Arriendo",
      accountId: "acc-main",
    });
  });

  it("fails when account does not exist", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addTransactionTemplate(
        {
          accounts: new InMemoryAccountRepository(),
          templates: new InMemoryTransactionTemplateRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["tpl-1", "op-1"]),
          deviceId: "web-device-1",
        },
        {
          name: "Arriendo",
          accountId: "acc-missing",
          amountMinor: -900000,
          currency: "COP",
          categoryId: "home",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when the amount is invalid", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addTransactionTemplate(
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
          templates: new InMemoryTransactionTemplateRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["tpl-1", "op-1"]),
          deviceId: "web-device-1",
        },
        {
          name: "Arriendo",
          accountId: "acc-main",
          amountMinor: 0,
          currency: "COP",
          categoryId: "home",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
