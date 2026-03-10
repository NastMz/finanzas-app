import type {
  LoadHomeTabInput,
  LoadMovementsTabInput,
  LoadRegisterTabInput,
} from "@finanzas/ui";

import { createWebContext } from "./create-web-context.js";
import { createWebUi } from "./create-web-ui.js";
import { loadAccountScreenHtml } from "../screens/account-screen.js";
import { loadHomeScreenHtml } from "../screens/home-screen.js";
import { loadMovementsScreenHtml } from "../screens/movements-screen.js";
import { loadRegisterScreenHtml } from "../screens/register-screen.js";

export const webContext = createWebContext();
export const webApp = webContext.bootstrap;
export const webCommands = webContext.commands;
export const webQueries = webContext.queries;
export const webUi = createWebUi(webContext);
export const loadWebHomeScreenHtml = (
  input?: LoadHomeTabInput,
): Promise<string> => loadHomeScreenHtml(webUi, input);
export const loadWebMovementsScreenHtml = (
  input?: LoadMovementsTabInput,
): Promise<string> => loadMovementsScreenHtml(webUi, input);
export const loadWebRegisterScreenHtml = (
  input?: LoadRegisterTabInput,
): Promise<string> => loadRegisterScreenHtml(webUi, input);
export const loadWebAccountScreenHtml = (): Promise<string> =>
  loadAccountScreenHtml(webUi);
