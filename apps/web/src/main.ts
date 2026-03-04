import { createWebContext } from "./create-web-context.js";
import { createWebUi } from "./create-web-ui.js";

export const webContext = createWebContext();
export const webApp = webContext.bootstrap;
export const webCommands = webContext.commands;
export const webQueries = webContext.queries;
export const webUi = createWebUi(webContext);
