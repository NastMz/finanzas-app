import { describe, expect, it } from "vitest";

import { createAccount, createMoney, createTransaction } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryOutboxRepository,
  InMemoryTransactionRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { deleteTransaction } from "./delete-transaction.js";

describe("deleteTransaction", () => {
  it("marks the transaction as deleted and queues an outbox operation", async () => {
    const createdAt = new Date("2026-03-02T14:00:00.000Z");
    const deletedAt = new Date("2026-03-02T15:00:00.000Z");
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
        note: "almuerzo",
        tags: ["food"],
        createdAt,
        updatedAt: createdAt,
      },
      account,
    );

    const transactions = new InMemoryTransactionRepository([transaction]);
    const outbox = new InMemoryOutboxRepository();

    const result = await deleteTransaction(
      {
        transactions,
        outbox,
        clock: new FixedClock(deletedAt),
        ids: new SequenceIdGenerator(["op-1"]),
        deviceId: "web-device-1",
      },
      {
        transactionId: transaction.id,
      },
    );

    expect(result.outboxOpId).toBe("op-1");
    expect(result.transaction.deletedAt?.toISOString()).toBe(deletedAt.toISOString());

    const storedTransaction = await transactions.findById("tx-1");
    expect(storedTransaction?.deletedAt?.toISOString()).toBe(deletedAt.toISOString());

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.opType).toBe("delete");
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "tx-1",
      deletedAt: deletedAt.toISOString(),
    });
  });

  it("fails when transaction does not exist", async () => {
    await expect(
      deleteTransaction(
        {
          transactions: new InMemoryTransactionRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-02T15:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-missing"]),
          deviceId: "web-device-1",
        },
        {
          transactionId: "unknown-transaction",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when transaction is already deleted", async () => {
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
      ...transaction,
      deletedAt: new Date("2026-03-02T15:00:00.000Z"),
      updatedAt: new Date("2026-03-02T15:00:00.000Z"),
    };

    await expect(
      deleteTransaction(
        {
          transactions: new InMemoryTransactionRepository([deletedTransaction]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(new Date("2026-03-02T16:00:00.000Z")),
          ids: new SequenceIdGenerator(["op-duplicate"]),
          deviceId: "web-device-1",
        },
        {
          transactionId: "tx-1",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
