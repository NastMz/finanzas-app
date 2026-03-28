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
      "tx-deleted",
      "tx-active",
    ]);
    expect(result.page.hasMore).toBe(false);
    expect(result.appliedFilters.accountId).toBe(account.id);
  });

  it("supports all-accounts review with explicit filters", async () => {
    const now = new Date("2026-03-05T14:00:00.000Z");
    const earlier = new Date("2026-03-04T14:00:00.000Z");
    const accountA = createAccount({
      id: "acc-a",
      name: "A",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });
    const accountB = createAccount({
      id: "acc-b",
      name: "B",
      type: "cash",
      currency: "USD",
      createdAt: now,
    });
    const transactions = new InMemoryTransactionRepository([
      createTransaction(
        {
          id: "tx-b",
          accountId: accountB.id,
          amount: createMoney(-3000, "USD"),
          date: now,
          categoryId: "food",
          createdAt: now,
        },
        accountB,
      ),
      createTransaction(
        {
          id: "tx-a",
          accountId: accountA.id,
          amount: createMoney(-2000, "COP"),
          date: earlier,
          categoryId: "food",
          createdAt: earlier,
        },
        accountA,
      ),
    ]);

    const result = await listTransactions(
      {
        accounts: new InMemoryAccountRepository([accountA, accountB]),
        transactions,
      },
      {
        filters: {
          accountId: null,
          categoryId: "food",
          includeDeleted: false,
          dateRange: {
            from: null,
            to: null,
          },
        },
        page: {
          limit: 10,
          continuation: null,
        },
      },
    );

    expect(result.transactions.map((transaction) => transaction.id)).toEqual(["tx-b", "tx-a"]);
    expect(result.appliedFilters.accountId).toBeNull();
  });

  it("keeps deterministic ordering with date and creation ties", async () => {
    const now = new Date("2026-03-05T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });
    const sameDate = new Date("2026-03-05T08:00:00.000Z");
    const sameCreatedAt = new Date("2026-03-05T12:00:00.000Z");

    const transactions = new InMemoryTransactionRepository([
      createTransaction(
        {
          id: "tx-2",
          accountId: account.id,
          amount: createMoney(-1000, "COP"),
          date: sameDate,
          categoryId: "food",
          createdAt: sameCreatedAt,
        },
        account,
      ),
      createTransaction(
        {
          id: "tx-1",
          accountId: account.id,
          amount: createMoney(-2000, "COP"),
          date: sameDate,
          categoryId: "food",
          createdAt: sameCreatedAt,
        },
        account,
      ),
    ]);

    const result = await listTransactions(
      {
        accounts: new InMemoryAccountRepository([account]),
        transactions,
      },
      {
        filters: {
          accountId: account.id,
          categoryId: null,
          includeDeleted: false,
          dateRange: {
            from: null,
            to: null,
          },
        },
        page: {
          limit: 10,
          continuation: null,
        },
      },
    );

    expect(result.transactions.map((transaction) => transaction.id)).toEqual(["tx-2", "tx-1"]);
  });

  it("returns bounded pages with a continuation token", async () => {
    const now = new Date("2026-03-05T14:00:00.000Z");
    const earlier = new Date("2026-03-04T14:00:00.000Z");
    const oldest = new Date("2026-03-03T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });
    const transactions = new InMemoryTransactionRepository([
      createTransaction(
        {
          id: "tx-3",
          accountId: account.id,
          amount: createMoney(-3000, "COP"),
          date: oldest,
          categoryId: "food",
          createdAt: oldest,
        },
        account,
      ),
      createTransaction(
        {
          id: "tx-2",
          accountId: account.id,
          amount: createMoney(-2000, "COP"),
          date: earlier,
          categoryId: "food",
          createdAt: earlier,
        },
        account,
      ),
      createTransaction(
        {
          id: "tx-1",
          accountId: account.id,
          amount: createMoney(-1000, "COP"),
          date: now,
          categoryId: "food",
          createdAt: now,
        },
        account,
      ),
    ]);

    const firstPage = await listTransactions(
      {
        accounts: new InMemoryAccountRepository([account]),
        transactions,
      },
      {
        filters: {
          accountId: account.id,
          categoryId: null,
          includeDeleted: false,
          dateRange: {
            from: null,
            to: null,
          },
        },
        page: {
          limit: 2,
          continuation: null,
        },
      },
    );

    expect(firstPage.transactions.map((transaction) => transaction.id)).toEqual(["tx-1", "tx-2"]);
    expect(firstPage.page.hasMore).toBe(true);
    expect(firstPage.page.nextContinuation).not.toBeNull();

    const secondPage = await listTransactions(
      {
        accounts: new InMemoryAccountRepository([account]),
        transactions,
      },
      {
        filters: firstPage.appliedFilters,
        page: {
          limit: firstPage.page.limit,
          continuation: firstPage.page.nextContinuation,
        },
      },
    );

    expect(secondPage.transactions.map((transaction) => transaction.id)).toEqual(["tx-3"]);
    expect(secondPage.page.hasMore).toBe(false);
  });

  it("rejects continuations that do not match the active filters", async () => {
    const now = new Date("2026-03-05T14:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    await expect(
      listTransactions(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository(),
        },
        {
          filters: {
            accountId: account.id,
            categoryId: null,
            includeDeleted: false,
            dateRange: {
              from: null,
              to: null,
            },
          },
          page: {
            limit: 2,
            continuation: {
              filterFingerprint: "wrong",
              lastItem: {
                date: now.toISOString(),
                createdAt: now.toISOString(),
                id: "tx-1",
              },
            },
          },
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
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

  it("fails when stored transaction currency does not match the account currency", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    const inconsistentTransaction = {
      ...createTransaction(
        {
          id: "tx-1",
          accountId: account.id,
          amount: createMoney(-2000, "COP"),
          date: now,
          categoryId: "food",
          createdAt: now,
        },
        account,
      ),
      amount: createMoney(-2000, "USD"),
    };

    await expect(
      listTransactions(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository([inconsistentTransaction]),
        },
        {
          accountId: account.id,
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
