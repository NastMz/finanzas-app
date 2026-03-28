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
  MovementsContinuationToken,
  MovementsReviewFilters,
  RecurringRuleRepository,
  TransactionRepository,
  TransactionWindowQuery,
  TransactionWindowResult,
  TransactionTemplateRepository,
} from "@finanzas/application";
import type { DatabaseSync } from "node:sqlite";
import {
  PERSISTENCE_COLLECTION_IDS,
  PERSISTENCE_INDEX_IDS,
} from "../persistence/persistence-schema.js";

import {
  FINANZAS_SQLITE_TABLES,
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

  async queryWindow(query: TransactionWindowQuery): Promise<TransactionWindowResult> {
    const tableName = FINANZAS_SQLITE_TABLES.transactions;
    const payloadColumn = "payload";
    const whereParts: string[] = [];
    const parameters: Array<string | number | null> = [];

    if (!query.filters.includeDeleted) {
      whereParts.push("deleted_at IS NULL");
    }

    if (query.filters.accountId !== null) {
      whereParts.push("account_id = ?");
      parameters.push(query.filters.accountId);
    }

    if (query.filters.categoryId !== null) {
      whereParts.push("category_id = ?");
      parameters.push(query.filters.categoryId);
    }

    if (query.filters.dateRange.from !== null) {
      whereParts.push("transaction_date >= ?");
      parameters.push(query.filters.dateRange.from.toISOString());
    }

    if (query.filters.dateRange.to !== null) {
      whereParts.push("transaction_date <= ?");
      parameters.push(query.filters.dateRange.to.toISOString());
    }

    if (query.page.continuation !== null) {
      whereParts.push(`(
        transaction_date < ?
        OR (transaction_date = ? AND created_at < ?)
        OR (transaction_date = ? AND created_at = ? AND id < ?)
      )`);
      parameters.push(
        query.page.continuation.lastItem.date,
        query.page.continuation.lastItem.date,
        query.page.continuation.lastItem.createdAt,
        query.page.continuation.lastItem.date,
        query.page.continuation.lastItem.createdAt,
        query.page.continuation.lastItem.id,
      );
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const rows = this.database
      .prepare(
        `SELECT ${payloadColumn} AS payload
         FROM ${tableName}
         ${whereClause}
         ORDER BY transaction_date DESC, created_at DESC, id DESC
         LIMIT ?`,
      )
      .all(...parameters, query.page.limit + 1) as Array<{ payload: string }>;
    const decoded = rows.map((row) => deserializeSqliteTransactionPayload(row.payload));
    const hasMore = decoded.length > query.page.limit;
    const transactions = decoded.slice(0, query.page.limit);

    return {
      transactions,
      hasMore,
      nextContinuation: hasMore
        ? createContinuationToken(query.filters, transactions.at(-1) ?? null)
        : null,
    };
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

const deserializeSqliteTransactionPayload = (payload: string): Transaction => {
  const value = JSON.parse(payload) as null | boolean | number | string | unknown[] | Record<string, unknown>;
  return decodeSqlitePayloadNode(value) as Transaction;
};

const decodeSqlitePayloadNode = (value: unknown): unknown => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => decodeSqlitePayloadNode(item));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (record.__finanzasPersistType === "bigint" && typeof record.value === "string") {
      return BigInt(record.value);
    }

    if (record.__finanzasPersistType === "date" && typeof record.value === "string") {
      return new Date(record.value);
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [key, decodeSqlitePayloadNode(item)]),
    );
  }

  return value;
};

const createContinuationToken = (
  filters: MovementsReviewFilters,
  transaction: Transaction | null,
): MovementsContinuationToken | null => {
  if (transaction === null) {
    return null;
  }

  return {
    filterFingerprint: JSON.stringify({
      dateRange: {
        from: filters.dateRange.from?.toISOString() ?? null,
        to: filters.dateRange.to?.toISOString() ?? null,
      },
      accountId: filters.accountId,
      categoryId: filters.categoryId,
      includeDeleted: filters.includeDeleted,
    }),
    lastItem: {
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      id: transaction.id,
    },
  };
};
