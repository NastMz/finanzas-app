import {
  MOVEMENTS_WINDOW_SORT,
  type MovementsReviewFilters,
  type TransactionRepository,
} from "@finanzas/application";
import {
  createAccount,
  createMoney,
  createTransaction,
  type Transaction,
} from "@finanzas/domain";
import { describe, expect, it } from "vitest";

export interface TransactionRepositoryHarness {
  repository: TransactionRepository;
  dispose?: () => Promise<void> | void;
}

export const runTransactionWindowRepositoryParitySuite = (
  name: string,
  createHarness: (seed: Transaction[]) => Promise<TransactionRepositoryHarness> | TransactionRepositoryHarness,
): void => {
  describe(name, () => {
    it("returns deterministic bounded pages for date, account, and category filters", async () => {
      const harness = await createHarness(createSeedTransactions());

      try {
        const filters = createScopedFilters({
          includeDeleted: false,
        });
        const firstPage = await harness.repository.queryWindow({
          filters,
          page: {
            limit: 2,
            continuation: null,
          },
          sort: MOVEMENTS_WINDOW_SORT,
        });

        expect(firstPage.transactions.map((transaction) => transaction.id)).toEqual([
          "tx-c",
          "tx-b",
        ]);
        expect(firstPage.hasMore).toBe(true);
        expect(firstPage.nextContinuation).toEqual({
          filterFingerprint: createFilterFingerprint(filters),
          lastItem: {
            date: "2026-03-10T12:00:00.000Z",
            createdAt: "2026-03-10T12:00:00.000Z",
            id: "tx-b",
          },
        });

        const secondPage = await harness.repository.queryWindow({
          filters,
          page: {
            limit: 2,
            continuation: firstPage.nextContinuation,
          },
          sort: MOVEMENTS_WINDOW_SORT,
        });

        expect(secondPage.transactions.map((transaction) => transaction.id)).toEqual([
          "tx-a",
          "tx-older",
        ]);
        expect(secondPage.hasMore).toBe(false);
        expect(secondPage.nextContinuation).toBeNull();
      } finally {
        await harness.dispose?.();
      }
    });

    it("continues through deleted movements only when includeDeleted is enabled", async () => {
      const harness = await createHarness(createSeedTransactions());

      try {
        const filters = createScopedFilters({
          includeDeleted: true,
        });
        const firstPage = await harness.repository.queryWindow({
          filters,
          page: {
            limit: 3,
            continuation: null,
          },
          sort: MOVEMENTS_WINDOW_SORT,
        });

        expect(firstPage.transactions.map((transaction) => transaction.id)).toEqual([
          "tx-c",
          "tx-b",
          "tx-a",
        ]);
        expect(firstPage.hasMore).toBe(true);
        expect(firstPage.nextContinuation).toEqual({
          filterFingerprint: createFilterFingerprint(filters),
          lastItem: {
            date: "2026-03-10T12:00:00.000Z",
            createdAt: "2026-03-10T12:00:00.000Z",
            id: "tx-a",
          },
        });

        const secondPage = await harness.repository.queryWindow({
          filters,
          page: {
            limit: 3,
            continuation: firstPage.nextContinuation,
          },
          sort: MOVEMENTS_WINDOW_SORT,
        });

        expect(secondPage.transactions.map((transaction) => transaction.id)).toEqual([
          "tx-older",
          "tx-deleted",
        ]);
        expect(secondPage.hasMore).toBe(false);
        expect(secondPage.nextContinuation).toBeNull();
      } finally {
        await harness.dispose?.();
      }
    });
  });
};

