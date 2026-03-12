import type {
  InMemoryBootstrap,
  InMemoryBootstrapCommandHandlers,
  InMemoryBootstrapQueryHandlers,
} from "./in-memory-bootstrap.js";

/**
 * Host-facing context split between commands and queries.
 */
export class InMemoryBootstrapContext {
  public readonly commands: InMemoryBootstrapCommandHandlers;

  public readonly queries: InMemoryBootstrapQueryHandlers;

  public constructor(public readonly bootstrap: InMemoryBootstrap) {
    this.commands = bootstrap;
    this.queries = bootstrap;
  }
}

/**
 * Splits an in-memory bootstrap into command/query facades for UI composition.
 */
export const createInMemoryBootstrapContext = (
  bootstrap: InMemoryBootstrap,
): InMemoryBootstrapContext =>
  new InMemoryBootstrapContext(bootstrap);
