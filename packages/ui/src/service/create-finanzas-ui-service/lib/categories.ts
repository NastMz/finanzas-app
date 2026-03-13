import type {
  FinanzasCategoryManagementState,
  FinanzasCategoryOption,
  FinanzasTransactionKind,
} from "../../../models/finanzas-ui-types.js";

const CATEGORY_TYPES = ["expense", "income"] as const satisfies readonly FinanzasTransactionKind[];

const createGuardMessage = (kind: FinanzasTransactionKind): string =>
  kind === "expense"
    ? "Falta una categoria de gasto. Crea una ahora o hazlo desde Cuenta."
    : "Falta una categoria de ingreso. Crea una ahora o hazlo desde Cuenta.";

export const resolveCategoryManagementState = (
  categories: FinanzasCategoryOption[],
): FinanzasCategoryManagementState => {
  const activeCategories = categories.filter((category) => !category.deleted);
  const coverageByKind = {
    expense: {
      count: activeCategories.filter((category) => category.type === "expense").length,
      get available() {
        return this.count > 0;
      },
    },
    income: {
      count: activeCategories.filter((category) => category.type === "income").length,
      get available() {
        return this.count > 0;
      },
    },
  } satisfies FinanzasCategoryManagementState["coverageByKind"];
  const availableTypes = CATEGORY_TYPES.filter((type) => coverageByKind[type].available);
  const missingTypes = CATEGORY_TYPES.filter((type) => !coverageByKind[type].available);
  const status = availableTypes.length === 0
    ? "empty"
    : missingTypes.length === 0
      ? "ready"
      : "partial";
  const supportedCreateTypes = missingTypes.length > 0 ? missingTypes : [...CATEGORY_TYPES];

  const createRecoveryAction = (
    surface: "register" | "movements",
  ): FinanzasCategoryManagementState["recoveryActions"]["register"] => ({
    enabled: missingTypes.length > 0,
    canonicalSurface: "account",
    surface,
    supportedTypes: [...missingTypes],
  });

  return {
    status,
    activeCount: activeCategories.length,
    coverageByKind,
    availableTypes,
    missingTypes,
    canonicalSurface: "account",
    guardMessageByKind: {
      expense: createGuardMessage("expense"),
      income: createGuardMessage("income"),
    },
    createAction: {
      enabled: true,
      supportedTypes: supportedCreateTypes,
    },
    recoveryActions: {
      register: createRecoveryAction("register"),
      movements: createRecoveryAction("movements"),
    },
  };
};