const createSeedTransactions = (): Transaction[] => {
  const mainAccount = createAccount({
    id: "acc-main",
    name: "Cuenta principal",
    type: "bank",
    currency: "COP",
    createdAt: new Date("2026-03-01T09:00:00.000Z"),
  });
  const otherAccount = createAccount({
    id: "acc-other",
    name: "Cuenta secundaria",
    type: "cash",
    currency: "COP",
    createdAt: new Date("2026-03-01T09:00:00.000Z"),
  });

  return [
    createTransaction(
      {
        id: "tx-c",
        accountId: mainAccount.id,
        amount: createMoney(-5000, "COP"),
        date: new Date("2026-03-10T15:00:00.000Z"),
        categoryId: "cat-food",
        createdAt: new Date("2026-03-10T15:00:00.000Z"),
      },
      mainAccount,
    ),
    createTransaction(
      {
        id: "tx-b",
        accountId: mainAccount.id,
        amount: createMoney(-4000, "COP"),
        date: new Date("2026-03-10T12:00:00.000Z"),
        categoryId: "cat-food",
        createdAt: new Date("2026-03-10T12:00:00.000Z"),
      },
      mainAccount,
    ),
    createTransaction(
      {
        id: "tx-a",
        accountId: mainAccount.id,
        amount: createMoney(-3000, "COP"),
        date: new Date("2026-03-10T12:00:00.000Z"),
        categoryId: "cat-food",
        createdAt: new Date("2026-03-10T12:00:00.000Z"),
      },
      mainAccount,
    ),
    createTransaction(
      {
        id: "tx-older",
        accountId: mainAccount.id,
        amount: createMoney(-2000, "COP"),
        date: new Date("2026-03-09T08:00:00.000Z"),
        categoryId: "cat-food",
        createdAt: new Date("2026-03-09T08:00:00.000Z"),
      },
      mainAccount,
    ),
    {
      ...createTransaction(
        {
          id: "tx-deleted",
          accountId: mainAccount.id,
          amount: createMoney(-1000, "COP"),
          date: new Date("2026-03-08T11:00:00.000Z"),
          categoryId: "cat-food",
          createdAt: new Date("2026-03-08T11:00:00.000Z"),
        },
        mainAccount,
      ),
      updatedAt: new Date("2026-03-12T10:00:00.000Z"),
      deletedAt: new Date("2026-03-12T10:00:00.000Z"),
    },
    createTransaction(
      {
        id: "tx-other-category",
        accountId: mainAccount.id,
        amount: createMoney(-900, "COP"),
        date: new Date("2026-03-10T09:00:00.000Z"),
        categoryId: "cat-rent",
        createdAt: new Date("2026-03-10T09:00:00.000Z"),
      },
      mainAccount,
    ),
    createTransaction(
      {
        id: "tx-other-account",
        accountId: otherAccount.id,
        amount: createMoney(-800, "COP"),
        date: new Date("2026-03-10T09:30:00.000Z"),
        categoryId: "cat-food",
        createdAt: new Date("2026-03-10T09:30:00.000Z"),
      },
      otherAccount,
    ),
    createTransaction(
      {
        id: "tx-out-of-range",
        accountId: mainAccount.id,
        amount: createMoney(-700, "COP"),
        date: new Date("2026-03-07T23:59:59.999Z"),
        categoryId: "cat-food",
        createdAt: new Date("2026-03-07T23:59:59.999Z"),
      },
      mainAccount,
    ),
  ];
};

const createScopedFilters = (
  overrides: Partial<MovementsReviewFilters>,
): MovementsReviewFilters => ({
  dateRange: {
    from: new Date("2026-03-08T00:00:00.000Z"),
    to: new Date("2026-03-10T23:59:59.999Z"),
  },
  accountId: "acc-main",
  categoryId: "cat-food",
  includeDeleted: false,
  ...overrides,
});

const createFilterFingerprint = (filters: MovementsReviewFilters): string =>
  JSON.stringify({
    dateRange: {
      from: filters.dateRange.from?.toISOString() ?? null,
      to: filters.dateRange.to?.toISOString() ?? null,
    },
    accountId: filters.accountId,
    categoryId: filters.categoryId,
    includeDeleted: filters.includeDeleted,
  });
