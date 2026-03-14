import { describe, expect, it } from "vitest";
import type {
  FinanzasRegisterTabViewModel,
  FinanzasTransactionItemViewModel,
} from "@finanzas/ui";

import { resolveNextSelectedTransactionId } from "../../movements/hooks/use-movements-orchestration.js";
import { createRegisterFormState } from "../../register/hooks/use-register-orchestration.js";
import {
  applyHostRefreshOptions,
  createHostRefreshSeamState,
} from "./host-orchestration.js";

describe("host refresh seam", () => {
  it("preserves movements selection and resets Register defaults when another feature requests it", () => {
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
    const nextRegister: FinanzasRegisterTabViewModel = {
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

    const nextSeam = applyHostRefreshOptions(createHostRefreshSeamState(false), {
      preferredTransactionId: "tx-2",
      resetRegisterForm: true,
    });

    expect(resolveNextSelectedTransactionId(items, "tx-2")).toBe("tx-2");
    expect(nextSeam.registerResetVersion).toBe(1);
    expect(createRegisterFormState(nextRegister)).toEqual({
      amountInput: "",
      noteInput: "",
      dateInput: "2026-03-05T09:30",
      selectedCategoryId: "cat-salary",
      kind: "income",
    });
  });
});
