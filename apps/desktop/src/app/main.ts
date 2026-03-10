import { createDesktopContext } from "./create-desktop-context.js";

export const desktopContext = createDesktopContext();
export const desktopApp = desktopContext.bootstrap;
export const desktopCommands = desktopContext.commands;
export const desktopQueries = desktopContext.queries;
