import { useState } from "react";
import type { FinanzasAccountTabViewModel, FinanzasUiServiceContract } from "@finanzas/ui";

import {
  createCategoryCreateState,
  type HostRefreshAdapter,
} from "../../shared/lib/host-orchestration.js";
import type { AccountCategoryCreationContract } from "../account-contracts.js";

interface AccountMutationPort {
  createCategory: FinanzasUiServiceContract["createCategory"];
}

export interface UseAccountOrchestrationInput {
  viewModel: FinanzasAccountTabViewModel;
  offline: boolean;
  refreshHost: HostRefreshAdapter;
  mutations: AccountMutationPort;
}

export const useAccountOrchestration = ({
  viewModel: _viewModel,
  offline,
  refreshHost,
  mutations,
}: UseAccountOrchestrationInput): {
  categoryCreation: AccountCategoryCreationContract;
} => {
  const [draft, setDraft] = useState(() => createCategoryCreateState("expense"));
  const [feedback, setFeedback] = useState<AccountCategoryCreationContract["status"]["feedback"]>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateCategory = async (): Promise<void> => {
    const name = draft.nameInput.trim();

    if (name.length === 0) {
      setFeedback({
        tone: "error",
        message: "Ingresa un nombre para la categoria.",
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await mutations.createCategory({
        name,
        type: draft.type,
      });
      await refreshHost.refresh({
        resetRegisterForm: true,
      });
      setDraft(createCategoryCreateState(draft.type));
      setFeedback({
        tone: offline ? "offline" : "success",
        message: offline
          ? "Categoria creada en este dispositivo. Se actualiza cuando vuelva la conexion."
          : "Categoria creada. Ya puedes continuar desde esta pantalla.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo crear la categoria.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    categoryCreation: {
      draft,
      status: {
        isSaving,
        feedback,
      },
      actions: {
        onNameChange: (value) => {
          setDraft((current) => ({ ...current, nameInput: value }));
        },
        onTypeChange: (kind) => {
          setDraft((current) => ({ ...current, type: kind }));
        },
        onSubmit: handleCreateCategory,
      },
    },
  };
};
