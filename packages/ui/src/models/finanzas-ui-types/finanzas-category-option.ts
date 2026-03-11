import type { CategoryType } from "@finanzas/domain";

/**
 * Minimal category option shown in selectors.
 */
export interface FinanzasCategoryOption {
  id: string;
  name: string;
  type: CategoryType;
  deleted: boolean;
}
