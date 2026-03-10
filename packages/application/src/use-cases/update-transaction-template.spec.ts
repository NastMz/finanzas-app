import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createTransactionTemplate,
} from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryTransactionTemplateRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { updateTransactionTemplate } from "./update-transaction-template.js";

describe("updateTransactionTemplate", () => {
  it("updates the template and queues an outbox operation", async () => {
    const createdAt = new Date("2026-03-02T10:00:00.000Z");
    const updatedAt = new Date("2026-03-02T12:00:00.000Z");
    const accounts = new InMemoryAccountRepository([
      createAccount({
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        createdAt,
      }),
    ]);
    const mainAccount = await accounts.findById("acc-main");
    if (!mainAccount) {
      throw new Error("Account not found");
    }
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
        mainAccount,
      ),
    ]);
    const outbox = new InMemoryOutboxRepository();

    const result = await updateTransactionTemplate(
      {
        accounts,
        templates,
        outbox,
        clock: new FixedClock(updatedAt),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        templateId: "tpl-1",
        name: "Arriendo hogar",
        tags: ["hogar", "mensual"],
      },
    );

    expect(result.template.name).toBe("Arriendo hogar");
    expect(result.template.tags).toEqual(["hogar", "mensual"]);

    const pendingOps = await outbox.listPending();
    expect(pendingOps[0]?.entityType).toBe("transaction-template");
    expect(pendingOps[0]?.opType).toBe("update");
  });

  it("fails when no fields are provided", async () => {
    const now = new Date("2026-03-02T10:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    await expect(
      updateTransactionTemplate(
        {
          accounts: new InMemoryAccountRepository([account]),
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
