import type {
  Account,
  AccountType,
  Budget,
  Category,
  CategoryType,
  RecurringRule,
  RecurringRuleSchedule,
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
import {
  PERSISTENCE_COLLECTION_IDS,
  PERSISTENCE_INDEX_IDS,
  getIndexedDbIndexName,
  getIndexedDbStoreName,
} from "../persistence/persistence-schema.js";

import {
  clearStore,
  getAllRecords,
  getAllRecordsByIndex,
  getRecord,
  putRecord,
  type IndexedDbConnection,
} from "./finanzas-indexed-db.js";

interface StoredMoney {
  amountMinor: string;
  currency: string;
}

interface StoredAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

interface StoredBudget {
  id: string;
  categoryId: string;
  period: string;
  limit: StoredMoney;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

interface StoredCategory {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

type StoredRecurringRuleSchedule =
  | {
    frequency: "weekly";
    interval: number;
    dayOfWeek: number;
  }
  | {
    frequency: "monthly";
    interval: number;
    dayOfMonth: number;
  };

interface StoredRecurringRule {
  id: string;
  templateId: string;
  schedule: StoredRecurringRuleSchedule;
  startsOn: string;
  nextRunOn: string;
  lastGeneratedOn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

interface StoredTransaction {
  id: string;
  accountId: string;
  amount: StoredMoney;
  date: string;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

interface StoredTransactionTemplate {
  id: string;
  name: string;
  accountId: string;
  amount: StoredMoney;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export class IndexedDbAccountRepository implements AccountRepository {
  private readonly database: IndexedDbConnection;

  constructor(database: IndexedDbConnection) {
    this.database = database;
  }

  async findById(id: string): Promise<Account | null> {
    const record = await getRecord<StoredAccount>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.accounts,
      id,
    );

    return record ? fromStoredAccount(record) : null;
  }

  async listAll(): Promise<Account[]> {
    const records = await getAllRecords<StoredAccount>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.accounts,
    );

    return records.map(fromStoredAccount);
  }

  async save(account: Account): Promise<void> {
    await putRecord(
      this.database,
      PERSISTENCE_COLLECTION_IDS.accounts,
      toStoredAccount(account),
    );
  }

  async replaceAll(accounts: Account[]): Promise<void> {
    await clearStore(this.database, PERSISTENCE_COLLECTION_IDS.accounts);

    for (const account of accounts) {
      await this.save(account);
    }
  }
}

export class IndexedDbBudgetRepository implements BudgetRepository {
  private readonly database: IndexedDbConnection;

  constructor(database: IndexedDbConnection) {
    this.database = database;
  }

  async findById(id: string): Promise<Budget | null> {
    const record = await getRecord<StoredBudget>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.budgets,
      id,
    );

    return record ? fromStoredBudget(record) : null;
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
    const records = await getAllRecords<StoredBudget>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.budgets,
    );

    return records.map(fromStoredBudget);
  }

  async save(budget: Budget): Promise<void> {
    await putRecord(
      this.database,
      PERSISTENCE_COLLECTION_IDS.budgets,
      toStoredBudget(budget),
    );
  }

  async replaceAll(budgets: Budget[]): Promise<void> {
    await clearStore(this.database, PERSISTENCE_COLLECTION_IDS.budgets);

    for (const budget of budgets) {
      await this.save(budget);
    }
  }
}

export class IndexedDbCategoryRepository implements CategoryRepository {
  private readonly database: IndexedDbConnection;

  constructor(database: IndexedDbConnection) {
    this.database = database;
  }

  async findById(id: string): Promise<Category | null> {
    const record = await getRecord<StoredCategory>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.categories,
      id,
    );

    return record ? fromStoredCategory(record) : null;
  }

  async listAll(): Promise<Category[]> {
    const records = await getAllRecords<StoredCategory>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.categories,
    );

    return records.map(fromStoredCategory);
  }

  async save(category: Category): Promise<void> {
    await putRecord(
      this.database,
      PERSISTENCE_COLLECTION_IDS.categories,
      toStoredCategory(category),
    );
  }

  async replaceAll(categories: Category[]): Promise<void> {
    await clearStore(this.database, PERSISTENCE_COLLECTION_IDS.categories);

    for (const category of categories) {
      await this.save(category);
    }
  }
}

export class IndexedDbRecurringRuleRepository implements RecurringRuleRepository {
  private readonly database: IndexedDbConnection;

  constructor(database: IndexedDbConnection) {
    this.database = database;
  }

  async findById(id: string): Promise<RecurringRule | null> {
    const record = await getRecord<StoredRecurringRule>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.recurringRules,
      id,
    );

