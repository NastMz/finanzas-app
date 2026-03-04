import type { LoadHomeTabInput } from "@finanzas/ui";

import { createWebContext } from "./create-web-context.js";
import { createWebUi } from "./create-web-ui.js";
import { loadHomeScreenHtml } from "./home-screen.js";

export const webContext = createWebContext();
export const webApp = webContext.bootstrap;
export const webCommands = webContext.commands;
export const webQueries = webContext.queries;
export const webUi = createWebUi(webContext);
export const loadWebHomeScreenHtml = (
  input?: LoadHomeTabInput,
): Promise<string> => loadHomeScreenHtml(webUi, input);
