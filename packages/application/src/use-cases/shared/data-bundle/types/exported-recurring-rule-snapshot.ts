import type { RecurringRuleSchedule } from "@finanzas/domain";

export interface ExportedRecurringRuleSnapshot {
  id: string;
  templateId: string;
  schedule: RecurringRuleSchedule;
  startsOn: string;
  nextRunOn: string;
  lastGeneratedOn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}