    return record ? fromStoredRecurringRule(record) : null;
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
    const records = await getAllRecords<StoredRecurringRule>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.recurringRules,
    );

    return records.map(fromStoredRecurringRule);
  }

  async save(rule: RecurringRule): Promise<void> {
    await putRecord(
      this.database,
      PERSISTENCE_COLLECTION_IDS.recurringRules,
      toStoredRecurringRule(rule),
    );
  }

  async replaceAll(rules: RecurringRule[]): Promise<void> {
    await clearStore(this.database, PERSISTENCE_COLLECTION_IDS.recurringRules);

    for (const rule of rules) {
      await this.save(rule);
    }
  }
}

export class IndexedDbTransactionRepository implements TransactionRepository {
  private readonly database: IndexedDbConnection;

  constructor(database: IndexedDbConnection) {
    this.database = database;
  }

  async save(transaction: Transaction): Promise<void> {
    await putRecord(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
      toStoredTransaction(transaction),
    );
  }

  async findById(id: string): Promise<Transaction | null> {
    const record = await getRecord<StoredTransaction>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
      id,
    );

    return record ? fromStoredTransaction(record) : null;
  }

  async queryWindow(query: TransactionWindowQuery): Promise<TransactionWindowResult> {
    return await queryIndexedDbTransactionsWindow(this.database, query);
  }

  async listByAccountId(accountId: string): Promise<Transaction[]> {
    const records = await getAllRecordsByIndex<StoredTransaction>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
      PERSISTENCE_INDEX_IDS.byAccountId,
      accountId,
    );

    return records.map(fromStoredTransaction);
  }

  async listAll(): Promise<Transaction[]> {
    const records = await getAllRecords<StoredTransaction>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactions,
    );

    return records.map(fromStoredTransaction);
  }

  async replaceAll(transactions: Transaction[]): Promise<void> {
    await clearStore(this.database, PERSISTENCE_COLLECTION_IDS.transactions);

    for (const transaction of transactions) {
      await this.save(transaction);
    }
  }
}

export class IndexedDbTransactionTemplateRepository
implements TransactionTemplateRepository {
  private readonly database: IndexedDbConnection;

  constructor(database: IndexedDbConnection) {
    this.database = database;
  }

  async findById(id: string): Promise<TransactionTemplate | null> {
    const record = await getRecord<StoredTransactionTemplate>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactionTemplates,
      id,
    );

    return record ? fromStoredTransactionTemplate(record) : null;
  }

  async listAll(): Promise<TransactionTemplate[]> {
    const records = await getAllRecords<StoredTransactionTemplate>(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactionTemplates,
    );

    return records.map(fromStoredTransactionTemplate);
  }

  async save(template: TransactionTemplate): Promise<void> {
    await putRecord(
      this.database,
      PERSISTENCE_COLLECTION_IDS.transactionTemplates,
      toStoredTransactionTemplate(template),
    );
  }

  async replaceAll(templates: TransactionTemplate[]): Promise<void> {
    await clearStore(this.database, PERSISTENCE_COLLECTION_IDS.transactionTemplates);

    for (const template of templates) {
      await this.save(template);
    }
  }
}

const toStoredAccount = (account: Account): StoredAccount => ({
  ...account,
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
  deletedAt: account.deletedAt ? account.deletedAt.toISOString() : null,
});

const fromStoredAccount = (account: StoredAccount): Account => ({
  ...account,
  createdAt: new Date(account.createdAt),
  updatedAt: new Date(account.updatedAt),
  deletedAt: account.deletedAt ? new Date(account.deletedAt) : null,
});

const toStoredBudget = (budget: Budget): StoredBudget => ({
  ...budget,
  limit: serializeMoney(budget.limit),
  createdAt: budget.createdAt.toISOString(),
  updatedAt: budget.updatedAt.toISOString(),
  deletedAt: budget.deletedAt ? budget.deletedAt.toISOString() : null,
});

const fromStoredBudget = (budget: StoredBudget): Budget => ({
  ...budget,
  limit: deserializeMoney(budget.limit),
  createdAt: new Date(budget.createdAt),
  updatedAt: new Date(budget.updatedAt),
  deletedAt: budget.deletedAt ? new Date(budget.deletedAt) : null,
});

const toStoredCategory = (category: Category): StoredCategory => ({
  ...category,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
  deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
});

const fromStoredCategory = (category: StoredCategory): Category => ({
  ...category,
  createdAt: new Date(category.createdAt),
  updatedAt: new Date(category.updatedAt),
  deletedAt: category.deletedAt ? new Date(category.deletedAt) : null,
});

