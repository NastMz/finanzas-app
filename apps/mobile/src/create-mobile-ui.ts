import type { MobileContext } from "./create-mobile-context.js";
import {
  createFinanzasUiService,
  type FinanzasUiService,
} from "@finanzas/ui";

/**
 * Host UI facade for mobile tabs.
 */
export type MobileUi = FinanzasUiService;

/**
 * Creates the mobile UI facade over the shared app context.
 */
export const createMobileUi = (context: MobileContext): MobileUi =>
  createFinanzasUiService(context);
