import type {
  CreateCategoryActionInput,
  LoadHomeTabInput,
  LoadMovementsTabInput,
  LoadRegisterTabInput,
} from "@finanzas/ui";
import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
} from "@finanzas/ui";

import { createWebBootstrap } from "./bootstrap.js";
import { loadAccountScreenHtml } from "../features/account/account-screen.js";
import { loadHomeScreenHtml } from "../features/home/home-screen.js";
import { loadMovementsScreenHtml } from "../features/movements/movements-screen.js";
import { loadRegisterScreenHtml } from "../features/register/register-screen.js";

export const webApp = createWebBootstrap();
export const webCommands = webApp;
export const webQueries = webApp;
export const webUi = createFinanzasUiService(
  selectFinanzasUiDependencies({
    commands: webCommands,
    queries: webQueries,
  }),
);
export const loadWebHomeScreenHtml = (
  input?: LoadHomeTabInput,
): Promise<string> => loadHomeScreenHtml((nextInput) => webUi.loadHomeTab(nextInput), input);
export const loadWebMovementsScreenHtml = (
  input?: LoadMovementsTabInput,
): Promise<string> =>
  loadMovementsScreenHtml((nextInput) => webUi.loadMovementsTab(nextInput), input);
export const loadWebRegisterScreenHtml = (
  input?: LoadRegisterTabInput,
): Promise<string> =>
  loadRegisterScreenHtml((nextInput) => webUi.loadRegisterTab(nextInput), input);
export const loadWebAccountScreenHtml = (): Promise<string> =>
  loadAccountScreenHtml(() => webUi.loadAccountTab());
export const createWebCategory = async (
  input: CreateCategoryActionInput,
): ReturnType<typeof webUi.createCategory> => await webUi.createCategory(input);
