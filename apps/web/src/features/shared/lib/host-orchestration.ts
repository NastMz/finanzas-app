import type {
  FinanzasAccountTabViewModel,
  FinanzasCategoryOption,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
  FinanzasTransactionKind,
} from "@finanzas/ui";

export interface InteractionNotice {
  tone: "success" | "error" | "offline";
  message: string;
}

export interface HostRefreshOptions {
  includeDeleted?: boolean;
  preferredTransactionId?: string | null;
  resetRegisterForm?: boolean;
}

export interface HostRefreshSeamState {
  includeDeleted: boolean;
  registerResetVersion: number;
}

export interface HostRefreshResult {
  home: FinanzasHomeTabViewModel;
  movements: FinanzasMovementsTabViewModel;
  register: FinanzasRegisterTabViewModel;
  account: FinanzasAccountTabViewModel;
}

export interface HostRefreshAdapter {
  refresh: (options?: HostRefreshOptions) => Promise<HostRefreshResult>;
}

export const createHostRefreshSeamState = (
  includeDeleted: boolean,
): HostRefreshSeamState => ({
  includeDeleted,
  registerResetVersion: 0,
});

export const applyHostRefreshOptions = (
  state: HostRefreshSeamState,
  options: HostRefreshOptions = {},
): HostRefreshSeamState => ({
  includeDeleted: options.includeDeleted ?? state.includeDeleted,
  registerResetVersion: options.resetRegisterForm === true
    ? state.registerResetVersion + 1
    : state.registerResetVersion,
});

export interface CategoryCreateState {
  nameInput: string;
  type: FinanzasTransactionKind;
}

export const toDateTimeLocalValue = (value: Date): string => value.toISOString().slice(0, 16);

export const resolveCategoriesByKind = (
  categories: FinanzasCategoryOption[],
  kind: FinanzasTransactionKind,
): FinanzasCategoryOption[] => categories.filter((category) => !category.deleted && category.type === kind);

export const resolveCategoryForKind = (
  categories: FinanzasCategoryOption[],
  kind: FinanzasTransactionKind,
  preferredCategoryId?: string | null,
): string | null => {
  const matchingCategories = resolveCategoriesByKind(categories, kind);
  const preferredCategory = matchingCategories.find((category) => category.id === preferredCategoryId);
  return preferredCategory?.id ?? matchingCategories[0]?.id ?? null;
};

export const createCategoryCreateState = (
  type: FinanzasTransactionKind = "expense",
): CategoryCreateState => ({
  nameInput: "",
  type,
});

export const parseMinorAmount = (value: string): bigint | null => {
  const normalized = value.trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const amount = BigInt(normalized);
  return amount > 0n ? amount : null;
};
