import type { RecurringRule } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  RecurringRuleRepository,
} from "../ports.js";
import { toRecurringRuleOutboxPayload } from "./shared/recurring-rule-outbox-payload.js";

/**
 * Input required to tombstone a recurring rule.
 */
export interface DeleteRecurringRuleInput {
  recurringRuleId: string;
}

/**
 * Runtime dependencies required by `deleteRecurringRule`.
 */
export interface DeleteRecurringRuleDependencies {
  recurringRules: RecurringRuleRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `deleteRecurringRule` execution.
 */
export interface DeleteRecurringRuleResult {
  recurringRule: RecurringRule;
  outboxOpId: string;
}

/**
 * Applies a local tombstone to a recurring rule and appends a pending delete
 * operation to the outbox for remote propagation.
 */
export const deleteRecurringRule = async (
  dependencies: DeleteRecurringRuleDependencies,
  input: DeleteRecurringRuleInput,
): Promise<DeleteRecurringRuleResult> => {
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

  const now = dependencies.clock.now();
  const deletedAt = now < recurringRule.updatedAt ? recurringRule.updatedAt : now;

  const deletedRule: RecurringRule = {
    ...recurringRule,
    updatedAt: deletedAt,
    deletedAt,
    isActive: false,
  };

  await dependencies.recurringRules.save(deletedRule);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "recurring-rule",
    entityId: deletedRule.id,
    opType: "delete",
    ...(deletedRule.version !== null ? { baseVersion: deletedRule.version } : {}),
    payload: toRecurringRuleOutboxPayload(deletedRule),
    createdAt: deletedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    recurringRule: deletedRule,
    outboxOpId,
  };
};