const toStoredRecurringRule = (rule: RecurringRule): StoredRecurringRule => ({
  ...rule,
  schedule: serializeRecurringRuleSchedule(rule.schedule),
  startsOn: rule.startsOn.toISOString(),
  nextRunOn: rule.nextRunOn.toISOString(),
  lastGeneratedOn: rule.lastGeneratedOn ? rule.lastGeneratedOn.toISOString() : null,
  createdAt: rule.createdAt.toISOString(),
  updatedAt: rule.updatedAt.toISOString(),
  deletedAt: rule.deletedAt ? rule.deletedAt.toISOString() : null,
});

const fromStoredRecurringRule = (rule: StoredRecurringRule): RecurringRule => ({
  ...rule,
  schedule: deserializeRecurringRuleSchedule(rule.schedule),
  startsOn: new Date(rule.startsOn),
  nextRunOn: new Date(rule.nextRunOn),
  lastGeneratedOn: rule.lastGeneratedOn ? new Date(rule.lastGeneratedOn) : null,
  createdAt: new Date(rule.createdAt),
  updatedAt: new Date(rule.updatedAt),
  deletedAt: rule.deletedAt ? new Date(rule.deletedAt) : null,
});

const toStoredTransaction = (transaction: Transaction): StoredTransaction => ({
  ...transaction,
  amount: serializeMoney(transaction.amount),
  date: transaction.date.toISOString(),
  tags: [...transaction.tags],
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
  deletedAt: transaction.deletedAt ? transaction.deletedAt.toISOString() : null,
});

const fromStoredTransaction = (transaction: StoredTransaction): Transaction => ({
  ...transaction,
  amount: deserializeMoney(transaction.amount),
  date: new Date(transaction.date),
  tags: [...transaction.tags],
  createdAt: new Date(transaction.createdAt),
  updatedAt: new Date(transaction.updatedAt),
  deletedAt: transaction.deletedAt ? new Date(transaction.deletedAt) : null,
});

const toStoredTransactionTemplate = (
  template: TransactionTemplate,
): StoredTransactionTemplate => ({
  ...template,
  amount: serializeMoney(template.amount),
  tags: [...template.tags],
  createdAt: template.createdAt.toISOString(),
  updatedAt: template.updatedAt.toISOString(),
  deletedAt: template.deletedAt ? template.deletedAt.toISOString() : null,
});

const fromStoredTransactionTemplate = (
  template: StoredTransactionTemplate,
): TransactionTemplate => ({
  ...template,
  amount: deserializeMoney(template.amount),
  tags: [...template.tags],
  createdAt: new Date(template.createdAt),
  updatedAt: new Date(template.updatedAt),
  deletedAt: template.deletedAt ? new Date(template.deletedAt) : null,
});

const serializeMoney = (money: {
  amountMinor: bigint;
  currency: string;
}): StoredMoney => ({
  amountMinor: money.amountMinor.toString(),
  currency: money.currency,
});

const deserializeMoney = (money: StoredMoney): {
  amountMinor: bigint;
  currency: string;
} => ({
  amountMinor: BigInt(money.amountMinor),
  currency: money.currency,
});

const serializeRecurringRuleSchedule = (
  schedule: RecurringRuleSchedule,
): StoredRecurringRuleSchedule =>
  schedule.frequency === "weekly"
    ? {
        frequency: "weekly",
        interval: schedule.interval,
        dayOfWeek: schedule.dayOfWeek,
      }
    : {
        frequency: "monthly",
        interval: schedule.interval,
        dayOfMonth: schedule.dayOfMonth,
      };

const deserializeRecurringRuleSchedule = (
  schedule: StoredRecurringRuleSchedule,
): RecurringRuleSchedule =>
  schedule.frequency === "weekly"
    ? {
        frequency: "weekly",
        interval: schedule.interval,
        dayOfWeek: schedule.dayOfWeek,
      }
    : {
        frequency: "monthly",
        interval: schedule.interval,
        dayOfMonth: schedule.dayOfMonth,
      };

