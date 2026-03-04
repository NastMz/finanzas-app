import type {
  LoadHomeTabInput,
} from "@finanzas/ui";

import type { WebUi } from "./create-web-ui.js";
import {
  renderHomeScreen,
  HomeScreen,
  type HomeScreenProps,
} from "./features/home/home-screen.js";

export { HomeScreen, renderHomeScreen, type HomeScreenProps };

/**
 * Loads Home tab data and returns render-ready HTML.
 */
export const loadHomeScreenHtml = async (
  ui: WebUi,
  input?: LoadHomeTabInput,
): Promise<string> => renderHomeScreen(await ui.loadHomeTab(input));
