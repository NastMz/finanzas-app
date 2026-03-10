import { ApplicationError } from "../../../errors.js";
import {
  readAccountType,
  readArray,
  readBigInt,
  readBoolean,
  readCategoryType,
  readDate,
  readInteger,
  readNullableDate,
  readNullableString,
  readRecord,
  readRecurringRuleSchedule,
  readString,
  readStringArray,
  readVersion,
} from "./readers.js";
import type {
  ImportedAccountSnapshot,
  ImportedBudgetSnapshot,
  ImportedCategorySnapshot,
  ImportedDataBundle,
  ImportedRecurringRuleSnapshot,
  ImportedTransactionSnapshot,
  ImportedTransactionTemplateSnapshot,
} from "./types.js";
import { DATA_BUNDLE_FORMAT, DATA_BUNDLE_VERSION } from "./types.js";

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
    limitAmountMinor: readBigInt(
      record.limitAmountMinor,
      `${fieldName}.limitAmountMinor`,
    ),
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
