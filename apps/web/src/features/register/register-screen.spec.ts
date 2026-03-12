import { describe, expect, it } from "vitest";

import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
  type FinanzasRegisterTabViewModel,
} from "@finanzas/ui";

import { createWebBootstrap } from "../../app/bootstrap.js";
import { loadRegisterScreenHtml, renderRegisterScreen } from "./register-screen.js";

describe("registerScreen", () => {
  it("renders Register HTML with escaped content", () => {
    const viewModel: FinanzasRegisterTabViewModel = {
      account: {
        id: "acc-main",
        name: "Cuenta <principal>",
        type: "bank",
        currency: "COP",
        deleted: false,
      },
      defaultDate: new Date("2026-03-03T10:00:00.000Z"),
      categories: [
        {
          id: "cat-food",
          name: "Food <Drink>",
          type: "expense",
          deleted: false,
        },
      ],
      suggestedCategoryIds: ["cat-food"],
      defaultCategoryId: "cat-food",
    };

    const html = renderRegisterScreen(viewModel);

    expect(html).toContain(">Registrar</h1>");
    expect(html).toContain("Cuenta activa: Cuenta &lt;principal&gt; (COP)");
    expect(html).toContain("Food &lt;Drink&gt;");
  });

  it("loads and renders Register tab from shared web UI facade", async () => {
    const { bootstrap, ui } = createWebFeatureRuntime();

    await bootstrap.addCategory({
      name: "Transporte",
      type: "expense",
    });
    await bootstrap.addCategory({
      name: "Salario",
      type: "income",
    });

    const html = await loadRegisterScreenHtml((input) => ui.loadRegisterTab(input), {
      accountId: "acc-main",
      suggestedCategoryLimit: 4,
    });

    expect(html).toContain("Registro rápido");
    expect(html).toContain("Cuenta activa: Cuenta principal (COP)");
    expect(html).toContain("Catálogo de categorías");
    expect(html).toContain("Transporte");
    expect(html).toContain("Salario");
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
