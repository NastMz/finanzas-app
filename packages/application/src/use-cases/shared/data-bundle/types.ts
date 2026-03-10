import type {
  AccountType,
  CategoryType,
  RecurringRuleSchedule,
} from "@finanzas/domain";

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
