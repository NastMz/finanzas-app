import { createMobileContext } from "./create-mobile-context.js";

export const mobileContext = createMobileContext();
export const mobileApp = mobileContext.bootstrap;
export const mobileCommands = mobileContext.commands;
export const mobileQueries = mobileContext.queries;
