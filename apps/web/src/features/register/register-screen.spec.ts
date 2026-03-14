import { describe, expect, it } from "vitest";

import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
  type FinanzasTransactionKind,
  type FinanzasRegisterTabViewModel,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { createWebBootstrap } from "../../app/bootstrap.js";
import type { RegisterScreenProps } from "./register-contracts.js";
import {
  loadRegisterScreenHtml,
  RegisterScreen,
  renderRegisterScreen,
} from "./register-screen.js";

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

    const html = renderToStaticMarkup(
      RegisterScreen({
        viewModel,
        ...createRegisterScreenContracts(viewModel, "income"),
      }),
    );

    expect(html).toContain(">Registrar</h1>");
    expect(html).toContain("Cuenta activa: Cuenta &lt;principal&gt; (COP)");
    expect(html).toContain("Food &lt;Drink&gt;");
    expect(html).toContain("Falta una categoria para ingreso");
  });

  it("renders onboarding when the category catalog is empty", () => {
    const viewModel: FinanzasRegisterTabViewModel = {
      account: {
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        deleted: false,
      },
      defaultDate: new Date("2026-03-03T10:00:00.000Z"),
      categories: [],
      suggestedCategoryIds: [],
      defaultCategoryId: null,
      categoryManagement: {
        status: "empty",
        activeCount: 0,
        coverageByKind: {
          expense: {
            available: false,
            count: 0,
          },
          income: {
            available: false,
            count: 0,
          },
        },
        availableTypes: [],
        missingTypes: ["expense", "income"],
        canonicalSurface: "account",
        guardMessageByKind: {
          expense: "Falta una categoria de gasto. Crea una ahora o hazlo desde Cuenta.",
          income: "Falta una categoria de ingreso. Crea una ahora o hazlo desde Cuenta.",
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

    const html = renderRegisterScreen(viewModel);

    expect(html).toContain("Todavia no tienes categorias activas");
    expect(html).toContain("Crear primera categoria");
    expect(html).toContain("Gasto");
    expect(html).toContain("Ingreso");
    expect(html).toContain("puedes administrarlas desde Cuenta");
  });

  it("recovers the blocked register kind after creating the missing type in the same runtime", async () => {
    const { ui } = createWebFeatureRuntime();

    await ui.createCategory({
      name: "Comida",
      type: "expense",
    });

    const blockedViewModel = await ui.loadRegisterTab({
      accountId: "acc-main",
      suggestedCategoryLimit: 4,
    });

    await ui.createCategory({
      name: "Salario",
      type: "income",
    });

    const recoveredViewModel = await ui.loadRegisterTab({
      accountId: "acc-main",
      suggestedCategoryLimit: 4,
    });

    const blockedHtml = renderToStaticMarkup(
      RegisterScreen({
        viewModel: blockedViewModel,
        ...createRegisterScreenContracts(blockedViewModel, "income"),
      }),
    );
    const recoveredHtml = renderToStaticMarkup(
      RegisterScreen({
        viewModel: recoveredViewModel,
        ...createRegisterScreenContracts(recoveredViewModel, "income"),
      }),
    );

    expect(blockedHtml).toContain("Registro rápido");
    expect(blockedHtml).toContain("Falta una categoria para ingreso");
    expect(recoveredHtml).toContain("Registro rápido");
    expect(recoveredHtml).toContain("Salario");
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

const createRegisterScreenContracts = (
  viewModel: FinanzasRegisterTabViewModel,
  kind: FinanzasTransactionKind = "expense",
): Pick<RegisterScreenProps, "quickAdd" | "categoryCreation" | "categorySelection"> => ({
  quickAdd: {
    form: {
      amountInput: "",
      noteInput: "",
      dateInput: viewModel.defaultDate.toISOString().slice(0, 16),
      selectedCategoryId: viewModel.defaultCategoryId,
      kind,
    },
    status: {
      isSaving: false,
      feedback: null,
      offline: false,
    },
    actions: {
      onKindChange: () => {},
      onAmountInputChange: () => {},
      onCategoryChange: () => {},
      onNoteChange: () => {},
      onDateChange: () => {},
      onSubmit: () => {},
    },
  },
  categoryCreation: {
    draft: {
      nameInput: "",
      type: viewModel.categoryManagement.createAction.supportedTypes[0] ?? "expense",
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
  categorySelection: {
    selectedCategoryId: viewModel.defaultCategoryId,
    onSelectCategory: () => {},
  },
});
