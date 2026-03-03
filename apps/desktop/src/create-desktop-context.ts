import {
  createInMemoryBootstrapContext,
  type InMemoryBootstrapContext,
} from "@finanzas/platform-shared";

import {
  createDesktopBootstrap,
  type CreateDesktopBootstrapOptions,
} from "./bootstrap.js";

/**
 * Host context for desktop UI composition (commands + queries).
 */
export type DesktopContext = InMemoryBootstrapContext;

/**
 * Creates a desktop host context over the shared in-memory bootstrap.
 */
export const createDesktopContext = (
  options: CreateDesktopBootstrapOptions = {},
): DesktopContext =>
  createInMemoryBootstrapContext(createDesktopBootstrap(options));
