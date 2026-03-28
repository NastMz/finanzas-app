import { describe, expect, it } from "vitest";
import type {
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
  FinanzasTransactionItemViewModel,
} from "@finanzas/ui";

import { resolveNextSelectedTransactionId } from "../../movements/hooks/use-movements-orchestration.js";
import { createRegisterFormState } from "../../register/hooks/use-register-orchestration.js";
import {
  applyHostRefreshOptions,
  createHostRefreshSeamState,
  mergeMovementsRefreshResult,
  toMovementsLoadInput,
} from "./host-orchestration.js";

const movementItems: FinanzasTransactionItemViewModel[] = [
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

const registerViewModel: FinanzasRegisterTabViewModel = {
  account: {
    id: "acc-main",
    name: "Cuenta principal",
    type: "bank",
    currency: "COP",
    deleted: false,
  },
  defaultDate: new Date("2026-03-05T09:30:00.000Z"),
  categories: [
    {
      id: "cat-salary",
      name: "Salario",
      type: "income",
      deleted: false,
    },
  ],
  suggestedCategoryIds: ["cat-salary"],
  defaultCategoryId: "cat-salary",
  categoryManagement: {
    status: "partial",
    activeCount: 1,
    coverageByKind: {
      expense: {
        available: false,
        count: 0,
      },
      income: {
        available: true,
        count: 1,
      },
    },
    availableTypes: ["income"],
    missingTypes: ["expense"],
    canonicalSurface: "account",
    guardMessageByKind: {
      expense: "Falta una categoria de gasto. Crea una ahora o hazlo desde Cuenta.",
      income: "Falta una categoria de ingreso. Crea una ahora o hazlo desde Cuenta.",
    },
    createAction: {
      enabled: true,
      supportedTypes: ["expense"],
    },
    recoveryActions: {
      register: {
        enabled: true,
        canonicalSurface: "account",
        surface: "register",
        supportedTypes: ["expense"],
      },
      movements: {
        enabled: true,
        canonicalSurface: "account",
        surface: "movements",
        supportedTypes: ["expense"],
      },
    },
  },
};

describe("host refresh seam", () => {
  it("preserves movements selection and resets Register defaults when another feature requests it", () => {
    const nextSeam = applyHostRefreshOptions(createHostRefreshSeamState({
      filters: {
        dateRange: {
          from: null,
          to: null,
        },
        accountId: "acc-main",
        categoryId: null,
        includeDeleted: false,
      },
      page: {
        limit: 12,
        continuation: {
          filterFingerprint: "baseline",
          lastItem: {
            id: "tx-1",
            date: "2026-03-03T10:00:00.000Z",
            createdAt: "2026-03-03T10:00:00.000Z",
          },
        },
      },
      mode: "replace",
    }), {
      movements: {
        filters: {
          categoryId: "cat-salary",
        },
      },
      preferredTransactionId: "tx-2",
      resetRegisterForm: true,
    });

    expect(resolveNextSelectedTransactionId(movementItems, "tx-2")).toBe("tx-2");
    expect(nextSeam.registerResetVersion).toBe(1);
    expect(nextSeam.movements.filters.categoryId).toBe("cat-salary");
    expect(nextSeam.movements.page.continuation).toBeNull();
    expect(createRegisterFormState(registerViewModel)).toEqual({
      amountInput: "",
      noteInput: "",
      dateInput: "2026-03-05T09:30",
      selectedCategoryId: "cat-salary",
      kind: "income",
    });
  });

  it("appends movement pages without dropping the current visible list", () => {
    const previous: FinanzasMovementsTabViewModel = {
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
            from: null,
            to: null,
          },
          accountId: "acc-main",
          categoryId: null,
          includeDeleted: false,
        },
        page: {
          limit: 2,
          hasMore: true,
          nextContinuation: {
            filterFingerprint: "f-1",
            lastItem: {
              id: "tx-2",
              date: "2026-03-02T00:00:00.000Z",
              createdAt: "2026-03-02T00:00:00.000Z",
            },
          },
        },
        mode: "append",
        scopeLabel: "Cuenta principal (COP)",
      },
      accountOptions: [],
      categoryOptions: [],
      items: movementItems,
      totals: {
        incomeMinor: 500000n,
        expenseMinor: 12000n,
        byCurrency: [
          {
            currency: "COP",
            incomeMinor: 500000n,
            expenseMinor: 12000n,
          },
        ],
      },
      sync: {
        status: "pending" as const,
        pendingOps: 1,
        sentOps: 0,
        failedOps: 0,
        ackedOps: 0,
        lastError: null,
        cursor: "2",
      },
      categoryManagement: registerViewModel.categoryManagement,
    };
    const previousReview = previous.review;

    if (previousReview === undefined) {
      throw new Error("Movements review metadata is required for host refresh tests.");
    }

    const nextPage: FinanzasMovementsTabViewModel = {
      ...previous,
      items: [
        {
          id: "tx-3",
          accountId: "acc-main",
          categoryId: "cat-home",
          categoryName: "Casa",
          currency: "COP",
          kind: "expense" as const,
          signedAmountMinor: -80000n,
          amountMinor: 80000n,
          date: new Date("2026-03-01T10:00:00.000Z"),
          note: "arriendo",
          tags: [],
          deleted: false,
        },
      ],
      review: {
        filters: previousReview.filters,
        page: {
          limit: 2,
          hasMore: false,
          nextContinuation: null,
        },
        mode: "append",
        scopeLabel: "Cuenta principal (COP)",
      },
    };

    const merged = mergeMovementsRefreshResult(previous, nextPage, "append");

    expect(merged.items).toHaveLength(3);
    expect(merged.items[2]?.id).toBe("tx-3");
    expect(merged.totals.expenseMinor).toBe(92000n);
  });

  it("preserves explicit review filters when the seam crosses into the load boundary", () => {
    const state = createHostRefreshSeamState({
      filters: {
        dateRange: {
          from: new Date("2026-03-01T00:00:00.000Z"),
          to: new Date("2026-03-31T23:59:59.999Z"),
        },
        accountId: null,
        categoryId: "cat-food",
        includeDeleted: true,
      },
      page: {
        limit: 20,
        continuation: {
          filterFingerprint: "f-1",
          lastItem: {
            id: "tx-2",
            date: "2026-03-02T00:00:00.000Z",
            createdAt: "2026-03-02T00:00:00.000Z",
          },
        },
      },
      mode: "append",
    });

    const nextState = applyHostRefreshOptions(state, {
      preferredTransactionId: "tx-2",
    });

    expect(toMovementsLoadInput("acc-main", nextState)).toEqual({
      hostAccountId: "acc-main",
      review: {
        filters: {
          dateRange: {
            from: new Date("2026-03-01T00:00:00.000Z"),
            to: new Date("2026-03-31T23:59:59.999Z"),
          },
          accountId: null,
          categoryId: "cat-food",
          includeDeleted: true,
        },
        page: {
          limit: 20,
          continuation: {
            filterFingerprint: "f-1",
            lastItem: {
              id: "tx-2",
              date: "2026-03-02T00:00:00.000Z",
              createdAt: "2026-03-02T00:00:00.000Z",
            },
          },
        },
        mode: "append",
      },
    });
  });
});
