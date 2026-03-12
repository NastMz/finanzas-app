import { describe, expect, it } from "vitest";

import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
  type FinanzasMovementsTabViewModel,
} from "@finanzas/ui";

import { createWebBootstrap } from "../../app/bootstrap.js";
import {
  loadMovementsScreenHtml,
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
