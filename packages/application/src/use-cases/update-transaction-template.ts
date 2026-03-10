import {
  createMoney,
  createTransactionTemplate,
  type TransactionTemplate,
} from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  AccountRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import { toTransactionTemplateOutboxPayload } from "./shared/transaction-template-outbox-payload.js";

/**
 * Input required to update a transaction template and enqueue its sync operation.
 */
export interface UpdateTransactionTemplateInput {
  templateId: string;
  name?: string;
  accountId?: string;
  amountMinor?: number | bigint;
  currency?: string;
  categoryId?: string;
  note?: string;
  tags?: string[];
}

/**
 * Runtime dependencies required by `updateTransactionTemplate`.
 */
export interface UpdateTransactionTemplateDependencies {
  accounts: AccountRepository;
  templates: TransactionTemplateRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `updateTransactionTemplate` execution.
 */
export interface UpdateTransactionTemplateResult {
  template: TransactionTemplate;
  outboxOpId: string;
}

/**
 * Updates a local transaction template and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const updateTransactionTemplate = async (
  dependencies: UpdateTransactionTemplateDependencies,
  input: UpdateTransactionTemplateInput,
): Promise<UpdateTransactionTemplateResult> => {
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

  const hasFieldsToUpdate =
    input.name !== undefined ||
    input.accountId !== undefined ||
    input.amountMinor !== undefined ||
    input.currency !== undefined ||
    input.categoryId !== undefined ||
    input.note !== undefined ||
    input.tags !== undefined;

  if (!hasFieldsToUpdate) {
    throw new ApplicationError(
      "At least one transaction template field must be provided to update.",
    );
  }

  const accountId = input.accountId ?? template.accountId;
  const account = await dependencies.accounts.findById(accountId);

  if (!account) {
    throw new ApplicationError(`Account ${accountId} does not exist.`);
  }

  const now = dependencies.clock.now();
  const updatedAt = now < template.updatedAt ? template.updatedAt : now;

  const updatedTemplateBase = createTransactionTemplate(
    {
      id: template.id,
      name: input.name ?? template.name,
      accountId: account.id,
      amount: createMoney(
        input.amountMinor ?? template.amount.amountMinor,
        input.currency ?? template.amount.currency,
      ),
      categoryId: input.categoryId ?? template.categoryId,
      ...(input.note !== undefined
        ? { note: input.note }
        : template.note !== null
          ? { note: template.note }
          : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : { tags: template.tags }),
      createdAt: template.createdAt,
      updatedAt,
    },
    account,
  );

  const updatedTemplate: TransactionTemplate = {
    ...updatedTemplateBase,
    deletedAt: template.deletedAt,
    version: template.version,
  };

  await dependencies.templates.save(updatedTemplate);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction-template",
    entityId: updatedTemplate.id,
    opType: "update",
    ...(updatedTemplate.version !== null ? { baseVersion: updatedTemplate.version } : {}),
    payload: toTransactionTemplateOutboxPayload(updatedTemplate),
    createdAt: updatedAt,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    template: updatedTemplate,
    outboxOpId,
  };
};
