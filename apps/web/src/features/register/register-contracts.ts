import type { FinanzasRegisterTabViewModel, FinanzasTransactionKind } from "@finanzas/ui";

import type {
  CategoryCreateState,
  InteractionNotice,
} from "../shared/lib/host-orchestration.js";

export interface RegisterFormState {
  amountInput: string;
  noteInput: string;
  dateInput: string;
  selectedCategoryId: string | null;
  kind: FinanzasTransactionKind;
}

export interface RegisterQuickAddContract {
  form: RegisterFormState;
  status: {
    isSaving: boolean;
    feedback: InteractionNotice | null;
    offline: boolean;
  };
  actions: {
    onKindChange: (kind: FinanzasTransactionKind) => void;
    onAmountInputChange: (value: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onNoteChange: (value: string) => void;
    onDateChange: (value: string) => void;
    onSubmit: () => void | Promise<void>;
  };
}

export interface RegisterCategoryCreationContract {
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

export interface RegisterCategorySelectionContract {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export interface RegisterScreenProps {
  viewModel: FinanzasRegisterTabViewModel;
  quickAdd?: RegisterQuickAddContract;
  categoryCreation?: RegisterCategoryCreationContract;
  categorySelection?: RegisterCategorySelectionContract;
}
