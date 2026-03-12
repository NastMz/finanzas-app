import type {
  CreateFinanzasUiServiceOptions,
  FinanzasUiDependencies,
  FinanzasUiServiceContract,
} from "./create-finanzas-ui-service/contracts/index.js";
import { FinanzasUiService } from "./create-finanzas-ui-service/finanzas-ui-service-facade.js";

export * from "./create-finanzas-ui-service/contracts/index.js";
export * from "./create-finanzas-ui-service/finanzas-ui-service-facade.js";

/**
 * Creates a headless UI service over `commands`/`queries`.
 */
export const createFinanzasUiService = (
  dependencies: FinanzasUiDependencies,
  options: CreateFinanzasUiServiceOptions = {},
): FinanzasUiServiceContract =>
  new FinanzasUiService(dependencies, options);
