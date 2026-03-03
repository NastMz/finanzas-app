import { describe, expect, it } from "vitest";

import { createAccount, createMoney, createTransaction } from "@finanzas/domain";
import {
  InMemoryAccountRepository,
  InMemoryTransactionRepository,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { listTransactions } from "./list-transactions.js";

describe("listTransactions", () => {
  it("lists transactions for an account excluding tombstones by default", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const earlier = new Date("2026-03-02T10:00:00.000Z");

    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    const anotherAccount = createAccount({
      id: "acc-other",
      name: "Otra cuenta",
      type: "cash",
      currency: "COP",
      createdAt: now,
    });

    const transaction1 = createTransaction(
      {
        id: "tx-1",
        accountId: account.id,
        amount: createMoney(-2000, "COP"),
        date: now,
        categoryId: "food",
        createdAt: now,
      },
      account,
    );

    const transaction2 = createTransaction(
      {
        id: "tx-2",
        accountId: account.id,
        amount: createMoney(-1000, "COP"),
        date: earlier,
        categoryId: "groceries",
        createdAt: earlier,
      },
      account,
    );

    const deletedTransaction = {
      ...createTransaction(
        {
          id: "tx-deleted",
          accountId: account.id,
          amount: createMoney(-5000, "COP"),
          date: now,
          categoryId: "other",
          createdAt: now,
        },
        account,
      ),
      updatedAt: now,
      deletedAt: now,
    };

    const otherAccountTransaction = createTransaction(
      {
        id: "tx-other",
        accountId: anotherAccount.id,
        amount: createMoney(-999, "COP"),
        date: now,
        categoryId: "other",
        createdAt: now,
      },
      anotherAccount,
    );

    const accounts = new InMemoryAccountRepository([account, anotherAccount]);
    const transactions = new InMemoryTransactionRepository([
      transaction2,
      otherAccountTransaction,
      transaction1,
      deletedTransaction,
    ]);

    const result = await listTransactions(
      {
        accounts,
        transactions,
      },
      {
        accountId: account.id,
      },
    );

    expect(result.transactions.map((transaction) => transaction.id)).toEqual([
      "tx-1",
      "tx-2",
    ]);
  });

  it("includes tombstones when includeDeleted is true", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    const activeTransaction = createTransaction(
      {
        id: "tx-active",
        accountId: account.id,
        amount: createMoney(-2000, "COP"),
        date: now,
        categoryId: "food",
        createdAt: now,
      },
      account,
    );

    const deletedTransaction = {
      ...createTransaction(
        {
          id: "tx-deleted",
          accountId: account.id,
          amount: createMoney(-5000, "COP"),
          date: now,
          categoryId: "other",
          createdAt: now,
        },
        account,
      ),
      updatedAt: now,
      deletedAt: now,
    };

    const accounts = new InMemoryAccountRepository([account]);
    const transactions = new InMemoryTransactionRepository([
      activeTransaction,
      deletedTransaction,
    ]);

    const result = await listTransactions(
      {
        accounts,
        transactions,
      },
      {
        accountId: account.id,
        includeDeleted: true,
      },
    );

    expect(result.transactions.map((transaction) => transaction.id)).toEqual([
      "tx-active",
      "tx-deleted",
    ]);
  });

  it("fails when account does not exist", async () => {
    await expect(
      listTransactions(
        {
          accounts: new InMemoryAccountRepository(),
          transactions: new InMemoryTransactionRepository(),
        },
        {
          accountId: "unknown-account",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});

