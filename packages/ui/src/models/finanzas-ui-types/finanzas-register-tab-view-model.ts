import type { FinanzasAccountOption } from "./finanzas-account-option.js";
import type { FinanzasCategoryOption } from "./finanzas-category-option.js";

/**
 * Register tab model (`Registrar`) with defaults and suggestions.
 */
export interface FinanzasRegisterTabViewModel {
  account: FinanzasAccountOption;
  defaultDate: Date;
  categories: FinanzasCategoryOption[];
  suggestedCategoryIds: string[];
  defaultCategoryId: string | null;
}
