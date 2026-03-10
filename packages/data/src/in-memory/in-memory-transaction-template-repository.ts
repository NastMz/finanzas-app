import type { TransactionTemplate } from "@finanzas/domain";
import type { TransactionTemplateRepository } from "@finanzas/application";

/**
 * In-memory implementation of `TransactionTemplateRepository` for tests and local wiring.
 */
export class InMemoryTransactionTemplateRepository
implements TransactionTemplateRepository {
  private readonly templates = new Map<string, TransactionTemplate>();

  constructor(seed: TransactionTemplate[] = []) {
    for (const template of seed) {
      this.templates.set(template.id, cloneTransactionTemplate(template));
    }
  }

  async findById(id: string): Promise<TransactionTemplate | null> {
    const template = this.templates.get(id);
    return template ? cloneTransactionTemplate(template) : null;
  }

  async listAll(): Promise<TransactionTemplate[]> {
    return [...this.templates.values()].map(cloneTransactionTemplate);
  }

  async save(template: TransactionTemplate): Promise<void> {
    this.templates.set(template.id, cloneTransactionTemplate(template));
  }
}

const cloneTransactionTemplate = (
  template: TransactionTemplate,
): TransactionTemplate => ({
  ...template,
  amount: {
    ...template.amount,
  },
  tags: [...template.tags],
  createdAt: new Date(template.createdAt),
  updatedAt: new Date(template.updatedAt),
  deletedAt: template.deletedAt ? new Date(template.deletedAt) : null,
});
