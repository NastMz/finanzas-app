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
 * Input required to create a transaction template and enqueue its sync operation.
 */
export interface AddTransactionTemplateInput {
  name: string;
  accountId: string;
  amountMinor: number | bigint;
  currency: string;
  categoryId: string;
  note?: string;
  tags?: string[];
}

/**
 * Runtime dependencies required by `addTransactionTemplate`.
 */
export interface AddTransactionTemplateDependencies {
  accounts: AccountRepository;
  templates: TransactionTemplateRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result returned after a successful `addTransactionTemplate` execution.
 */
export interface AddTransactionTemplateResult {
  template: TransactionTemplate;
  outboxOpId: string;
}

/**
 * Creates a new local transaction template and appends a pending outbox operation
 * to be pushed during the next sync cycle.
 */
export const addTransactionTemplate = async (
  dependencies: AddTransactionTemplateDependencies,
  input: AddTransactionTemplateInput,
): Promise<AddTransactionTemplateResult> => {
  const account = await dependencies.accounts.findById(input.accountId);

  if (!account) {
    throw new ApplicationError(`Account ${input.accountId} does not exist.`);
  }

  const now = dependencies.clock.now();
  const templateId = dependencies.ids.nextId("transaction-template");
  const existingTemplate = await dependencies.templates.findById(templateId);

  if (existingTemplate) {
    throw new ApplicationError(`Transaction template ${templateId} already exists.`);
  }

  const template = createTransactionTemplate(
    {
      id: templateId,
      name: input.name,
      accountId: account.id,
      amount: createMoney(input.amountMinor, input.currency),
      categoryId: input.categoryId,
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      createdAt: now,
      updatedAt: now,
    },
    account,
  );

  await dependencies.templates.save(template);

  const outboxOpId = dependencies.ids.nextId("outbox-op");
  const outboxOperation: OutboxOp = {
    opId: outboxOpId,
    deviceId: dependencies.deviceId,
    entityType: "transaction-template",
    entityId: template.id,
    opType: "create",
    payload: toTransactionTemplateOutboxPayload(template),
    createdAt: now,
    status: "pending",
    attemptCount: 0,
  };

  await dependencies.outbox.append(outboxOperation);

  return {
    template,
    outboxOpId,
  };
};
