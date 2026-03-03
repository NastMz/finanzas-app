import {
  createInMemoryBootstrapContext,
  type InMemoryBootstrapContext,
} from "@finanzas/platform-shared";

import {
  createWebBootstrap,
  type CreateWebBootstrapOptions,
} from "./bootstrap.js";

/**
 * Host context for web UI composition (commands + queries).
 */
export type WebContext = InMemoryBootstrapContext;

/**
 * Creates a web host context over the shared in-memory bootstrap.
 */
export const createWebContext = (
  options: CreateWebBootstrapOptions = {},
): WebContext => createInMemoryBootstrapContext(createWebBootstrap(options));
