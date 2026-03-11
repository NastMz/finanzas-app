import type { TransactionTemplate } from "@finanzas/domain";

/**
 * Port for transaction template persistence operations required by application use cases.
 */
export interface TransactionTemplateRepository {
  findById(id: string): Promise<TransactionTemplate | null>;
  listAll(): Promise<TransactionTemplate[]>;
  save(template: TransactionTemplate): Promise<void>;
  replaceAll(templates: TransactionTemplate[]): Promise<void>;
}
