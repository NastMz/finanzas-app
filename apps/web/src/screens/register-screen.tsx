import type { LoadRegisterTabInput } from "@finanzas/ui";

import type { WebUi } from "../app/create-web-ui.js";
import {
  RegisterScreen,
  renderRegisterScreen,
  type RegisterScreenProps,
} from "../features/register/register-screen.js";

export { RegisterScreen, renderRegisterScreen, type RegisterScreenProps };

/**
 * Loads Register tab data and returns render-ready HTML.
 */
export const loadRegisterScreenHtml = async (
  ui: WebUi,
  input?: LoadRegisterTabInput,
): Promise<string> => renderRegisterScreen(await ui.loadRegisterTab(input));
