import { describe, expect, it } from "vitest";

import { createAccount, DomainError } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryTransactionRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { addTransaction } from "./add-transaction.js";

describe("addTransaction", () => {
  it("stores the transaction and queues an outbox operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    const accounts = new InMemoryAccountRepository([account]);
    const transactions = new InMemoryTransactionRepository();
    const outbox = new InMemoryOutboxRepository();

    const result = await addTransaction(
      {
        accounts,
        transactions,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["tx-1", "op-1"]),
        deviceId: "web-device-1",
      },
      {
        accountId: account.id,
        amountMinor: -150000,
        currency: "COP",
        date: now,
        categoryId: "food",
        note: "almuerzo",
        tags: ["Food", "food", "Lunch"],
      },
    );

    expect(result.transaction.id).toBe("tx-1");
    expect(result.outboxOpId).toBe("op-1");

    const storedTransaction = await transactions.findById("tx-1");
    expect(storedTransaction?.tags).toEqual(["food", "lunch"]);

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.payload).toMatchObject({
      amountMinor: "-150000",
      currency: "COP",
    });
  });

  it("fails when account does not exist", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addTransaction(
        {
          accounts: new InMemoryAccountRepository(),
          transactions: new InMemoryTransactionRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["tx-missing", "op-missing"]),
          deviceId: "web-device-1",
        },
        {
          accountId: "unknown-account",
          amountMinor: -10000,
          currency: "COP",
          date: now,
          categoryId: "groceries",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when transaction currency differs from account currency", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    await expect(
      addTransaction(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["tx-currency", "op-currency"]),
          deviceId: "web-device-1",
        },
        {
          accountId: account.id,
          amountMinor: -10000,
          currency: "USD",
          date: now,
          categoryId: "groceries",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
