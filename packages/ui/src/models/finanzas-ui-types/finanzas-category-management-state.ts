import type { FinanzasTransactionKind } from "./finanzas-transaction-kind.js";

export interface FinanzasCategoryCoverageByKindItem {
  available: boolean;
  count: number;
}

export interface FinanzasCategoryRecoveryAction {
  enabled: boolean;
  canonicalSurface: "account";
  surface: "register" | "movements";
  supportedTypes: FinanzasTransactionKind[];
}

export interface FinanzasCategoryManagementState {
  status: "empty" | "partial" | "ready";
  activeCount: number;
  coverageByKind: Record<FinanzasTransactionKind, FinanzasCategoryCoverageByKindItem>;
  availableTypes: FinanzasTransactionKind[];
  missingTypes: FinanzasTransactionKind[];
  canonicalSurface: "account";
  guardMessageByKind: Record<FinanzasTransactionKind, string>;
  createAction: {
    enabled: boolean;
    supportedTypes: FinanzasTransactionKind[];
  };
  recoveryActions: Record<"register" | "movements", FinanzasCategoryRecoveryAction>;
}
