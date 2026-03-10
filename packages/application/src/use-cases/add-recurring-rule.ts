import {
  createRecurringRule,
  type RecurringRule,
  type RecurringRuleSchedule,
} from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  RecurringRuleRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import { toRecurringRuleOutboxPayload } from "./shared/recurring-rule-outbox-payload.js";

/**
 * Input required to create a recurring rule and enqueue its sync operation.
 */
export interface AddRecurringRuleInput {
  templateId: string;
  schedule: RecurringRuleSchedule;
  startsOn: Date;
  isActive?: boolean;
}

/**
 * Runtime dependencies required by `addRecurringRule`.
 */
export interface AddRecurringRuleDependencies {
  recurringRules: RecurringRuleRepository;
  templates: TransactionTemplateRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `addRecurringRule` execution.
 */
export interface AddRecurringRuleResult {
  recurringRule: RecurringRule;
  outboxOpId: string;
}

/**
 * Creates a new local recurring rule and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const addRecurringRule = async (
  dependencies: AddRecurringRuleDependencies,
  input: AddRecurringRuleInput,
): Promise<AddRecurringRuleResult> => {
  const template = await dependencies.templates.findById(input.templateId);

  if (!template || template.deletedAt) {
    throw new ApplicationError(
      `Transaction template ${input.templateId} does not exist.`,
    );
  }

  const now = dependencies.clock.now();
  const recurringRuleId = dependencies.ids.nextId("recurring-rule");
  const existingRule = await dependencies.recurringRules.findById(recurringRuleId);

  if (existingRule) {
    throw new ApplicationError(`Recurring rule ${recurringRuleId} already exists.`);
  }

  const recurringRule = createRecurringRule({
    id: recurringRuleId,
    templateId: template.id,
    schedule: input.schedule,
    startsOn: input.startsOn,
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    createdAt: now,
    updatedAt: now,
  });

  await dependencies.recurringRules.save(recurringRule);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "recurring-rule",
    entityId: recurringRule.id,
    opType: "create",
    payload: toRecurringRuleOutboxPayload(recurringRule),
    createdAt: now,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    recurringRule,
    outboxOpId,
  };
};
