import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
} from "@finanzas/ui";

import { createMobileBootstrap } from "./bootstrap.js";

export const mobileApp = createMobileBootstrap();
export const mobileCommands = mobileApp;
export const mobileQueries = mobileApp;
export const mobileUi = createFinanzasUiService(
  selectFinanzasUiDependencies({
    commands: mobileCommands,
    queries: mobileQueries,
  }),
);
