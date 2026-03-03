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

  async markAsSent(opIds: string[]): Promise<void> {
    const targetIds = new Set(opIds);

    for (let index = 0; index < this.operations.length; index += 1) {
      const operation = this.operations[index];

      if (!operation || !targetIds.has(operation.opId) || operation.status === "acked") {
        continue;
      }

      const { lastError: _lastError, ...safeOperation } = operation;
      this.operations[index] = {
        ...safeOperation,
        status: "sent",
        attemptCount: operation.attemptCount + 1,
      };
    }
  }

  async markAsAcked(opIds: string[]): Promise<void> {
    const targetIds = new Set(opIds);

    for (let index = 0; index < this.operations.length; index += 1) {
      const operation = this.operations[index];

      if (!operation || !targetIds.has(operation.opId)) {
        continue;
      }

      const { lastError: _lastError, ...safeOperation } = operation;
      this.operations[index] = {
        ...safeOperation,
        status: "acked",
      };
    }
  }

  async markAsFailed(opIds: string[], errorMessage: string): Promise<void> {
    const targetIds = new Set(opIds);

    for (let index = 0; index < this.operations.length; index += 1) {
      const operation = this.operations[index];

      if (!operation || !targetIds.has(operation.opId)) {
        continue;
      }

      this.operations[index] = {
        ...operation,
        status: "failed",
        lastError: errorMessage,
      };
    }
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
