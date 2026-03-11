import type { AccountType, CurrencyCode } from "@finanzas/domain";

/**
 * Minimal account option shown in selectors.
 */
export interface FinanzasAccountOption {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  deleted: boolean;
}
