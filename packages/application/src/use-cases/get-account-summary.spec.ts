import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createTransaction,
  type Account,
  type Transaction,
} from "@finanzas/domain";
import {
  InMemoryAccountRepository,
  InMemoryTransactionRepository,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { getAccountSummary } from "./get-account-summary.js";

describe("getAccountSummary", () => {
  it("builds period totals, top categories and recent transactions", async () => {
    const account = createTestAccount();
    const transactions = createTestTransactions(account.id);

    const result = await getAccountSummary(
      {
        accounts: new InMemoryAccountRepository([account]),
        transactions: new InMemoryTransactionRepository(transactions),
      },
      {
        accountId: account.id,
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-03-31T23:59:59.999Z"),
      },
    );

    expect(result.accountId).toBe(account.id);
    expect(result.currency).toBe("COP");
    expect(result.transactionCount).toBe(4);
    expect(result.totals).toEqual({
      incomeMinor: 500000n,
      expenseMinor: 200000n,
      netMinor: 300000n,
    });
    expect(result.topExpenseCategories).toEqual([
      {
        categoryId: "food",
        expenseMinor: 150000n,
      },
      {
        categoryId: "transport",
        expenseMinor: 50000n,
      },
    ]);
    expect(result.recentTransactions.map((transaction) => transaction.id)).toEqual([
      "tx-3",
      "tx-2",
      "tx-4",
      "tx-1",
    ]);
  });

  it("includes tombstones and supports custom limits", async () => {
    const account = createTestAccount();
    const transactions = createTestTransactions(account.id);

    const result = await getAccountSummary(
      {
        accounts: new InMemoryAccountRepository([account]),
        transactions: new InMemoryTransactionRepository(transactions),
      },
      {
        accountId: account.id,
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-03-31T23:59:59.999Z"),
        includeDeleted: true,
        recentLimit: 2,
        topCategoriesLimit: 1,
      },
    );

    expect(result.transactionCount).toBe(5);
    expect(result.totals).toEqual({
      incomeMinor: 500000n,
      expenseMinor: 220000n,
      netMinor: 280000n,
    });
    expect(result.topExpenseCategories).toEqual([
      {
        categoryId: "food",
        expenseMinor: 170000n,
      },
    ]);
    expect(result.recentTransactions.map((transaction) => transaction.id)).toEqual([
      "tx-6",
      "tx-3",
    ]);
  });

  it("fails when account does not exist", async () => {
    await expect(
      getAccountSummary(
        {
          accounts: new InMemoryAccountRepository(),
          transactions: new InMemoryTransactionRepository(),
        },
        {
          accountId: "acc-missing",
          from: new Date("2026-03-01T00:00:00.000Z"),
          to: new Date("2026-03-31T23:59:59.999Z"),
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails with invalid date range", async () => {
    const account = createTestAccount();

    await expect(
      getAccountSummary(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository(),
        },
        {
          accountId: account.id,
          from: new Date("2026-04-01T00:00:00.000Z"),
          to: new Date("2026-03-31T23:59:59.999Z"),
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails with invalid summary limits", async () => {
    const account = createTestAccount();

    await expect(
      getAccountSummary(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository(),
        },
        {
          accountId: account.id,
          from: new Date("2026-03-01T00:00:00.000Z"),
          to: new Date("2026-03-31T23:59:59.999Z"),
          recentLimit: -1,
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);

    await expect(
      getAccountSummary(
        {
          accounts: new InMemoryAccountRepository([account]),
          transactions: new InMemoryTransactionRepository(),
        },
        {
          accountId: account.id,
          from: new Date("2026-03-01T00:00:00.000Z"),
          to: new Date("2026-03-31T23:59:59.999Z"),
          topCategoriesLimit: 2.5,
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});

const createTestAccount = (): Account =>
  createAccount({
    id: "acc-main",
    name: "Cuenta principal",
    type: "bank",
    currency: "COP",
    createdAt: new Date("2026-03-01T08:00:00.000Z"),
  });

const createTestTransactions = (accountId: string): Transaction[] => [
  createTransactionFixture({
    id: "tx-1",
    accountId,
    amountMinor: 500000,
    categoryId: "income",
    date: "2026-03-01T10:00:00.000Z",
    createdAt: "2026-03-01T10:00:00.000Z",
  }),
  createTransactionFixture({
    id: "tx-2",
    accountId,
    amountMinor: -120000,
    categoryId: "food",
    date: "2026-03-03T10:00:00.000Z",
    createdAt: "2026-03-03T09:00:00.000Z",
  }),
  createTransactionFixture({
    id: "tx-3",
    accountId,
    amountMinor: -50000,
    categoryId: "transport",
    date: "2026-03-03T10:00:00.000Z",
    createdAt: "2026-03-03T10:00:00.000Z",
  }),
  createTransactionFixture({
    id: "tx-4",
    accountId,
    amountMinor: -30000,
    categoryId: "food",
    date: "2026-03-02T10:00:00.000Z",
    createdAt: "2026-03-02T10:00:00.000Z",
  }),
  createTransactionFixture({
    id: "tx-5",
    accountId,
    amountMinor: -9999,
    categoryId: "food",
    date: "2026-02-25T10:00:00.000Z",
    createdAt: "2026-02-25T10:00:00.000Z",
  }),
  createDeletedTransactionFixture({
    id: "tx-6",
    accountId,
    amountMinor: -20000,
    categoryId: "food",
    date: "2026-03-03T10:00:00.000Z",
    createdAt: "2026-03-03T12:00:00.000Z",
    deletedAt: "2026-03-03T12:30:00.000Z",
  }),
];

interface TransactionFixtureInput {
  id: string;
  accountId: string;
  amountMinor: number;
  categoryId: string;
  date: string;
  createdAt: string;
}

const createTransactionFixture = (
  input: TransactionFixtureInput,
): Transaction =>
  createTransaction(
    {
      id: input.id,
      accountId: input.accountId,
      amount: createMoney(input.amountMinor, "COP"),
      date: new Date(input.date),
      categoryId: input.categoryId,
      createdAt: new Date(input.createdAt),
    },
    createTestAccount(),
  );

interface DeletedTransactionFixtureInput extends TransactionFixtureInput {
  deletedAt: string;
}

const createDeletedTransactionFixture = (
  input: DeletedTransactionFixtureInput,
): Transaction => {
  const transaction = createTransactionFixture(input);
  const deletedAt = new Date(input.deletedAt);

  return {
    ...transaction,
    updatedAt: deletedAt,
    deletedAt,
  };
};
