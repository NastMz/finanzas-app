import type { WebUi } from "../app/create-web-ui.js";
import {
  AccountScreen,
  renderAccountScreen,
  type AccountScreenProps,
} from "../features/account/account-screen.js";

export { AccountScreen, renderAccountScreen, type AccountScreenProps };

/**
 * Loads Account tab data and returns render-ready HTML.
 */
export const loadAccountScreenHtml = async (ui: WebUi): Promise<string> =>
  renderAccountScreen(await ui.loadAccountTab());
