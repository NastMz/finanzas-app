import {
  InMemoryBootstrapContext,
} from "@finanzas/platform-shared";

import {
  createMobileBootstrap,
  type CreateMobileBootstrapOptions,
} from "./bootstrap.js";

/**
 * Host context for mobile UI composition (commands + queries).
 */
export type MobileContext = InMemoryBootstrapContext;

/**
 * Creates a mobile host context over the shared in-memory bootstrap.
 */
export const createMobileContext = (
  options: CreateMobileBootstrapOptions = {},
): MobileContext =>
  new InMemoryBootstrapContext(createMobileBootstrap(options));
