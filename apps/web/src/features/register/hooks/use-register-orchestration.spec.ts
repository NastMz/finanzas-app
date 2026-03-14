import { describe, expect, it } from "vitest";
import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

import { createRegisterFormState } from "./use-register-orchestration.js";

describe("useRegisterOrchestration", () => {
  it("resets the quick-add form from refreshed register defaults", () => {
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

    expect(createRegisterFormState(nextRegister)).toEqual({
      amountInput: "",
      noteInput: "",
      dateInput: "2026-03-05T09:30",
      selectedCategoryId: "cat-salary",
      kind: "income",
    });
  });
});
