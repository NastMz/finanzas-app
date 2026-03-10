import type { RecurringRule } from "@finanzas/domain";
import type { RecurringRuleRepository } from "@finanzas/application";

/**
 * In-memory implementation of `RecurringRuleRepository` for tests and local wiring.
 */
export class InMemoryRecurringRuleRepository implements RecurringRuleRepository {
  private readonly recurringRules = new Map<string, RecurringRule>();

  constructor(seed: RecurringRule[] = []) {
    for (const recurringRule of seed) {
      this.recurringRules.set(recurringRule.id, cloneRecurringRule(recurringRule));
    }
  }

  async findById(id: string): Promise<RecurringRule | null> {
    const recurringRule = this.recurringRules.get(id);
    return recurringRule ? cloneRecurringRule(recurringRule) : null;
  }

  async findActiveByTemplateId(templateId: string): Promise<RecurringRule | null> {
    for (const recurringRule of this.recurringRules.values()) {
      if (
        recurringRule.templateId === templateId &&
        recurringRule.deletedAt === null &&
        recurringRule.isActive
      ) {
        return cloneRecurringRule(recurringRule);
      }
    }

    return null;
  }

  async listAll(): Promise<RecurringRule[]> {
    return [...this.recurringRules.values()].map(cloneRecurringRule);
  }

  async save(rule: RecurringRule): Promise<void> {
    this.recurringRules.set(rule.id, cloneRecurringRule(rule));
  }
}

const cloneRecurringRule = (rule: RecurringRule): RecurringRule => ({
  ...rule,
  schedule:
    rule.schedule.frequency === "weekly"
      ? {
          ...rule.schedule,
        }
      : {
          ...rule.schedule,
        },
  startsOn: new Date(rule.startsOn),
  nextRunOn: new Date(rule.nextRunOn),
  lastGeneratedOn: rule.lastGeneratedOn ? new Date(rule.lastGeneratedOn) : null,
  createdAt: new Date(rule.createdAt),
  updatedAt: new Date(rule.updatedAt),
  deletedAt: rule.deletedAt ? new Date(rule.deletedAt) : null,
});
