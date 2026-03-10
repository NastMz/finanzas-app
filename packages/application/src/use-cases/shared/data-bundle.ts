import {
  createAccount,
  createBudget,
  createCategory,
  createMoney,
  createRecurringRule,
  createTransaction,
  createTransactionTemplate,
  type Account,
  type AccountType,
  type Budget,
  type Category,
  type CategoryType,
  type RecurringRule,
  type RecurringRuleSchedule,
  type Transaction,
  type TransactionTemplate,
} from "@finanzas/domain";

import { ApplicationError } from "../../errors.js";

export const DATA_BUNDLE_FORMAT = "finanzas-data";
export const DATA_BUNDLE_VERSION = 1;

export interface DataExportBundle {
  format: typeof DATA_BUNDLE_FORMAT;
  version: typeof DATA_BUNDLE_VERSION;
  exportedAt: string;
  entities: {
    accounts: ExportedAccountSnapshot[];
    categories: ExportedCategorySnapshot[];
    budgets: ExportedBudgetSnapshot[];
    transactionTemplates: ExportedTransactionTemplateSnapshot[];
    recurringRules: ExportedRecurringRuleSnapshot[];
    transactions: ExportedTransactionSnapshot[];
  };
}

export interface ExportedAccountSnapshot {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export interface ExportedCategorySnapshot {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export interface ExportedBudgetSnapshot {
  id: string;
  categoryId: string;
  period: string;
  limitAmountMinor: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export interface ExportedTransactionTemplateSnapshot {
  id: string;
  name: string;
  accountId: string;
  amountMinor: string;
  currency: string;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export interface ExportedRecurringRuleSnapshot {
  id: string;
  templateId: string;
  schedule: RecurringRuleSchedule;
  startsOn: string;
  nextRunOn: string;
  lastGeneratedOn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export interface ExportedTransactionSnapshot {
  id: string;
  accountId: string;
  amountMinor: string;
  currency: string;
  date: string;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}

export interface ImportedDataBundle {
  exportedAt: Date;
  accounts: ImportedAccountSnapshot[];
  categories: ImportedCategorySnapshot[];
  budgets: ImportedBudgetSnapshot[];
  transactionTemplates: ImportedTransactionTemplateSnapshot[];
  recurringRules: ImportedRecurringRuleSnapshot[];
  transactions: ImportedTransactionSnapshot[];
}

export interface ImportedAccountSnapshot {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export interface ImportedCategorySnapshot {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export interface ImportedBudgetSnapshot {
  id: string;
  categoryId: string;
  period: string;
  limitAmountMinor: bigint;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export interface ImportedTransactionTemplateSnapshot {
  id: string;
  name: string;
  accountId: string;
  amountMinor: bigint;
  currency: string;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export interface ImportedRecurringRuleSnapshot {
  id: string;
  templateId: string;
  schedule: RecurringRuleSchedule;
  startsOn: Date;
  nextRunOn: Date;
  lastGeneratedOn: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export interface ImportedTransactionSnapshot {
  id: string;
  accountId: string;
  amountMinor: bigint;
  currency: string;
  date: Date;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export const buildDataExportBundle = (input: {
  exportedAt: Date;
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  transactionTemplates: TransactionTemplate[];
  recurringRules: RecurringRule[];
  transactions: Transaction[];
}): DataExportBundle => ({
  format: DATA_BUNDLE_FORMAT,
  version: DATA_BUNDLE_VERSION,
  exportedAt: input.exportedAt.toISOString(),
  entities: {
    accounts: sortById(input.accounts).map(serializeAccountSnapshot),
    categories: sortById(input.categories).map(serializeCategorySnapshot),
    budgets: sortById(input.budgets).map(serializeBudgetSnapshot),
    transactionTemplates: sortById(input.transactionTemplates).map(
      serializeTransactionTemplateSnapshot,
    ),
    recurringRules: sortById(input.recurringRules).map(serializeRecurringRuleSnapshot),
    transactions: sortById(input.transactions).map(serializeTransactionSnapshot),
  },
});

export const parseDataImportBundle = (value: unknown): ImportedDataBundle => {
  const bundle = readRecord(value, "bundle");
  const format = readString(bundle.format, "bundle.format");
  const version = readInteger(bundle.version, "bundle.version");

  if (format !== DATA_BUNDLE_FORMAT) {
    throw new ApplicationError(`Unsupported import bundle format ${format}.`);
  }

  if (version !== DATA_BUNDLE_VERSION) {
    throw new ApplicationError(`Unsupported import bundle version ${version}.`);
  }

  const entities = readRecord(bundle.entities, "bundle.entities");

  return {
    exportedAt: readDate(bundle.exportedAt, "bundle.exportedAt"),
    accounts: parseUniqueSnapshots(
      readArray(entities.accounts, "bundle.entities.accounts"),
      "accounts",
      parseImportedAccountSnapshot,
    ),
    categories: parseUniqueSnapshots(
      readArray(entities.categories, "bundle.entities.categories"),
      "categories",
      parseImportedCategorySnapshot,
    ),
    budgets: parseUniqueSnapshots(
      readArray(entities.budgets, "bundle.entities.budgets"),
      "budgets",
      parseImportedBudgetSnapshot,
    ),
    transactionTemplates: parseUniqueSnapshots(
      readArray(
        entities.transactionTemplates,
        "bundle.entities.transactionTemplates",
      ),
      "transactionTemplates",
      parseImportedTransactionTemplateSnapshot,
    ),
    recurringRules: parseUniqueSnapshots(
      readArray(entities.recurringRules, "bundle.entities.recurringRules"),
      "recurringRules",
      parseImportedRecurringRuleSnapshot,
    ),
    transactions: parseUniqueSnapshots(
      readArray(entities.transactions, "bundle.entities.transactions"),
      "transactions",
      parseImportedTransactionSnapshot,
    ),
  };
};

export const restoreAccountFromImportSnapshot = (
  snapshot: ImportedAccountSnapshot,
): Account => ({
  ...createAccount({
    id: snapshot.id,
    name: snapshot.name,
    type: snapshot.type,
    currency: snapshot.currency,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreCategoryFromImportSnapshot = (
  snapshot: ImportedCategorySnapshot,
): Category => ({
  ...createCategory({
    id: snapshot.id,
    name: snapshot.name,
    type: snapshot.type,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreBudgetFromImportSnapshot = (
  snapshot: ImportedBudgetSnapshot,
): Budget => ({
  ...createBudget({
    id: snapshot.id,
    categoryId: snapshot.categoryId,
    period: snapshot.period,
    limit: createMoney(snapshot.limitAmountMinor, snapshot.currency),
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreTransactionTemplateFromImportSnapshot = (
  snapshot: ImportedTransactionTemplateSnapshot,
  account: Account,
): TransactionTemplate => ({
  ...createTransactionTemplate(
    {
      id: snapshot.id,
      name: snapshot.name,
      accountId: snapshot.accountId,
      amount: createMoney(snapshot.amountMinor, snapshot.currency),
      categoryId: snapshot.categoryId,
      ...(snapshot.note !== null ? { note: snapshot.note } : {}),
      tags: snapshot.tags,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    },
    account,
  ),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreRecurringRuleFromImportSnapshot = (
  snapshot: ImportedRecurringRuleSnapshot,
): RecurringRule => ({
  ...createRecurringRule({
    id: snapshot.id,
    templateId: snapshot.templateId,
    schedule: snapshot.schedule,
    startsOn: snapshot.startsOn,
    nextRunOn: snapshot.nextRunOn,
    lastGeneratedOn: snapshot.lastGeneratedOn,
    isActive: snapshot.isActive,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  }),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

export const restoreTransactionFromImportSnapshot = (
  snapshot: ImportedTransactionSnapshot,
  account: Account,
): Transaction => ({
  ...createTransaction(
    {
      id: snapshot.id,
      accountId: snapshot.accountId,
      amount: createMoney(snapshot.amountMinor, snapshot.currency),
      date: snapshot.date,
      categoryId: snapshot.categoryId,
      ...(snapshot.note !== null ? { note: snapshot.note } : {}),
      tags: snapshot.tags,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    },
    account,
  ),
  deletedAt: snapshot.deletedAt,
  version: snapshot.version,
});

const serializeAccountSnapshot = (account: Account): ExportedAccountSnapshot => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
  deletedAt: account.deletedAt ? account.deletedAt.toISOString() : null,
  version: account.version,
});

const serializeCategorySnapshot = (
  category: Category,
): ExportedCategorySnapshot => ({
  id: category.id,
  name: category.name,
  type: category.type,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
  deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
  version: category.version,
});

const serializeBudgetSnapshot = (budget: Budget): ExportedBudgetSnapshot => ({
  id: budget.id,
  categoryId: budget.categoryId,
  period: budget.period,
  limitAmountMinor: budget.limit.amountMinor.toString(),
  currency: budget.limit.currency,
  createdAt: budget.createdAt.toISOString(),
  updatedAt: budget.updatedAt.toISOString(),
  deletedAt: budget.deletedAt ? budget.deletedAt.toISOString() : null,
  version: budget.version,
});

const serializeTransactionTemplateSnapshot = (
  template: TransactionTemplate,
): ExportedTransactionTemplateSnapshot => ({
  id: template.id,
  name: template.name,
  accountId: template.accountId,
  amountMinor: template.amount.amountMinor.toString(),
  currency: template.amount.currency,
  categoryId: template.categoryId,
  note: template.note,
  tags: template.tags,
  createdAt: template.createdAt.toISOString(),
  updatedAt: template.updatedAt.toISOString(),
  deletedAt: template.deletedAt ? template.deletedAt.toISOString() : null,
  version: template.version,
});

const serializeRecurringRuleSnapshot = (
  rule: RecurringRule,
): ExportedRecurringRuleSnapshot => ({
  id: rule.id,
  templateId: rule.templateId,
  schedule: rule.schedule,
  startsOn: rule.startsOn.toISOString(),
  nextRunOn: rule.nextRunOn.toISOString(),
  lastGeneratedOn: rule.lastGeneratedOn ? rule.lastGeneratedOn.toISOString() : null,
  isActive: rule.isActive,
  createdAt: rule.createdAt.toISOString(),
  updatedAt: rule.updatedAt.toISOString(),
  deletedAt: rule.deletedAt ? rule.deletedAt.toISOString() : null,
  version: rule.version,
});

const serializeTransactionSnapshot = (
  transaction: Transaction,
): ExportedTransactionSnapshot => ({
  id: transaction.id,
  accountId: transaction.accountId,
  amountMinor: transaction.amount.amountMinor.toString(),
  currency: transaction.amount.currency,
  date: transaction.date.toISOString(),
  categoryId: transaction.categoryId,
  note: transaction.note,
  tags: transaction.tags,
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
  deletedAt: transaction.deletedAt ? transaction.deletedAt.toISOString() : null,
  version: transaction.version,
});

const parseImportedAccountSnapshot = (
  value: unknown,
  fieldName: string,
): ImportedAccountSnapshot => {
  const record = readRecord(value, fieldName);

  return {
    id: readString(record.id, `${fieldName}.id`),
    name: readString(record.name, `${fieldName}.name`),
    type: readAccountType(record.type, `${fieldName}.type`),
    currency: readString(record.currency, `${fieldName}.currency`),
    createdAt: readDate(record.createdAt, `${fieldName}.createdAt`),
    updatedAt: readDate(record.updatedAt, `${fieldName}.updatedAt`),
    deletedAt: readNullableDate(record.deletedAt, `${fieldName}.deletedAt`),
    version: readVersion(record.version, `${fieldName}.version`),
  };
};

const parseImportedCategorySnapshot = (
  value: unknown,
  fieldName: string,
): ImportedCategorySnapshot => {
  const record = readRecord(value, fieldName);

  return {
    id: readString(record.id, `${fieldName}.id`),
    name: readString(record.name, `${fieldName}.name`),
    type: readCategoryType(record.type, `${fieldName}.type`),
    createdAt: readDate(record.createdAt, `${fieldName}.createdAt`),
    updatedAt: readDate(record.updatedAt, `${fieldName}.updatedAt`),
    deletedAt: readNullableDate(record.deletedAt, `${fieldName}.deletedAt`),
    version: readVersion(record.version, `${fieldName}.version`),
  };
};

const parseImportedBudgetSnapshot = (
  value: unknown,
  fieldName: string,
): ImportedBudgetSnapshot => {
  const record = readRecord(value, fieldName);

  return {
    id: readString(record.id, `${fieldName}.id`),
    categoryId: readString(record.categoryId, `${fieldName}.categoryId`),
    period: readString(record.period, `${fieldName}.period`),
    limitAmountMinor: readBigInt(record.limitAmountMinor, `${fieldName}.limitAmountMinor`),
    currency: readString(record.currency, `${fieldName}.currency`),
    createdAt: readDate(record.createdAt, `${fieldName}.createdAt`),
    updatedAt: readDate(record.updatedAt, `${fieldName}.updatedAt`),
    deletedAt: readNullableDate(record.deletedAt, `${fieldName}.deletedAt`),
    version: readVersion(record.version, `${fieldName}.version`),
  };
};

const parseImportedTransactionTemplateSnapshot = (
  value: unknown,
  fieldName: string,
): ImportedTransactionTemplateSnapshot => {
  const record = readRecord(value, fieldName);

  return {
    id: readString(record.id, `${fieldName}.id`),
    name: readString(record.name, `${fieldName}.name`),
    accountId: readString(record.accountId, `${fieldName}.accountId`),
    amountMinor: readBigInt(record.amountMinor, `${fieldName}.amountMinor`),
    currency: readString(record.currency, `${fieldName}.currency`),
    categoryId: readString(record.categoryId, `${fieldName}.categoryId`),
    note: readNullableString(record.note, `${fieldName}.note`),
    tags: readStringArray(record.tags, `${fieldName}.tags`),
    createdAt: readDate(record.createdAt, `${fieldName}.createdAt`),
    updatedAt: readDate(record.updatedAt, `${fieldName}.updatedAt`),
    deletedAt: readNullableDate(record.deletedAt, `${fieldName}.deletedAt`),
    version: readVersion(record.version, `${fieldName}.version`),
  };
};

const parseImportedRecurringRuleSnapshot = (
  value: unknown,
  fieldName: string,
): ImportedRecurringRuleSnapshot => {
  const record = readRecord(value, fieldName);

  return {
    id: readString(record.id, `${fieldName}.id`),
    templateId: readString(record.templateId, `${fieldName}.templateId`),
    schedule: readRecurringRuleSchedule(record.schedule, `${fieldName}.schedule`),
    startsOn: readDate(record.startsOn, `${fieldName}.startsOn`),
    nextRunOn: readDate(record.nextRunOn, `${fieldName}.nextRunOn`),
    lastGeneratedOn: readNullableDate(
      record.lastGeneratedOn,
      `${fieldName}.lastGeneratedOn`,
    ),
    isActive: readBoolean(record.isActive, `${fieldName}.isActive`),
    createdAt: readDate(record.createdAt, `${fieldName}.createdAt`),
    updatedAt: readDate(record.updatedAt, `${fieldName}.updatedAt`),
    deletedAt: readNullableDate(record.deletedAt, `${fieldName}.deletedAt`),
    version: readVersion(record.version, `${fieldName}.version`),
  };
};

const parseImportedTransactionSnapshot = (
  value: unknown,
  fieldName: string,
): ImportedTransactionSnapshot => {
  const record = readRecord(value, fieldName);

  return {
    id: readString(record.id, `${fieldName}.id`),
    accountId: readString(record.accountId, `${fieldName}.accountId`),
    amountMinor: readBigInt(record.amountMinor, `${fieldName}.amountMinor`),
    currency: readString(record.currency, `${fieldName}.currency`),
    date: readDate(record.date, `${fieldName}.date`),
    categoryId: readString(record.categoryId, `${fieldName}.categoryId`),
    note: readNullableString(record.note, `${fieldName}.note`),
    tags: readStringArray(record.tags, `${fieldName}.tags`),
    createdAt: readDate(record.createdAt, `${fieldName}.createdAt`),
    updatedAt: readDate(record.updatedAt, `${fieldName}.updatedAt`),
    deletedAt: readNullableDate(record.deletedAt, `${fieldName}.deletedAt`),
    version: readVersion(record.version, `${fieldName}.version`),
  };
};

const parseUniqueSnapshots = <Snapshot extends { id: string }>(
  values: unknown[],
  entityName: string,
  parseSnapshot: (value: unknown, fieldName: string) => Snapshot,
): Snapshot[] => {
  const snapshots = values.map((value, index) =>
    parseSnapshot(value, `${entityName}[${index}]`),
  );
  const seenIds = new Set<string>();

  for (const snapshot of snapshots) {
    if (seenIds.has(snapshot.id)) {
      throw new ApplicationError(`Duplicate ${entityName} id ${snapshot.id} in bundle.`);
    }

    seenIds.add(snapshot.id);
  }

  return snapshots;
};

const sortById = <Entity extends { id: string }>(entities: Entity[]): Entity[] =>
  [...entities].sort((left, right) => left.id.localeCompare(right.id));

const readRecord = (value: unknown, fieldName: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value as Record<string, unknown>;
};

const readArray = (value: unknown, fieldName: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

const readString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

const readNullableString = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

const readDate = (value: unknown, fieldName: string): Date => {
  const date = value instanceof Date ? new Date(value) : typeof value === "string" ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return date;
};

const readNullableDate = (value: unknown, fieldName: string): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return readDate(value, fieldName);
};

const readVersion = (value: unknown, fieldName: string): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

const readInteger = (value: unknown, fieldName: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

const readBigInt = (value: unknown, fieldName: string): bigint => {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" && Number.isInteger(value)) {
    return BigInt(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new ApplicationError(`Invalid ${fieldName}.`);
};

const readBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== "boolean") {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value;
};

const readStringArray = (value: unknown, fieldName: string): string[] => {
  if (!Array.isArray(value)) {
    throw new ApplicationError(`Invalid ${fieldName}.`);
  }

  return value.map((item, index) => readString(item, `${fieldName}[${index}]`));
};

const readAccountType = (value: unknown, fieldName: string): AccountType => {
  if (value === "cash" || value === "bank" || value === "credit") {
    return value;
  }

  throw new ApplicationError(`Invalid ${fieldName}.`);
};

const readCategoryType = (value: unknown, fieldName: string): CategoryType => {
  if (value === "income" || value === "expense") {
    return value;
  }

  throw new ApplicationError(`Invalid ${fieldName}.`);
};

const readRecurringRuleSchedule = (
  value: unknown,
  fieldName: string,
): RecurringRuleSchedule => {
  const record = readRecord(value, fieldName);
  const frequency = readString(record.frequency, `${fieldName}.frequency`);
  const interval = readInteger(record.interval, `${fieldName}.interval`);

  if (frequency === "weekly") {
    return {
      frequency: "weekly",
      interval,
      dayOfWeek: readInteger(record.dayOfWeek, `${fieldName}.dayOfWeek`),
    };
  }

  if (frequency === "monthly") {
    return {
      frequency: "monthly",
      interval,
      dayOfMonth: readInteger(record.dayOfMonth, `${fieldName}.dayOfMonth`),
    };
  }

  throw new ApplicationError(`Invalid ${fieldName}.frequency.`);
};
