import { describe, expect, it } from "vitest";

import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
  type FinanzasCategoryOption,
  type FinanzasMovementsTabViewModel,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { createWebBootstrap } from "../../app/bootstrap.js";
import {
  loadMovementsScreenHtml,
  MovementsScreen,
  renderMovementsScreen,
} from "./movements-screen.js";

describe("movementsScreen", () => {
  it("renders Movements HTML with escaped user content", () => {
    const viewModel: FinanzasMovementsTabViewModel = {
      account: {
        id: "acc-main",
        name: "Cuenta <ledger>",
        type: "bank",
        currency: "COP",
        deleted: false,
      },
      includeDeleted: true,
      items: [
        {
          id: "tx-1",
          accountId: "acc-main",
          categoryId: "cat-food",
          categoryName: "Food <Drink>",
          currency: "COP",
          kind: "expense",
          signedAmountMinor: -12000n,
          amountMinor: 12000n,
          date: new Date("2026-03-03T10:00:00.000Z"),
          note: "<script>alert('xss')</script>",
          tags: [],
          deleted: true,
        },
      ],
      totals: {
        incomeMinor: 0n,
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
        status: "partial",
        activeCount: 1,
        coverageByKind: {
          expense: {
            available: true,
            count: 1,
          },
          income: {
            available: false,
            count: 0,
          },
        },
        availableTypes: ["expense"],
        missingTypes: ["income"],
        canonicalSurface: "account",
        guardMessageByKind: {
          expense: "Falta una categoria de gasto. Crea una ahora o hazlo desde Cuenta.",
          income: "Falta una categoria de ingreso. Crea una ahora o hazlo desde Cuenta.",
        },
        createAction: {
          enabled: true,
          supportedTypes: ["income"],
        },
        recoveryActions: {
          register: {
            enabled: true,
            canonicalSurface: "account",
            surface: "register",
            supportedTypes: ["income"],
          },
          movements: {
            enabled: true,
            canonicalSurface: "account",
            surface: "movements",
            supportedTypes: ["income"],
          },
        },
      },
    };

    const html = renderMovementsScreen(viewModel);

    expect(html).toContain(">Movimientos</h1>");
    expect(html).toContain("Cuenta: Cuenta &lt;ledger&gt; (COP)");
    expect(html).toContain("Food &lt;Drink&gt;");
    expect(html).toContain("Eliminado");
    expect(html).not.toContain("<script>alert('xss')</script>");
    expect(html).toMatch(
      /&lt;script&gt;alert\((&#x27;|&#39;)xss(&#x27;|&#39;)\)&lt;\/script&gt;/,
    );
  });

  it("renders an explicit guard instead of an empty category select", () => {
    const viewModel: FinanzasMovementsTabViewModel = {
      account: {
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        deleted: false,
      },
      includeDeleted: false,
      items: [
        {
          id: "tx-income",
          accountId: "acc-main",
          categoryId: "cat-income",
          categoryName: "Salario",
          currency: "COP",
          kind: "expense",
          signedAmountMinor: -25000n,
          amountMinor: 25000n,
          date: new Date("2026-03-03T10:00:00.000Z"),
          note: "almuerzo",
          tags: [],
          deleted: false,
        },
      ],
      totals: {
        incomeMinor: 0n,
        expenseMinor: 25000n,
      },
      sync: {
        status: "synced",
        pendingOps: 0,
        sentOps: 0,
        failedOps: 0,
        ackedOps: 0,
        lastError: null,
        cursor: "2",
      },
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
    const categories: FinanzasCategoryOption[] = [
      {
        id: "cat-income",
        name: "Salario",
        type: "income",
        deleted: false,
      },
    ];

    const html = renderToStaticMarkup(
      MovementsScreen({
        viewModel,
        categories,
        selectedTransactionId: "tx-income",
        editDraft: {
          amountInput: "25000",
          categoryId: "",
          dateInput: "2026-03-03T10:00",
          noteInput: "almuerzo",
          kind: "expense",
        },
      }),
    );

    expect(html).toContain("No hay categorias disponibles para gasto");
    expect(html).toContain("Crear categoria");
    expect(html).toContain("Crea una ahora o hazlo desde Cuenta");
    expect(html).not.toContain("<select");
  });

  it("loads movements metadata with empty-category guard coverage", async () => {
    const { bootstrap, ui } = createWebFeatureRuntime();

    const incomeCategory = await bootstrap.addCategory({
      name: "Salario",
      type: "income",
    });
    await bootstrap.addTransaction({
      accountId: "acc-main",
      amountMinor: 220000,
      currency: "COP",
      categoryId: incomeCategory.category.id,
      date: new Date("2026-03-04T12:00:00.000Z"),
      note: "nomina",
    });

    const movements = await ui.loadMovementsTab({
      accountId: "acc-main",
      includeDeleted: true,
      limit: 10,
    });

    expect(movements.categoryManagement.status).toBe("partial");
    expect(movements.categoryManagement.coverageByKind.expense.count).toBe(0);
    expect(movements.categoryManagement.coverageByKind.income.count).toBe(1);
  });

  it("loads and renders Movements tab from shared web UI facade", async () => {
    const { bootstrap, ui } = createWebFeatureRuntime();

    const foodCategory = await bootstrap.addCategory({
      name: "Comida",
      type: "expense",
    });

    const created = await bootstrap.addTransaction({
      accountId: "acc-main",
      amountMinor: -19000,
      currency: "COP",
      categoryId: foodCategory.category.id,
      date: new Date("2026-03-04T12:00:00.000Z"),
      note: "almuerzo",
    });

    await bootstrap.deleteTransaction({
      transactionId: created.transaction.id,
    });

    const html = await loadMovementsScreenHtml(
      (input) => ui.loadMovementsTab(input),
      {
        accountId: "acc-main",
        includeDeleted: true,
        limit: 10,
      },
    );

    expect(html).toContain("Vista: activos + eliminados");
    expect(html).toContain("Incluye eliminados");
    expect(html).toContain("Comida");
    expect(html).toContain("Eliminado");
  });
});

const createWebFeatureRuntime = (): {
  bootstrap: ReturnType<typeof createWebBootstrap>;
  ui: ReturnType<typeof createFinanzasUiService>;
} => {
  const bootstrap = createWebBootstrap();
  const ui = createFinanzasUiService(
    selectFinanzasUiDependencies({
      commands: bootstrap,
      queries: bootstrap,
    }),
  );

  return {
    bootstrap,
    ui,
  };
};
