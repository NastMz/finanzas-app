import type {
  MovementsPageRequest,
  MovementsReviewFilters,
} from "@finanzas/application";

/**
 * Input to load Movements tab data.
 */
export interface LoadMovementsTabInput {
  hostAccountId?: string;
  review?: {
    filters?: Partial<MovementsReviewFilters>;
    page?: Partial<MovementsPageRequest>;
    mode?: "replace" | "append";
  };
}
