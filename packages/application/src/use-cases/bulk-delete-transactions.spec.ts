import { describe, expect, it } from "vitest";

import { createAccount, createMoney, createTransaction } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryOutboxRepository,
  InMemoryTransactionRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { bulkDeleteTransactions } from "./bulk-delete-transactions.js";

describe("bulkDeleteTransactions", () => {
  it("tombstones selected transactions and queues one delete op per movement", async () => {
    const createdAt = new Date("2026-03-02T14:00:00.000Z");
    const deletedAt = new Date("2026-03-02T15:00:00.000Z");
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
            createdAt,
          },
          account,
        ),
        version: 3,
      },
      createTransaction(
        {
          id: "tx-2",
          accountId: account.id,
          amount: createMoney(-50000, "COP"),
          date: createdAt,
          categoryId: "transport",
          createdAt,
        },
        account,
      ),
    ]);
    const outbox = new InMemoryOutboxRepository();

    const result = await bulkDeleteTransactions(
      {
        transactions,
        outbox,
        clock: new FixedClock(deletedAt),
        ids: new SequenceIdGenerator(["op-1", "op-2"]),
        deviceId: "web-device-1",
      },
      {
        transactionIds: ["tx-1", "tx-2", "tx-2"],
      },
    );

    expect(result.outboxOpIds).toEqual(["op-1", "op-2"]);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]?.version).toBe(3);
    expect(result.transactions.every((transaction) => transaction.deletedAt !== null)).toBe(true);

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(2);
    expect(pendingOps.map((operation) => operation.opType)).toEqual([
      "delete",
      "delete",
    ]);
    expect(pendingOps[0]?.baseVersion).toBe(3);
  });

  it("fails when no transaction ids are provided", async () => {
    await expect(
      bulkDeleteTransactions(
        {
          transactions: new InMemoryTransactionRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-02T15:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-empty"]),
          deviceId: "web-device-1",
        },
        {
          transactionIds: [],
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails atomically when one selected transaction is already deleted", async () => {
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
    const deletedTransaction = {
      ...createTransaction(
        {
          id: "tx-2",
          accountId: account.id,
          amount: createMoney(-50000, "COP"),
          date: createdAt,
          categoryId: "transport",
          createdAt,
        },
        account,
      ),
      deletedAt: new Date("2026-03-02T15:00:00.000Z"),
      updatedAt: new Date("2026-03-02T15:00:00.000Z"),
    };

    const transactions = new InMemoryTransactionRepository([
      transaction,
      deletedTransaction,
    ]);
    const outbox = new InMemoryOutboxRepository();

    await expect(
      bulkDeleteTransactions(
        {
          transactions,
          outbox,
          clock: new FixedClock(new Date("2026-03-02T16:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-invalid"]),
          deviceId: "web-device-1",
        },
        {
          transactionIds: ["tx-1", "tx-2"],
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);

    const storedTransaction = await transactions.findById("tx-1");
    expect(storedTransaction?.deletedAt).toBeNull();
    expect((await outbox.listPending())).toHaveLength(0);
  });
});
