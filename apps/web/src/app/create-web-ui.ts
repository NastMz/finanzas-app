import {
  FinanzasUiService,
} from "@finanzas/ui";

import type { WebContext } from "./create-web-context.js";

/**
 * Host UI facade for web tabs/views.
 */
export type WebUi = FinanzasUiService;

/**
 * Creates the web UI facade over the shared app context.
 */
export const createWebUi = (context: WebContext): WebUi =>
  new FinanzasUiService(context);
