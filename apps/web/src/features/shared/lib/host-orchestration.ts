import type {
  FinanzasAccountTabViewModel,
  FinanzasCategoryOption,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
  FinanzasTransactionKind,
  LoadMovementsTabInput,
} from "@finanzas/ui";
import type {
  MovementsContinuationToken,
  MovementsReviewFilters,
} from "@finanzas/application";

export interface InteractionNotice {
  tone: "success" | "error" | "offline";
  message: string;
}

export interface HostRefreshOptions {
  movements?: {
    filters?: Partial<MovementsReviewFilters>;
    page?: {
      limit?: number;
      continuation?: MovementsContinuationToken | null;
    };
    mode?: "replace" | "append";
  };
  preferredTransactionId?: string | null;
  resetRegisterForm?: boolean;
}

export interface HostMovementsReviewState {
  filters: MovementsReviewFilters;
  page: {
    limit: number;
    continuation: MovementsContinuationToken | null;
  };
  mode: "replace" | "append";
}

export interface HostRefreshSeamState {
  movements: HostMovementsReviewState;
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
  movements: HostMovementsReviewState,
): HostRefreshSeamState => ({
  movements,
  registerResetVersion: 0,
});

export const applyHostRefreshOptions = (
  state: HostRefreshSeamState,
  options: HostRefreshOptions = {},
): HostRefreshSeamState => {
  const nextFilters = mergeMovementsReviewFilters(
    state.movements.filters,
    options.movements?.filters,
  );
  const filtersChanged = areMovementsReviewFiltersDifferent(
    state.movements.filters,
    nextFilters,
  );

  return {
    movements: {
      filters: nextFilters,
      page: {
        limit: options.movements?.page?.limit ?? state.movements.page.limit,
        continuation: filtersChanged
          ? null
          : options.movements?.page?.continuation !== undefined
            ? options.movements.page.continuation
            : state.movements.page.continuation,
      },
      mode: filtersChanged
        ? "replace"
        : options.movements?.mode ?? state.movements.mode,
    },
    registerResetVersion: options.resetRegisterForm === true
      ? state.registerResetVersion + 1
      : state.registerResetVersion,
  };
};

export const toMovementsLoadInput = (
  hostAccountId: string,
  state: HostRefreshSeamState,
): LoadMovementsTabInput => ({
  hostAccountId,
  review: {
    filters: state.movements.filters,
    page: {
      limit: state.movements.page.limit,
      continuation: state.movements.page.continuation,
    },
    mode: state.movements.mode,
  },
});

export const syncHostMovementsReviewState = (
  state: HostRefreshSeamState,
  review: NonNullable<FinanzasMovementsTabViewModel["review"]>,
): HostRefreshSeamState => ({
  movements: {
    filters: review.filters,
    page: {
      limit: review.page.limit,
      continuation: review.page.nextContinuation,
    },
    mode: review.mode,
  },
  registerResetVersion: state.registerResetVersion,
});

export const mergeMovementsRefreshResult = (
  previous: FinanzasMovementsTabViewModel,
  next: FinanzasMovementsTabViewModel,
  mode: "replace" | "append",
): FinanzasMovementsTabViewModel => {
  if (mode !== "append") {
    return next;
  }

  const nextItems = [...previous.items];
  const knownTransactionIds = new Set(previous.items.map((item) => item.id));

  for (const item of next.items) {
    if (!knownTransactionIds.has(item.id)) {
      nextItems.push(item);
    }
  }

  return {
    ...next,
    items: nextItems,
    totals: summarizeMovementItems(nextItems),
  };
};

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

const mergeMovementsReviewFilters = (
  current: MovementsReviewFilters,
  patch: Partial<MovementsReviewFilters> | undefined,
): MovementsReviewFilters => {
  if (patch === undefined) {
    return current;
  }

  return {
    dateRange: {
      from: patch.dateRange?.from ?? current.dateRange.from,
      to: patch.dateRange?.to ?? current.dateRange.to,
    },
    accountId: patch.accountId !== undefined ? patch.accountId : current.accountId,
    categoryId: patch.categoryId !== undefined ? patch.categoryId : current.categoryId,
    includeDeleted:
      patch.includeDeleted !== undefined ? patch.includeDeleted : current.includeDeleted,
  };
};

const areMovementsReviewFiltersDifferent = (
  left: MovementsReviewFilters,
  right: MovementsReviewFilters,
): boolean =>
  left.accountId !== right.accountId ||
  left.categoryId !== right.categoryId ||
  left.includeDeleted !== right.includeDeleted ||
  left.dateRange.from?.toISOString() !== right.dateRange.from?.toISOString() ||
  left.dateRange.to?.toISOString() !== right.dateRange.to?.toISOString();

const summarizeMovementItems = (
  items: FinanzasMovementsTabViewModel["items"],
): FinanzasMovementsTabViewModel["totals"] => {
  let incomeMinor = 0n;
  let expenseMinor = 0n;
  const byCurrency = new Map<string, {
    currency: string;
    incomeMinor: bigint;
    expenseMinor: bigint;
  }>();

  for (const item of items) {
    const current = byCurrency.get(item.currency) ?? {
      currency: item.currency,
      incomeMinor: 0n,
      expenseMinor: 0n,
    };

    if (item.kind === "income") {
      incomeMinor += item.amountMinor;
      current.incomeMinor += item.amountMinor;
    } else {
      expenseMinor += item.amountMinor;
      current.expenseMinor += item.amountMinor;
    }

    byCurrency.set(item.currency, current);
  }

  return {
    incomeMinor,
    expenseMinor,
    byCurrency: [...byCurrency.values()],
  };
};
