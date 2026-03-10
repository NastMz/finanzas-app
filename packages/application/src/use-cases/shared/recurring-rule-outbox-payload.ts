import type { RecurringRule } from "@finanzas/domain";

/**
 * Serializes a recurring rule aggregate into the JSON payload format expected
 * by outbox sync operations.
 */
export const toRecurringRuleOutboxPayload = (
  rule: RecurringRule,
): Record<string, unknown> => ({
  id: rule.id,
  templateId: rule.templateId,
  schedule: serializeRecurringRuleSchedule(rule.schedule),
  startsOn: rule.startsOn.toISOString(),
  nextRunOn: rule.nextRunOn.toISOString(),
  lastGeneratedOn: rule.lastGeneratedOn ? rule.lastGeneratedOn.toISOString() : null,
  isActive: rule.isActive,
  createdAt: rule.createdAt.toISOString(),
  updatedAt: rule.updatedAt.toISOString(),
  deletedAt: rule.deletedAt ? rule.deletedAt.toISOString() : null,
});

const serializeRecurringRuleSchedule = (
  schedule: RecurringRule["schedule"],
): Record<string, unknown> =>
  schedule.frequency === "weekly"
    ? {
        frequency: schedule.frequency,
        interval: schedule.interval,
        dayOfWeek: schedule.dayOfWeek,
      }
    : {
        frequency: schedule.frequency,
        interval: schedule.interval,
        dayOfMonth: schedule.dayOfMonth,
      };
