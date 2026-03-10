import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createTransaction,
  createTransactionTemplate,
  DomainError,
} from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionTemplateRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { updateAccount } from "./update-account.js";

describe("updateAccount", () => {
  it("updates the account and queues an outbox operation", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingAccount = {
      ...createAccount({
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        createdAt,
      }),
      version: 7,
    };

    const accounts = new InMemoryAccountRepository([existingAccount]);
    const outbox = new InMemoryOutboxRepository();

    const result = await updateAccount(
      {
        accounts,
        transactions: new InMemoryTransactionRepository(),
        templates: new InMemoryTransactionTemplateRepository(),
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        accountId: "acc-main",
        name: "Cuenta principal editada",
        type: "cash",
      },
    );

    expect(result.account.name).toBe("Cuenta principal editada");
    expect(result.account.type).toBe("cash");
    expect(result.outboxOpId).toBe("op-1");

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("account");
    expect(pendingOps[0]?.opType).toBe("update");
    expect(pendingOps[0]?.baseVersion).toBe(7);
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "acc-main",
      name: "Cuenta principal editada",
      type: "cash",
    });
  });

  it("fails when account does not exist", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      updateAccount(
        {
          accounts: new InMemoryAccountRepository(),
          transactions: new InMemoryTransactionRepository(),
          templates: new InMemoryTransactionTemplateRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-missing"]),
          deviceId: "web-device-1",
        },
        {
          accountId: "acc-missing",
          name: "Cuenta editada",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when updated account currency is invalid", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingAccount = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });

    await expect(
      updateAccount(
        {
          accounts: new InMemoryAccountRepository([existingAccount]),
          transactions: new InMemoryTransactionRepository(),
          templates: new InMemoryTransactionTemplateRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-invalid"]),
          deviceId: "web-device-1",
        },
        {
          accountId: "acc-main",
          currency: "INVALID",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("fails when changing account currency with transaction history", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingAccount = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });

    await expect(
      updateAccount(
        {
          accounts: new InMemoryAccountRepository([existingAccount]),
          transactions: new InMemoryTransactionRepository([
            createTransaction(
              {
                id: "tx-1",
                accountId: existingAccount.id,
                amount: createMoney(-1000, "COP"),
                date: now,
                categoryId: "food",
                createdAt: now,
              },
              existingAccount,
            ),
          ]),
          templates: new InMemoryTransactionTemplateRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-currency-history"]),
          deviceId: "web-device-1",
        },
        {
          accountId: "acc-main",
          currency: "USD",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when changing account currency with transaction templates", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingAccount = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });

    await expect(
      updateAccount(
        {
          accounts: new InMemoryAccountRepository([existingAccount]),
          transactions: new InMemoryTransactionRepository(),
          templates: new InMemoryTransactionTemplateRepository([
            createTransactionTemplate(
              {
                id: "tpl-1",
                name: "Arriendo",
                accountId: existingAccount.id,
                amount: createMoney(-1000, "COP"),
                categoryId: "home",
                createdAt: now,
              },
              existingAccount,
            ),
          ]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-currency-template"]),
          deviceId: "web-device-1",
        },
        {
          accountId: "acc-main",
          currency: "USD",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
