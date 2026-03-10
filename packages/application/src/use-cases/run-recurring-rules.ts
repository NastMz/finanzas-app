import {
  calculateNextRecurringRuleRun,
  type RecurringRule,
  type Transaction,
} from "@finanzas/domain";

import { ApplicationError } from "../errors.js";
import type {
  AccountRepository,
  Clock,
  IdGenerator,
  OutboxOp,
  OutboxRepository,
  RecurringRuleRepository,
  TransactionRepository,
  TransactionTemplateRepository,
} from "../ports.js";
import { addTransaction } from "./add-transaction.js";
import { toRecurringRuleOutboxPayload } from "./shared/recurring-rule-outbox-payload.js";

/**
 * Input accepted by `runRecurringRules`.
 */
export interface RunRecurringRulesInput {
  asOf?: Date;
}

/**
 * Runtime dependencies required by `runRecurringRules`.
 */
export interface RunRecurringRulesDependencies {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  templates: TransactionTemplateRepository;
  recurringRules: RecurringRuleRepository;
  outbox: OutboxRepository;
  ids: IdGenerator;
  clock: Clock;
  deviceId: string;
}

/**
 * Result payload returned after executing due recurring rules.
 */
export interface RunRecurringRulesResult {
  generatedTransactions: Transaction[];
  updatedRecurringRules: RecurringRule[];
  transactionOutboxOpIds: string[];
  recurringRuleOutboxOpIds: string[];
}

/**
 * Generates local transactions for due recurring rules and advances their next run.
 */
export const runRecurringRules = async (
  dependencies: RunRecurringRulesDependencies,
  input: RunRecurringRulesInput = {},
): Promise<RunRecurringRulesResult> => {
  const now = dependencies.clock.now();
  const asOf = normalizeRecurringDate(input.asOf ?? now);
  const recurringRules = await dependencies.recurringRules.listAll();
  const dueRules = recurringRules
    .filter(
      (rule) =>
        rule.deletedAt === null && rule.isActive && normalizeRecurringDate(rule.nextRunOn) <= asOf,
    )
    .sort((left, right) => left.nextRunOn.getTime() - right.nextRunOn.getTime());

  const generatedTransactions: Transaction[] = [];
  const updatedRecurringRules: RecurringRule[] = [];
  const transactionOutboxOpIds: string[] = [];
  const recurringRuleOutboxOpIds: string[] = [];

  for (const recurringRule of dueRules) {
    const template = await dependencies.templates.findById(recurringRule.templateId);

    if (!template || template.deletedAt) {
      throw new ApplicationError(
        `Transaction template ${recurringRule.templateId} does not exist.`,
      );
    }

    let occurrence = normalizeRecurringDate(recurringRule.nextRunOn);
    let lastGeneratedOn = recurringRule.lastGeneratedOn;

    while (occurrence <= asOf) {
      const transactionResult = await addTransaction(
        {
          accounts: dependencies.accounts,
          transactions: dependencies.transactions,
          outbox: dependencies.outbox,
          ids: dependencies.ids,
          clock: dependencies.clock,
          deviceId: dependencies.deviceId,
        },
        {
          accountId: template.accountId,
          amountMinor: template.amount.amountMinor,
          currency: template.amount.currency,
          date: occurrence,
          categoryId: template.categoryId,
          ...(template.note !== null ? { note: template.note } : {}),
          tags: template.tags,
        },
      );

      generatedTransactions.push(transactionResult.transaction);
      transactionOutboxOpIds.push(transactionResult.outboxOpId);
      lastGeneratedOn = occurrence;
      occurrence = calculateNextRecurringRuleRun(recurringRule.schedule, occurrence);
    }

    const updatedAt = now < recurringRule.updatedAt ? recurringRule.updatedAt : now;
    const updatedRecurringRule: RecurringRule = {
      ...recurringRule,
      nextRunOn: occurrence,
      lastGeneratedOn,
      updatedAt,
    };

    await dependencies.recurringRules.save(updatedRecurringRule);

    const outboxOpId = dependencies.ids.nextId("outbox-op");
    const outboxOperation: OutboxOp = {
      opId: outboxOpId,
      deviceId: dependencies.deviceId,
      entityType: "recurring-rule",
      entityId: updatedRecurringRule.id,
      opType: "update",
      ...(updatedRecurringRule.version !== null
        ? { baseVersion: updatedRecurringRule.version }
        : {}),
      payload: toRecurringRuleOutboxPayload(updatedRecurringRule),
      createdAt: updatedAt,
      status: "pending",
      attemptCount: 0,
    };

    await dependencies.outbox.append(outboxOperation);

    updatedRecurringRules.push(updatedRecurringRule);
    recurringRuleOutboxOpIds.push(outboxOpId);
  }

  return {
    generatedTransactions,
    updatedRecurringRules,
    transactionOutboxOpIds,
    recurringRuleOutboxOpIds,
  };
};

const normalizeRecurringDate = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
