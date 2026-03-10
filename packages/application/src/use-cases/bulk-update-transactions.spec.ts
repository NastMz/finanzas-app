import { describe, expect, it } from "vitest";

import { createAccount, createMoney, createTransaction } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryTransactionRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { bulkUpdateTransactions } from "./bulk-update-transactions.js";

describe("bulkUpdateTransactions", () => {
  it("updates selected transactions and queues one outbox operation per movement", async () => {
    const createdAt = new Date("2026-03-02T14:00:00.000Z");
    const updatedAt = new Date("2026-03-02T15:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt,
    });

    const transactions = new InMemoryTransactionRepository([
      {
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
          },
          account,
        ),
        version: 4,
      },
      createTransaction(
        {
          id: "tx-2",
          accountId: account.id,
          amount: createMoney(-50000, "COP"),
          date: createdAt,
          categoryId: "transport",
          tags: ["bus"],
          createdAt,
        },
        account,
      ),
    ]);
    const outbox = new InMemoryOutboxRepository();

    const result = await bulkUpdateTransactions(
      {
        accounts: new InMemoryAccountRepository([account]),
        transactions,
        outbox,
        clock: new FixedClock(updatedAt),
        ids: new SequenceIdGenerator(["op-1", "op-2"]),
        deviceId: "web-device-1",
      },
      {
        transactionIds: ["tx-1", "tx-2", "tx-1"],
        categoryId: "food-drink",
        note: "recategorizado",
        tags: ["Food", "Cafe", "food"],
      },
    );

    expect(result.outboxOpIds).toEqual(["op-1", "op-2"]);
    expect(result.transactions.map((transaction) => transaction.id)).toEqual([
      "tx-1",
      "tx-2",
    ]);
    expect(result.transactions[0]?.version).toBe(4);
    expect(result.transactions.every((transaction) => transaction.categoryId === "food-drink")).toBe(
      true,
    );
    expect(result.transactions.every((transaction) => transaction.note === "recategorizado")).toBe(
      true,
    );
    expect(result.transactions.every((transaction) => transaction.tags.join(",") === "food,cafe")).toBe(
      true,
    );

    const storedTransaction = await transactions.findById("tx-2");
    expect(storedTransaction?.updatedAt.toISOString()).toBe(updatedAt.toISOString());

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(2);
    expect(pendingOps.map((operation) => operation.opType)).toEqual([
      "update",
      "update",
    ]);
    expect(pendingOps[0]?.baseVersion).toBe(4);
    expect(pendingOps[1]?.payload).toMatchObject({
      id: "tx-2",
      categoryId: "food-drink",
      note: "recategorizado",
      tags: ["food", "cafe"],
    });
  });

  it("fails when no transaction ids are provided", async () => {
    await expect(
      bulkUpdateTransactions(
        {
          accounts: new InMemoryAccountRepository(),
          transactions: new InMemoryTransactionRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-02T15:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-empty"]),
          deviceId: "web-device-1",
        },
        {
          transactionIds: [],
          categoryId: "food",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails atomically when one selected transaction is invalid", async () => {
    const createdAt = new Date("2026-03-02T14:00:00.000Z");
    const updatedAt = new Date("2026-03-02T15:00:00.000Z");
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

    const transactions = new InMemoryTransactionRepository([transaction]);
    const outbox = new InMemoryOutboxRepository();

    await expect(
      bulkUpdateTransactions(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions,
          outbox,
          clock: new FixedClock(updatedAt),
          ids: new SequenceIdGenerator(["op-invalid"]),
          deviceId: "web-device-1",
        },
        {
          transactionIds: ["tx-1", "tx-missing"],
          categoryId: "food-drink",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);

    const storedTransaction = await transactions.findById("tx-1");
    expect(storedTransaction?.categoryId).toBe("food");
    expect((await outbox.listPending())).toHaveLength(0);
  });
});
