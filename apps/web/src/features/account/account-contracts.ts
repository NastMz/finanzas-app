import type { FinanzasAccountTabViewModel, FinanzasTransactionKind } from "@finanzas/ui";

import type {
  CategoryCreateState,
  InteractionNotice,
} from "../shared/lib/host-orchestration.js";

export interface AccountCategoryCreationContract {
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

export interface AccountScreenProps {
  viewModel: FinanzasAccountTabViewModel;
  categoryCreation?: AccountCategoryCreationContract;
}
