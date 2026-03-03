import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createTransaction,
  DomainError,
} from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryTransactionRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { updateTransaction } from "./update-transaction.js";

describe("updateTransaction", () => {
  it("updates the transaction and queues an outbox operation", async () => {
    const createdAt = new Date("2026-03-02T14:00:00.000Z");
    const updatedAt = new Date("2026-03-02T15:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });

    const transaction = {
      ...createTransaction(
        {
          id: "tx-1",
          accountId: account.id,
          amount: createMoney(-150000, "COP"),
          date: createdAt,
          categoryId: "food",
          note: "almuerzo",
          tags: ["food"],
          createdAt,
          updatedAt: createdAt,
        },
        account,
      ),
      version: 9,
    };

    const accounts = new InMemoryAccountRepository([account]);
    const transactions = new InMemoryTransactionRepository([transaction]);
    const outbox = new InMemoryOutboxRepository();

    const result = await updateTransaction(
      {
        accounts,
        transactions,
        outbox,
        clock: new FixedClock(updatedAt),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        transactionId: "tx-1",
        amountMinor: -175000,
        categoryId: "food-drink",
        note: "almuerzo y cafe",
        tags: ["Food", "Cafe", "food"],
      },
    );

    expect(result.outboxOpId).toBe("op-1");
    expect(result.transaction.amount.amountMinor).toBe(-175000n);
    expect(result.transaction.categoryId).toBe("food-drink");
    expect(result.transaction.note).toBe("almuerzo y cafe");
    expect(result.transaction.tags).toEqual(["food", "cafe"]);
    expect(result.transaction.updatedAt.toISOString()).toBe(updatedAt.toISOString());

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("transaction");
    expect(pendingOps[0]?.opType).toBe("update");
    expect(pendingOps[0]?.baseVersion).toBe(9);
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "tx-1",
      amountMinor: "-175000",
      categoryId: "food-drink",
      note: "almuerzo y cafe",
      tags: ["food", "cafe"],
    });
  });

  it("fails when transaction does not exist", async () => {
    const now = new Date("2026-03-02T15:00:00.000Z");

    await expect(
      updateTransaction(
        {
          accounts: new InMemoryAccountRepository(),
          transactions: new InMemoryTransactionRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-missing"]),
          deviceId: "web-device-1",
        },
        {
          transactionId: "tx-missing",
          note: "nota",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when no mutable fields are provided", async () => {
    const createdAt = new Date("2026-03-02T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });

    const transaction = createTransaction(
      {
        id: "tx-1",
        accountId: account.id,
        amount: createMoney(-150000, "COP"),
        date: createdAt,
        categoryId: "food",
        createdAt,
      },
      account,
    );

    await expect(
      updateTransaction(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository([transaction]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-02T15:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-empty"]),
          deviceId: "web-device-1",
        },
        {
          transactionId: "tx-1",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when updated currency does not match account currency", async () => {
    const createdAt = new Date("2026-03-02T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });

    const transaction = createTransaction(
      {
        id: "tx-1",
        accountId: account.id,
        amount: createMoney(-150000, "COP"),
        date: createdAt,
        categoryId: "food",
        createdAt,
      },
      account,
    );

    await expect(
      updateTransaction(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository([transaction]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-02T15:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-currency"]),
          deviceId: "web-device-1",
        },
        {
          transactionId: "tx-1",
          currency: "USD",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
