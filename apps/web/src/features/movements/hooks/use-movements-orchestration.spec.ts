import { describe, expect, it } from "vitest";
import type { FinanzasMovementsTabViewModel, FinanzasTransactionItemViewModel } from "@finanzas/ui";

import {
  createMovementsCorrectionRefreshOptions,
  createMovementsLoadMoreRefreshOptions,
  createMovementsResultState,
  resolveNextSelectedTransactionId,
} from "./use-movements-orchestration.js";

const items: FinanzasTransactionItemViewModel[] = [
  {
    id: "tx-1",
    accountId: "acc-main",
    categoryId: "cat-food",
    categoryName: "Comida",
    currency: "COP",
    kind: "expense",
    signedAmountMinor: -12000n,
    amountMinor: 12000n,
    date: new Date("2026-03-03T10:00:00.000Z"),
    note: "almuerzo",
    tags: [],
    deleted: false,
  },
  {
    id: "tx-2",
    accountId: "acc-main",
    categoryId: "cat-salary",
    categoryName: "Salario",
    currency: "COP",
    kind: "income",
    signedAmountMinor: 500000n,
    amountMinor: 500000n,
    date: new Date("2026-03-04T10:00:00.000Z"),
    note: "nomina",
    tags: [],
    deleted: false,
  },
];

const viewModel: FinanzasMovementsTabViewModel = {
  account: {
    id: "acc-main",
    name: "Cuenta principal",
    type: "bank",
    currency: "COP",
    deleted: false,
  },
  includeDeleted: false,
  review: {
    filters: {
      dateRange: {
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-03-31T23:59:59.999Z"),
      },
      accountId: "acc-main",
      categoryId: "cat-food",
      includeDeleted: false,
    },
    page: {
      limit: 12,
      hasMore: true,
      nextContinuation: {
        filterFingerprint: "fingerprint",
        lastItem: {
          id: "tx-1",
          date: "2026-03-03T10:00:00.000Z",
          createdAt: "2026-03-03T10:00:00.000Z",
        },
      },
    },
    mode: "replace",
    scopeLabel: "Cuenta principal (COP)",
  },
  accountOptions: [],
  categoryOptions: [],
  items,
  totals: {
    incomeMinor: 500000n,
    expenseMinor: 12000n,
  },
  sync: {
    status: "pending",
    pendingOps: 1,
    sentOps: 0,
    failedOps: 0,
    ackedOps: 0,
    lastError: null,
    cursor: "2",
  },
  categoryManagement: {
    status: "ready",
    activeCount: 2,
    coverageByKind: {
      expense: {
        available: true,
        count: 1,
      },
      income: {
        available: true,
        count: 1,
      },
    },
    availableTypes: ["expense", "income"],
    missingTypes: [],
    canonicalSurface: "account",
    guardMessageByKind: {
      expense: "",
      income: "",
    },
    createAction: {
      enabled: true,
      supportedTypes: ["expense", "income"],
    },
    recoveryActions: {
      register: {
        enabled: true,
        canonicalSurface: "account",
        surface: "register",
        supportedTypes: ["expense", "income"],
      },
      movements: {
        enabled: true,
        canonicalSurface: "account",
        surface: "movements",
        supportedTypes: ["expense", "income"],
      },
    },
  },
};

const review = viewModel.review;

if (review === undefined) {
  throw new Error("Movements review metadata is required for orchestration tests.");
}

const nextContinuation = review.page.nextContinuation;

if (nextContinuation === null) {
  throw new Error("Movements continuation metadata is required for orchestration tests.");
}

describe("useMovementsOrchestration helpers", () => {
  it("preserves the preferred active transaction after reload", () => {
    expect(resolveNextSelectedTransactionId(items, "tx-2")).toBe("tx-2");
  });

  it("keeps active filters when corrections trigger a replace refresh", () => {
    expect(createMovementsCorrectionRefreshOptions(viewModel, "tx-2")).toEqual({
      movements: {
        filters: review.filters,
        page: {
          limit: 12,
          continuation: null,
        },
        mode: "replace",
      },
      preferredTransactionId: "tx-2",
    });
  });

  it("uses append mode with the same continuation context for load more", () => {
    expect(
      createMovementsLoadMoreRefreshOptions(
        viewModel,
        nextContinuation,
      ),
    ).toEqual({
      movements: {
        filters: review.filters,
        page: {
          limit: 12,
          continuation: review.page.nextContinuation,
        },
        mode: "append",
      },
    });
  });

  it("reports filtered empty state from the canonical review metadata", () => {
    expect(
      createMovementsResultState({
        ...viewModel,
        items: [],
      }),
    ).toMatchObject({
      emptyState: "filtered",
      hasMore: true,
      refreshMode: "replace",
      activeFilters: review.filters,
    });
  });

  it("keeps filters through delete refresh and reports an empty filtered state", () => {
    const refreshOptions = createMovementsCorrectionRefreshOptions(viewModel, null);

    expect(refreshOptions).toEqual({
      movements: {
        filters: review.filters,
        page: {
          limit: 12,
          continuation: null,
        },
        mode: "replace",
      },
      preferredTransactionId: null,
    });

    expect(
      createMovementsResultState({
        ...viewModel,
        items: [],
        review: {
          ...review,
          mode: "replace",
          page: {
            ...review.page,
            hasMore: false,
            nextContinuation: null,
          },
        },
      }),
    ).toMatchObject({
      emptyState: "filtered",
      hasResults: false,
      hasMore: false,
      refreshMode: "replace",
      activeFilters: review.filters,
    });
  });
});
