import type {
  Account,
  Budget,
  Category,
  RecurringRule,
  Transaction,
  TransactionTemplate,
} from "@finanzas/domain";
import type {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  RecurringRuleRepository,
  TransactionRepository,
  TransactionTemplateRepository,
} from "@finanzas/application";
import type { DatabaseSync } from "node:sqlite";
import {
  PERSISTENCE_COLLECTION_IDS,
  PERSISTENCE_INDEX_IDS,
} from "../persistence/persistence-schema.js";

import {
  clearTable,
  getPayloadByKey,
  listPayloads,
  listPayloadsByIndex,
  putPayload,
} from "./finanzas-sqlite.js";

export class SqliteAccountRepository implements AccountRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async findById(id: string): Promise<Account | null> {
    return getPayloadByKey<Account>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.accounts,
      id,
    );
  }

  async listAll(): Promise<Account[]> {
    return listPayloads<Account>(this.database, PERSISTENCE_COLLECTION_IDS.accounts);
  }

  async save(account: Account): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.accounts,
      account.id,
      account,
    );
  }

  async replaceAll(accounts: Account[]): Promise<void> {
    clearTable(this.database, PERSISTENCE_COLLECTION_IDS.accounts);

    for (const account of accounts) {
      await this.save(account);
    }
  }
}

export class SqliteBudgetRepository implements BudgetRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async findById(id: string): Promise<Budget | null> {
    return getPayloadByKey<Budget>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.budgets,
      id,
    );
  }

  async findActiveByCategoryIdAndPeriod(
    categoryId: string,
    period: string,
  ): Promise<Budget | null> {
    const budgets = await this.listAll();

    return (
      budgets.find(
        (budget) =>
          budget.categoryId === categoryId &&
          budget.period === period &&
          budget.deletedAt === null,
      ) ?? null
    );
  }

  async listAll(): Promise<Budget[]> {
    return listPayloads<Budget>(this.database, PERSISTENCE_COLLECTION_IDS.budgets);
  }

  async save(budget: Budget): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.budgets,
      budget.id,
      budget,
    );
  }

  async replaceAll(budgets: Budget[]): Promise<void> {
    clearTable(this.database, PERSISTENCE_COLLECTION_IDS.budgets);

    for (const budget of budgets) {
      await this.save(budget);
    }
  }
}

export class SqliteCategoryRepository implements CategoryRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async findById(id: string): Promise<Category | null> {
    return getPayloadByKey<Category>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.categories,
      id,
    );
  }

  async listAll(): Promise<Category[]> {
    return listPayloads<Category>(this.database, PERSISTENCE_COLLECTION_IDS.categories);
  }

  async save(category: Category): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.categories,
      category.id,
      category,
    );
  }

  async replaceAll(categories: Category[]): Promise<void> {
    clearTable(this.database, PERSISTENCE_COLLECTION_IDS.categories);

    for (const category of categories) {
      await this.save(category);
    }
  }
}

export class SqliteRecurringRuleRepository implements RecurringRuleRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async findById(id: string): Promise<RecurringRule | null> {
    return getPayloadByKey<RecurringRule>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.recurringRules,
      id,
    );
  }

  async findActiveByTemplateId(templateId: string): Promise<RecurringRule | null> {
    const rules = await this.listAll();

    return (
      rules.find(
        (rule) =>
          rule.templateId === templateId &&
          rule.deletedAt === null &&
          rule.isActive,
      ) ?? null
    );
  }

  async listAll(): Promise<RecurringRule[]> {
    return listPayloads<RecurringRule>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.recurringRules,
    );
  }

  async save(rule: RecurringRule): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.recurringRules,
      rule.id,
      rule,
    );
  }

  async replaceAll(rules: RecurringRule[]): Promise<void> {
    clearTable(this.database, PERSISTENCE_COLLECTION_IDS.recurringRules);

    for (const rule of rules) {
      await this.save(rule);
    }
  }
}

export class SqliteTransactionRepository implements TransactionRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async save(transaction: Transaction): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
      transaction.id,
      transaction,
    );
  }

  async findById(id: string): Promise<Transaction | null> {
    return getPayloadByKey<Transaction>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
      id,
    );
  }

  async listByAccountId(accountId: string): Promise<Transaction[]> {
    return listPayloadsByIndex<Transaction>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
      PERSISTENCE_INDEX_IDS.byAccountId,
      accountId,
    );
  }

  async listAll(): Promise<Transaction[]> {
    return listPayloads<Transaction>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
    );
  }

  async replaceAll(transactions: Transaction[]): Promise<void> {
    clearTable(this.database, PERSISTENCE_COLLECTION_IDS.transactions);

    for (const transaction of transactions) {
      await this.save(transaction);
    }
  }
}

export class SqliteTransactionTemplateRepository
implements TransactionTemplateRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async findById(id: string): Promise<TransactionTemplate | null> {
    return getPayloadByKey<TransactionTemplate>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactionTemplates,
      id,
    );
  }

  async listAll(): Promise<TransactionTemplate[]> {
    return listPayloads<TransactionTemplate>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactionTemplates,
    );
  }

  async save(template: TransactionTemplate): Promise<void> {
    putPayload(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactionTemplates,
      template.id,
      template,
    );
  }

  async replaceAll(templates: TransactionTemplate[]): Promise<void> {
    clearTable(this.database, PERSISTENCE_COLLECTION_IDS.transactionTemplates);

    for (const template of templates) {
      await this.save(template);
    }
  }
}
