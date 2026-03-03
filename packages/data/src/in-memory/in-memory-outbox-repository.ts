import type { OutboxOp, OutboxRepository } from "@finanzas/application";

export class InMemoryOutboxRepository implements OutboxRepository {
  private readonly operations: OutboxOp[] = [];

  async append(op: OutboxOp): Promise<void> {
    this.operations.push(cloneOutboxOp(op));
  }

  async listPending(): Promise<OutboxOp[]> {
    return this.operations
      .filter((op) => op.status === "pending")
      .map(cloneOutboxOp);
  }

  async listAll(): Promise<OutboxOp[]> {
    return this.operations.map(cloneOutboxOp);
  }
}

const cloneOutboxOp = (operation: OutboxOp): OutboxOp => ({
  ...operation,
  payload: {
    ...operation.payload,
  },
  createdAt: new Date(operation.createdAt),
});
