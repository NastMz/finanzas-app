import type { MobileContext } from "./create-mobile-context.js";
import {
  createMobileUiService,
  type MobileUiService,
} from "./ui/create-mobile-ui-service.js";

/**
 * Host UI facade for mobile tabs.
 */
export type MobileUi = MobileUiService;

/**
 * Creates the mobile UI facade over the shared app context.
 */
export const createMobileUi = (context: MobileContext): MobileUi =>
  createMobileUiService(context);
