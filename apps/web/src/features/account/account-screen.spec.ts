import { describe, expect, it } from "vitest";

import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
  type FinanzasAccountTabViewModel,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { createWebBootstrap } from "../../app/bootstrap.js";
import type { AccountScreenProps } from "./account-contracts.js";
import { AccountScreen, loadAccountScreenHtml } from "./account-screen.js";

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
      categoryManagement: {
        status: "partial",
        activeCount: 6,
        coverageByKind: {
          expense: {
            available: true,
            count: 4,
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

    const html = renderToStaticMarkup(
      AccountScreen({
        viewModel,
        ...createAccountScreenContracts(),
      }),
    );

    expect(html).toContain(">Cuenta</h1>");
    expect(html).toContain("Sincronización");
    expect(html).toContain("Ultima actualizacion registrada: 7");
    expect(html).toContain("Categorías");
    expect(html).toContain("Categorias");
    expect(html).toContain("Seccion principal: Cuenta");
    expect(html).toContain("Crear categoria");
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

    expect(html).toContain("Vista general");
    expect(html).toContain("Sincronización");
    expect(html).toContain("Cuentas");
    expect(html).toContain("Categorías");
    expect(html).toContain("Categorias");
    expect(html).toContain("Estado general de tus cambios");
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

const createAccountScreenContracts = (): Pick<AccountScreenProps, "categoryCreation"> => ({
  categoryCreation: {
    draft: {
      nameInput: "",
      type: "expense",
    },
    status: {
      isSaving: false,
      feedback: null,
    },
    actions: {
      onNameChange: () => {},
      onTypeChange: () => {},
      onSubmit: () => {},
    },
  },
});
