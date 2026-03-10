import { describe, expect, it } from "vitest";

import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { createWebContext } from "../app/create-web-context.js";
import { createWebUi } from "../app/create-web-ui.js";
import { loadHomeScreenHtml, renderHomeScreen } from "./home-screen.js";

describe("homeScreen", () => {
  it("renders Home tab HTML with escaped content", () => {
    const viewModel: FinanzasHomeTabViewModel = {
      account: {
        id: "acc-main",
        name: "Cuenta <principal>",
        type: "bank",
        currency: "COP",
        deleted: false,
      },
      period: {
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-03-31T23:59:59.999Z"),
        label: "Marzo 2026",
      },
      totals: {
        incomeMinor: 20000n,
        expenseMinor: 10000n,
        netMinor: 10000n,
      },
      topExpenseCategories: [
        {
          categoryId: "cat-food",
          categoryName: "Food & Drink",
          expenseMinor: 10000n,
        },
      ],
      recentTransactions: [
        {
          id: "tx-1",
          accountId: "acc-main",
          categoryId: "cat-food",
          categoryName: "Food & Drink",
          currency: "COP",
          kind: "expense",
          signedAmountMinor: -10000n,
          amountMinor: 10000n,
          date: new Date("2026-03-03T10:00:00.000Z"),
          note: "<script>alert('xss')</script>",
          tags: ["food"],
          deleted: false,
        },
      ],
      transactionCount: 1,
      sync: {
        status: "synced",
        pendingOps: 0,
        sentOps: 0,
        failedOps: 0,
        ackedOps: 1,
        lastError: null,
        cursor: "3",
      },
    };

    const html = renderHomeScreen(viewModel);

    expect(html).toContain(">Inicio</h1>");
    expect(html).toContain("Cuenta: Cuenta &lt;principal&gt; (COP)");
    expect(html).toContain("Sincronizado");
    expect(html).toContain("Food &amp; Drink");
    expect(html).not.toContain("<script>alert('xss')</script>");
    expect(html).toMatch(
      /&lt;script&gt;alert\((&#x27;|&#39;)xss(&#x27;|&#39;)\)&lt;\/script&gt;/,
    );
  });

  it("loads and renders Home tab from shared web UI facade", async () => {
    const context = createWebContext();
    const ui = createWebUi(context);

    const foodCategory = await context.commands.addCategory({
      name: "Comida",
      type: "expense",
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -12000,
      currency: "COP",
      categoryId: foodCategory.category.id,
      date: new Date("2026-03-03T10:00:00.000Z"),
      note: "almuerzo web",
    });

    const html = await loadHomeScreenHtml(ui, {
      accountId: "acc-main",
      period: {
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-03-31T23:59:59.999Z"),
        label: "Marzo",
      },
    });

    expect(html).toContain("Periodo: Marzo");
    expect(html).toContain("Comida");
    expect(html).toContain("-COP 12.000");
    expect(html).toContain("Pendiente");
  });
});
