import type { RecurringRuleSchedule } from "@finanzas/domain";

export interface ImportedRecurringRuleSnapshot {
  id: string;
  templateId: string;
  schedule: RecurringRuleSchedule;
  startsOn: Date;
  nextRunOn: Date;
  lastGeneratedOn: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}
