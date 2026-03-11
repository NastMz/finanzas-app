import type { FinanzasUiCommands } from "./finanzas-ui-commands.js";
import type { FinanzasUiQueries } from "./finanzas-ui-queries.js";

/**
 * Runtime dependencies required by `createFinanzasUiService`.
 */
export interface FinanzasUiDependencies {
  commands: FinanzasUiCommands;
  queries: FinanzasUiQueries;
}
