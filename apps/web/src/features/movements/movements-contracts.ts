import type {
  MovementsContinuationToken,
  MovementsReviewFilters,
} from "@finanzas/application";

import type {
  FinanzasCategoryOption,
  FinanzasMovementsTabViewModel,
  FinanzasTransactionKind,
} from "@finanzas/ui";

import type {
  CategoryCreateState,
  InteractionNotice,
} from "../shared/lib/host-orchestration.js";

export interface MovementsEditorDraft {
  amountInput: string;
  categoryId: string;
  dateInput: string;
  noteInput: string;
  kind: FinanzasTransactionKind;
}

export interface MovementsSelectionContract {
  selectedTransactionId: string | null;
  busyTransactionId: string | null;
}

export interface MovementsEditorContract {
  draft: MovementsEditorDraft | null;
  status: {
    isRefreshing: boolean;
    isSaving: boolean;
    feedback: InteractionNotice | null;
    offline: boolean;
  };
  actions: {
    onKindChange: (kind: FinanzasTransactionKind) => void;
    onAmountChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onDateChange: (value: string) => void;
    onNoteChange: (value: string) => void;
    onSave: () => void | Promise<void>;
    onCancel: () => void;
  };
}

export interface MovementsCategoryCreationContract {
  draft: CategoryCreateState;
  status: {
    isSaving: boolean;
    feedback: InteractionNotice | null;
  };
  actions: {
    onNameChange: (value: string) => void;
    onTypeChange: (kind: FinanzasTransactionKind) => void;
    onSubmit: () => void | Promise<void>;
  };
}

export interface MovementsListActionsContract {
  onToggleIncludeDeleted: () => void | Promise<void>;
  onReviewFiltersChange?: (
    filters: Partial<MovementsReviewFilters>,
  ) => void | Promise<void>;
  onLoadMore?: (
    continuation: MovementsContinuationToken,
  ) => void | Promise<void>;
  onSelectTransaction: (transactionId: string) => void;
  onDeleteTransaction: (transactionId: string) => void | Promise<void>;
}

export interface MovementsResultStateContract {
  activeFilters: MovementsReviewFilters;
  hasResults: boolean;
  hasMore: boolean;
  nextContinuation: MovementsContinuationToken | null;
  emptyState: "none" | "filtered" | "initial";
  refreshMode: "replace" | "append";
}

export interface MovementsScreenProps {
  viewModel: FinanzasMovementsTabViewModel;
  categories?: FinanzasCategoryOption[];
  selection?: MovementsSelectionContract;
  editor?: MovementsEditorContract;
  categoryCreation?: MovementsCategoryCreationContract;
  listActions?: MovementsListActionsContract;
  resultState?: MovementsResultStateContract;
}
