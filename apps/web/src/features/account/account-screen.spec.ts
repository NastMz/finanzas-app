import { describe, expect, it } from "vitest";

import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
  type FinanzasAccountTabViewModel,
} from "@finanzas/ui";

import { createWebBootstrap } from "../../app/bootstrap.js";
import { loadAccountScreenHtml, renderAccountScreen } from "./account-screen.js";

describe("accountScreen", () => {
  it("renders Account HTML with escaped error content", () => {
    const viewModel: FinanzasAccountTabViewModel = {
      sync: {
        status: "error",
        pendingOps: 3,
        sentOps: 1,
        failedOps: 2,
        ackedOps: 0,
        lastError: "<script>alert('xss')</script>",
        cursor: "7",
      },
      accounts: {
        total: 4,
        active: 3,
        deleted: 1,
      },
      categories: {
        total: 8,
        active: 6,
        deleted: 2,
      },
    };

    const html = renderAccountScreen(viewModel);

    expect(html).toContain(">Cuenta</h1>");
    expect(html).toContain("Sincronización");
    expect(html).toContain("Cursor actual: 7");
    expect(html).toContain("Categorías");
    expect(html).not.toContain("<script>alert('xss')</script>");
    expect(html).toMatch(
      /&lt;script&gt;alert\((&#x27;|&#39;)xss(&#x27;|&#39;)\)&lt;\/script&gt;/,
    );
  });

  it("loads and renders Account tab from shared web UI facade", async () => {
    const { bootstrap, ui } = createWebFeatureRuntime();

    await bootstrap.addCategory({
      name: "Hogar",
      type: "expense",
    });

    const html = await loadAccountScreenHtml(() => ui.loadAccountTab());

    expect(html).toContain("Control Center");
    expect(html).toContain("Sincronización");
    expect(html).toContain("Cuentas");
    expect(html).toContain("Categorías");
    expect(html).toContain("Sin errores recientes.");
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
