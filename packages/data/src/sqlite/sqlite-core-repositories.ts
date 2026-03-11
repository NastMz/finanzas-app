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
  FINANZAS_SQLITE_TABLES,
  clearTable,
  getPayloadByKey,
  listPayloads,
  listPayloadsByColumn,
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
      FINANZAS_SQLITE_TABLES.accounts,
      "id",
      id,
    );
  }

  async listAll(): Promise<Account[]> {
    return listPayloads<Account>(this.database, FINANZAS_SQLITE_TABLES.accounts);
  }

  async save(account: Account): Promise<void> {
    putPayload(
      this.database,
      FINANZAS_SQLITE_TABLES.accounts,
      "id",
      account.id,
      account,
    );
  }

  async replaceAll(accounts: Account[]): Promise<void> {
    clearTable(this.database, FINANZAS_SQLITE_TABLES.accounts);

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
      FINANZAS_SQLITE_TABLES.budgets,
      "id",
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
    return listPayloads<Budget>(this.database, FINANZAS_SQLITE_TABLES.budgets);
  }

  async save(budget: Budget): Promise<void> {
    putPayload(
      this.database,
      FINANZAS_SQLITE_TABLES.budgets,
      "id",
      budget.id,
      budget,
    );
  }

  async replaceAll(budgets: Budget[]): Promise<void> {
    clearTable(this.database, FINANZAS_SQLITE_TABLES.budgets);

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
      FINANZAS_SQLITE_TABLES.categories,
      "id",
      id,
    );
  }

  async listAll(): Promise<Category[]> {
    return listPayloads<Category>(this.database, FINANZAS_SQLITE_TABLES.categories);
  }

  async save(category: Category): Promise<void> {
    putPayload(
      this.database,
      FINANZAS_SQLITE_TABLES.categories,
      "id",
      category.id,
      category,
    );
  }

  async replaceAll(categories: Category[]): Promise<void> {
    clearTable(this.database, FINANZAS_SQLITE_TABLES.categories);

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
      FINANZAS_SQLITE_TABLES.recurringRules,
      "id",
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
      FINANZAS_SQLITE_TABLES.recurringRules,
    );
  }

  async save(rule: RecurringRule): Promise<void> {
    putPayload(
      this.database,
      FINANZAS_SQLITE_TABLES.recurringRules,
      "id",
      rule.id,
      rule,
    );
  }

  async replaceAll(rules: RecurringRule[]): Promise<void> {
    clearTable(this.database, FINANZAS_SQLITE_TABLES.recurringRules);

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
      FINANZAS_SQLITE_TABLES.transactions,
      "id",
      transaction.id,
      transaction,
      {
        account_id: transaction.accountId,
      },
    );
  }

  async findById(id: string): Promise<Transaction | null> {
    return getPayloadByKey<Transaction>(
      this.database,
      FINANZAS_SQLITE_TABLES.transactions,
      "id",
      id,
    );
  }

  async listByAccountId(accountId: string): Promise<Transaction[]> {
    return listPayloadsByColumn<Transaction>(
      this.database,
      FINANZAS_SQLITE_TABLES.transactions,
      "account_id",
      accountId,
    );
  }

  async listAll(): Promise<Transaction[]> {
    return listPayloads<Transaction>(
      this.database,
      FINANZAS_SQLITE_TABLES.transactions,
    );
  }

  async replaceAll(transactions: Transaction[]): Promise<void> {
    clearTable(this.database, FINANZAS_SQLITE_TABLES.transactions);

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
      FINANZAS_SQLITE_TABLES.transactionTemplates,
      "id",
      id,
    );
  }

  async listAll(): Promise<TransactionTemplate[]> {
    return listPayloads<TransactionTemplate>(
      this.database,
      FINANZAS_SQLITE_TABLES.transactionTemplates,
    );
  }

  async save(template: TransactionTemplate): Promise<void> {
    putPayload(
      this.database,
      FINANZAS_SQLITE_TABLES.transactionTemplates,
      "id",
      template.id,
      template,
    );
  }

  async replaceAll(templates: TransactionTemplate[]): Promise<void> {
    clearTable(this.database, FINANZAS_SQLITE_TABLES.transactionTemplates);

    for (const template of templates) {
      await this.save(template);
    }
  }
}
