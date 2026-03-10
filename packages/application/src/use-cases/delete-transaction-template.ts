import type { TransactionTemplate } from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  RecurringRuleRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import { toTransactionTemplateOutboxPayload } from "./shared/transaction-template-outbox-payload.js";

/**
 * Input required to tombstone a transaction template.
 */
export interface DeleteTransactionTemplateInput {
  templateId: string;
}

/**
 * Runtime dependencies required by `deleteTransactionTemplate`.
 */
export interface DeleteTransactionTemplateDependencies {
  templates: TransactionTemplateRepository;
  recurringRules: RecurringRuleRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `deleteTransactionTemplate` execution.
 */
export interface DeleteTransactionTemplateResult {
  template: TransactionTemplate;
  outboxOpId: string;
}

/**
 * Applies a local tombstone to a transaction template and appends a pending delete
 * operation to the outbox for remote propagation.
 */
export const deleteTransactionTemplate = async (
  dependencies: DeleteTransactionTemplateDependencies,
  input: DeleteTransactionTemplateInput,
): Promise<DeleteTransactionTemplateResult> => {
  const template = await dependencies.templates.findById(input.templateId);

  if (!template) {
    throw new ApplicationError(
      `Transaction template ${input.templateId} does not exist.`,
    );
  }

  if (template.deletedAt) {
    throw new ApplicationError(
      `Transaction template ${input.templateId} is already deleted.`,
    );
  }

  const activeRule = await dependencies.recurringRules.findActiveByTemplateId(template.id);

  if (activeRule) {
    throw new ApplicationError(
      `Transaction template ${template.id} is still used by recurring rule ${activeRule.id}.`,
    );
  }

  const now = dependencies.clock.now();
  const deletedAt = now < template.updatedAt ? template.updatedAt : now;

  const deletedTemplate: TransactionTemplate = {
    ...template,
    updatedAt: deletedAt,
    deletedAt,
  };

  await dependencies.templates.save(deletedTemplate);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction-template",
    entityId: deletedTemplate.id,
    opType: "delete",
    ...(deletedTemplate.version !== null ? { baseVersion: deletedTemplate.version } : {}),
    payload: toTransactionTemplateOutboxPayload(deletedTemplate),
    createdAt: deletedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    template: deletedTemplate,
    outboxOpId,
  };
};