const queryIndexedDbTransactionsWindow = async (
  connection: IndexedDbConnection,
  query: TransactionWindowQuery,
): Promise<TransactionWindowResult> => {
  const database = await connection;
  const storeName = getIndexedDbStoreName(PERSISTENCE_COLLECTION_IDS.transactions);
  const { indexName, range } = resolveIndexedDbWindowSource(query.filters);

  return await new Promise<TransactionWindowResult>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const source = indexName === null ? store : store.index(indexName);
    const request = source.openCursor(range, "prev");
    const matches: Transaction[] = [];
    let settled = false;

    const resolveOnce = (value: TransactionWindowResult): void => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const rejectOnce = (error: unknown): void => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    request.onerror = () => {
      rejectOnce(request.error ?? new Error("IndexedDB cursor request failed."));
    };

    request.onsuccess = () => {
      const cursor = request.result;

      if (cursor === null || matches.length >= query.page.limit + 1) {
        return;
      }

      const value = cursor.value as StoredTransaction;
      const transactionRecord = fromStoredTransaction(value);

      if (
        matchesReviewFilters(transactionRecord, query.filters) &&
        isAfterContinuation(transactionRecord, query.page.continuation)
      ) {
        matches.push(transactionRecord);

        if (matches.length >= query.page.limit + 1) {
          return;
        }
      }

      cursor.continue();
    };

    transaction.oncomplete = () => {
      const hasMore = matches.length > query.page.limit;
      const transactions = matches.slice(0, query.page.limit).map(cloneTransactionForWindow);

      resolveOnce({
        transactions,
        hasMore,
        nextContinuation: hasMore
          ? createContinuationToken(query.filters, transactions.at(-1) ?? null)
          : null,
      });
    };

    transaction.onerror = () => {
      rejectOnce(transaction.error ?? new Error("IndexedDB transaction failed."));
    };

    transaction.onabort = () => {
      rejectOnce(transaction.error ?? new Error("IndexedDB transaction aborted."));
    };
  });
};

const resolveIndexedDbWindowSource = (
  filters: MovementsReviewFilters,
): {
  indexName: string | null;
  range: IDBKeyRange | null;
} => {
  const lowerDate = filters.dateRange.from?.toISOString() ?? "";
  const upperDate = filters.dateRange.to?.toISOString() ?? "\uffff";
  const maxString = "\uffff";

  if (filters.accountId !== null) {
    return {
      indexName: getIndexedDbIndexName(
        PERSISTENCE_COLLECTION_IDS.transactions,
        PERSISTENCE_INDEX_IDS.byAccountDateCreatedAtId,
      ),
      range: IDBKeyRange.bound(
        [filters.accountId, lowerDate, "", ""],
        [filters.accountId, upperDate, maxString, maxString],
      ),
    };
  }

  if (filters.categoryId !== null) {
    return {
      indexName: getIndexedDbIndexName(
        PERSISTENCE_COLLECTION_IDS.transactions,
        PERSISTENCE_INDEX_IDS.byCategoryDateCreatedAtId,
      ),
      range: IDBKeyRange.bound(
        [filters.categoryId, lowerDate, "", ""],
        [filters.categoryId, upperDate, maxString, maxString],
      ),
    };
  }

  return {
    indexName: getIndexedDbIndexName(
      PERSISTENCE_COLLECTION_IDS.transactions,
      PERSISTENCE_INDEX_IDS.byDateCreatedAtId,
    ),
    range: IDBKeyRange.bound([lowerDate, "", ""], [upperDate, maxString, maxString]),
  };
};

const matchesReviewFilters = (
  transaction: Transaction,
  filters: MovementsReviewFilters,
): boolean => {
  if (!filters.includeDeleted && transaction.deletedAt !== null) {
    return false;
  }

  if (filters.accountId !== null && transaction.accountId !== filters.accountId) {
    return false;
  }

  if (filters.categoryId !== null && transaction.categoryId !== filters.categoryId) {
    return false;
  }

  if (
    filters.dateRange.from !== null &&
    transaction.date.getTime() < filters.dateRange.from.getTime()
  ) {
    return false;
  }

  if (filters.dateRange.to !== null && transaction.date.getTime() > filters.dateRange.to.getTime()) {
    return false;
  }

  return true;
};

const isAfterContinuation = (
  transaction: Transaction,
  continuation: MovementsContinuationToken | null,
): boolean => {
  if (continuation === null) {
    return true;
  }

  const transactionDate = transaction.date.toISOString();

  if (transactionDate < continuation.lastItem.date) {
    return true;
  }

  if (transactionDate > continuation.lastItem.date) {
    return false;
  }

  const transactionCreatedAt = transaction.createdAt.toISOString();

  if (transactionCreatedAt < continuation.lastItem.createdAt) {
    return true;
  }

  if (transactionCreatedAt > continuation.lastItem.createdAt) {
    return false;
  }

  return transaction.id < continuation.lastItem.id;
};

const cloneTransactionForWindow = (transaction: Transaction): Transaction => ({
  ...transaction,
  amount: {
    ...transaction.amount,
  },
  date: new Date(transaction.date),
  tags: [...transaction.tags],
  createdAt: new Date(transaction.createdAt),
  updatedAt: new Date(transaction.updatedAt),
  deletedAt: transaction.deletedAt ? new Date(transaction.deletedAt) : null,
});

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
