import type { RecurringRule } from "@finanzas/domain";

/**
 * Port for recurring rule persistence operations required by application use cases.
 */
export interface RecurringRuleRepository {
  findById(id: string): Promise<RecurringRule | null>;
  findActiveByTemplateId(templateId: string): Promise<RecurringRule | null>;
  listAll(): Promise<RecurringRule[]>;
  save(rule: RecurringRule): Promise<void>;
  replaceAll(rules: RecurringRule[]): Promise<void>;
}
