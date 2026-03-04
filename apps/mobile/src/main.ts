import { createMobileContext } from "./create-mobile-context.js";
import { createMobileUi } from "./create-mobile-ui.js";

export const mobileContext = createMobileContext();
export const mobileApp = mobileContext.bootstrap;
export const mobileCommands = mobileContext.commands;
export const mobileQueries = mobileContext.queries;
export const mobileUi = createMobileUi(mobileContext);
