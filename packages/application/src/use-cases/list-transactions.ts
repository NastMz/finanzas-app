import type { Transaction } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  AccountRepository,
  MovementsContinuationToken,
  MovementsPageRequest,
  MovementsReviewFilters,
  TransactionRepository,
} from "../ports.js";
import { MOVEMENTS_WINDOW_SORT } from "../ports.js";
import { assertTransactionsMatchAccountCurrency } from "./shared/account-currency-consistency.js";

export const DEFAULT_MOVEMENTS_PAGE_LIMIT = 50;
export const MAX_MOVEMENTS_PAGE_LIMIT = 100;

export interface LegacyListTransactionsInput {
  accountId: string;
  includeDeleted?: boolean;
  limit?: number;
}

export interface StructuredListTransactionsInput {
  filters?: Partial<MovementsReviewFilters>;
  page?: Partial<MovementsPageRequest>;
}

/**
 * Query parameters for listing transactions in Movements.
 */
export type ListTransactionsInput =
  | LegacyListTransactionsInput
  | StructuredListTransactionsInput;

/**
 * Runtime dependencies required by `listTransactions`.
 */
export interface ListTransactionsDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
}

/**
 * Result payload returned by `listTransactions`.
 */
export interface ListTransactionsResult {
  transactions: Transaction[];
  appliedFilters: MovementsReviewFilters;
  page: {
    limit: number;
    hasMore: boolean;
    nextContinuation: MovementsContinuationToken | null;
  };
}

interface NormalizedListTransactionsInput {
  filters: MovementsReviewFilters;
  page: MovementsPageRequest;
}

/**
 * Lists local transactions for Movements using explicit filters and a bounded,
 * deterministic continuation contract.
 */
export const listTransactions = async (
  dependencies: ListTransactionsDependencies,
  input: ListTransactionsInput,
): Promise<ListTransactionsResult> => {
  const normalized = normalizeListTransactionsInput(input);

  if (normalized.filters.accountId !== null) {
    const account = await dependencies.accounts.findById(normalized.filters.accountId);

    if (!account) {
      throw new ApplicationError(
        `Account ${normalized.filters.accountId} does not exist.`,
      );
    }

    const result = await dependencies.transactions.queryWindow({
      filters: normalized.filters,
      page: normalized.page,
      sort: MOVEMENTS_WINDOW_SORT,
    });
    assertTransactionsMatchAccountCurrency(account, result.transactions);

    return {
      transactions: result.transactions,
      appliedFilters: normalized.filters,
      page: {
        limit: normalized.page.limit,
        hasMore: result.hasMore,
        nextContinuation: result.nextContinuation,
      },
    };
  }

  const result = await dependencies.transactions.queryWindow({
    filters: normalized.filters,
    page: normalized.page,
    sort: MOVEMENTS_WINDOW_SORT,
  });

  return {
    transactions: result.transactions,
    appliedFilters: normalized.filters,
    page: {
      limit: normalized.page.limit,
      hasMore: result.hasMore,
      nextContinuation: result.nextContinuation,
    },
  };
};

export const normalizeListTransactionsInput = (
  input: ListTransactionsInput,
): NormalizedListTransactionsInput => {
  const legacyInput = input as LegacyListTransactionsInput;
  const structuredInput = input as StructuredListTransactionsInput;
  const filters = structuredInput.filters;
  const page = structuredInput.page;
  const normalizedFilters = normalizeMovementsReviewFilters({
    accountId: filters?.accountId ?? normalizeOptionalId(legacyInput.accountId),
    categoryId: filters?.categoryId ?? null,
    includeDeleted: filters?.includeDeleted ?? legacyInput.includeDeleted ?? false,
    dateRange: {
      from: normalizeOptionalDate(filters?.dateRange?.from),
      to: normalizeOptionalDate(filters?.dateRange?.to),
    },
  });
  const normalizedPage = normalizeMovementsPageRequest({
    ...(page?.limit !== undefined || legacyInput.limit !== undefined
      ? { limit: page?.limit ?? legacyInput.limit }
      : {}),
    continuation: page?.continuation ?? null,
  });

  if (normalizedPage.continuation !== null) {
    const expectedFingerprint = createMovementsFilterFingerprint(normalizedFilters);

    if (normalizedPage.continuation.filterFingerprint !== expectedFingerprint) {
      throw new ApplicationError(
        "Movements continuation does not match the active filters.",
      );
    }
  }

  return {
    filters: normalizedFilters,
    page: normalizedPage,
  };
};

export const normalizeMovementsReviewFilters = (
  input: Partial<MovementsReviewFilters> = {},
): MovementsReviewFilters => {
  const from = normalizeOptionalDate(input.dateRange?.from ?? null);
  const to = normalizeOptionalDate(input.dateRange?.to ?? null);

  if (from !== null && to !== null && from.getTime() > to.getTime()) {
    throw new ApplicationError("Movements date range is invalid.");
  }

  return {
    dateRange: {
      from,
      to,
    },
    accountId: normalizeOptionalId(input.accountId),
    categoryId: normalizeOptionalId(input.categoryId),
    includeDeleted: input.includeDeleted ?? false,
  };
};

export const normalizeMovementsPageRequest = (
  input: Partial<MovementsPageRequest> = {},
): MovementsPageRequest => {
  const limitCandidate = input.limit ?? DEFAULT_MOVEMENTS_PAGE_LIMIT;

  if (!Number.isInteger(limitCandidate) || limitCandidate <= 0) {
    throw new ApplicationError("Movements page limit must be a positive integer.");
  }

  return {
    limit: Math.min(limitCandidate, MAX_MOVEMENTS_PAGE_LIMIT),
    continuation: normalizeMovementsContinuationToken(input.continuation ?? null),
  };
};

export const normalizeMovementsContinuationToken = (
  continuation: MovementsContinuationToken | null,
): MovementsContinuationToken | null => {
  if (continuation === null) {
    return null;
  }

  const filterFingerprint = continuation.filterFingerprint.trim();
  const id = continuation.lastItem.id.trim();
  const date = new Date(continuation.lastItem.date);
  const createdAt = new Date(continuation.lastItem.createdAt);

  if (
    filterFingerprint.length === 0 ||
    id.length === 0 ||
    Number.isNaN(date.valueOf()) ||
    Number.isNaN(createdAt.valueOf())
  ) {
    throw new ApplicationError("Movements continuation token is invalid.");
  }

  return {
    filterFingerprint,
    lastItem: {
      date: date.toISOString(),
      createdAt: createdAt.toISOString(),
      id,
    },
  };
};

export const createMovementsFilterFingerprint = (
  filters: MovementsReviewFilters,
): string =>
  JSON.stringify({
    dateRange: {
      from: filters.dateRange.from?.toISOString() ?? null,
      to: filters.dateRange.to?.toISOString() ?? null,
    },
    accountId: filters.accountId,
    categoryId: filters.categoryId,
    includeDeleted: filters.includeDeleted,
  });

const normalizeOptionalId = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeOptionalDate = (value: Date | null | undefined): Date | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = new Date(value);

  if (Number.isNaN(normalized.valueOf())) {
    throw new ApplicationError("Movements date filter is invalid.");
  }

  return normalized;
};
