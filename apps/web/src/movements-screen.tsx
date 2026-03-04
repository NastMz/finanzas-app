import type { LoadMovementsTabInput } from "@finanzas/ui";

import type { WebUi } from "./create-web-ui.js";
import {
  MovementsScreen,
  renderMovementsScreen,
  type MovementsScreenProps,
} from "./features/movements/movements-screen.js";

export { MovementsScreen, renderMovementsScreen, type MovementsScreenProps };

/**
 * Loads Movements tab data and returns render-ready HTML.
 */
export const loadMovementsScreenHtml = async (
  ui: WebUi,
  input?: LoadMovementsTabInput,
): Promise<string> => renderMovementsScreen(await ui.loadMovementsTab(input));
