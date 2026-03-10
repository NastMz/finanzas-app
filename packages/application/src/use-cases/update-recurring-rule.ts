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
 * Input required to update a recurring rule and enqueue its sync operation.
 */
export interface UpdateRecurringRuleInput {
  recurringRuleId: string;
  templateId?: string;
  schedule?: RecurringRuleSchedule;
  startsOn?: Date;
  isActive?: boolean;
}

/**
 * Runtime dependencies required by `updateRecurringRule`.
 */
export interface UpdateRecurringRuleDependencies {
  recurringRules: RecurringRuleRepository;
  templates: TransactionTemplateRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `updateRecurringRule` execution.
 */
export interface UpdateRecurringRuleResult {
  recurringRule: RecurringRule;
  outboxOpId: string;
}

/**
 * Updates a local recurring rule and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const updateRecurringRule = async (
  dependencies: UpdateRecurringRuleDependencies,
  input: UpdateRecurringRuleInput,
): Promise<UpdateRecurringRuleResult> => {
  const recurringRule = await dependencies.recurringRules.findById(
    input.recurringRuleId,
  );

  if (!recurringRule) {
    throw new ApplicationError(
      `Recurring rule ${input.recurringRuleId} does not exist.`,
    );
  }

  if (recurringRule.deletedAt) {
    throw new ApplicationError(
      `Recurring rule ${input.recurringRuleId} is already deleted.`,
    );
  }

  const hasFieldsToUpdate =
    input.templateId !== undefined ||
    input.schedule !== undefined ||
    input.startsOn !== undefined ||
    input.isActive !== undefined;

  if (!hasFieldsToUpdate) {
    throw new ApplicationError(
      "At least one recurring rule field must be provided to update.",
    );
  }

  const templateId = input.templateId ?? recurringRule.templateId;
  const template = await dependencies.templates.findById(templateId);

  if (!template || template.deletedAt) {
    throw new ApplicationError(`Transaction template ${templateId} does not exist.`);
  }

  const now = dependencies.clock.now();
  const updatedAt = now < recurringRule.updatedAt ? recurringRule.updatedAt : now;

  const updatedRuleBase = createRecurringRule({
    id: recurringRule.id,
    templateId: template.id,
    schedule: input.schedule ?? recurringRule.schedule,
    startsOn: input.startsOn ?? recurringRule.startsOn,
    lastGeneratedOn: recurringRule.lastGeneratedOn,
    isActive: input.isActive ?? recurringRule.isActive,
    createdAt: recurringRule.createdAt,
    updatedAt,
  });

  const updatedRule: RecurringRule = {
    ...updatedRuleBase,
    deletedAt: recurringRule.deletedAt,
    version: recurringRule.version,
  };

  await dependencies.recurringRules.save(updatedRule);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "recurring-rule",
    entityId: updatedRule.id,
    opType: "update",
    ...(updatedRule.version !== null ? { baseVersion: updatedRule.version } : {}),
    payload: toRecurringRuleOutboxPayload(updatedRule),
    createdAt: updatedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    recurringRule: updatedRule,
    outboxOpId,
  };
};
