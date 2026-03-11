import type { FinanzasPeriod } from "../../../models/finanzas-ui-types.js";

/**
 * Input to load Home tab data.
 */
export interface LoadHomeTabInput {
  accountId?: string;
  period?: Omit<FinanzasPeriod, "label"> & { label?: string };
  recentLimit?: number;
  topCategoriesLimit?: number;
}
