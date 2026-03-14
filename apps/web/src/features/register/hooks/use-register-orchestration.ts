import { useEffect, useState } from "react";
import type {
  FinanzasRegisterTabViewModel,
  FinanzasTransactionKind,
  FinanzasUiServiceContract,
} from "@finanzas/ui";

import {
  createCategoryCreateState,
  parseMinorAmount,
  resolveCategoryForKind,
  toDateTimeLocalValue,
  type HostRefreshAdapter,
} from "../../shared/lib/host-orchestration.js";
import type {
  RegisterCategoryCreationContract,
  RegisterCategorySelectionContract,
  RegisterFormState,
  RegisterQuickAddContract,
} from "../register-contracts.js";

interface RegisterMutationPort {
  quickAddTransaction: FinanzasUiServiceContract["quickAddTransaction"];
  createCategory: FinanzasUiServiceContract["createCategory"];
}

export interface UseRegisterOrchestrationInput {
  viewModel: FinanzasRegisterTabViewModel;
  accountId: string;
  offline: boolean;
  resetVersion: number;
  refreshHost: HostRefreshAdapter;
  mutations: RegisterMutationPort;
}

const resolveDefaultKind = (
  viewModel: FinanzasRegisterTabViewModel,
): FinanzasTransactionKind => {
  if (viewModel.defaultCategoryId !== null) {
    return viewModel.categories.find((category) => category.id === viewModel.defaultCategoryId)?.type ?? "expense";
  }

  if (viewModel.categoryManagement.coverageByKind.expense.available) {
    return "expense";
  }

  if (viewModel.categoryManagement.coverageByKind.income.available) {
    return "income";
  }

  return "expense";
};

export const createRegisterFormState = (
  viewModel: FinanzasRegisterTabViewModel,
): RegisterFormState => {
  const defaultKind = resolveDefaultKind(viewModel);
  const defaultCategory = viewModel.categories.find(
    (category) => category.id === viewModel.defaultCategoryId,
  );
  const kind = defaultCategory?.type ?? defaultKind;

  return {
    amountInput: "",
    noteInput: "",
    dateInput: toDateTimeLocalValue(viewModel.defaultDate),
    selectedCategoryId: resolveCategoryForKind(
      viewModel.categories,
      kind,
      viewModel.defaultCategoryId,
    ),
    kind,
  };
};

export const useRegisterOrchestration = ({
  viewModel,
  accountId,
  offline,
  resetVersion,
  refreshHost,
  mutations,
}: UseRegisterOrchestrationInput): {
  quickAdd: RegisterQuickAddContract;
  categoryCreation: RegisterCategoryCreationContract;
  categorySelection: RegisterCategorySelectionContract;
} => {
  const [form, setForm] = useState(() => createRegisterFormState(viewModel));
  const [feedback, setFeedback] = useState<RegisterQuickAddContract["status"]["feedback"]>(null);
  const [categoryDraft, setCategoryDraft] = useState(() => createCategoryCreateState("expense"));
  const [categoryFeedback, setCategoryFeedback] = useState<RegisterCategoryCreationContract["status"]["feedback"]>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (resetVersion === 0) {
      return;
    }

    setForm(createRegisterFormState(viewModel));
  }, [resetVersion, viewModel]);

  const handleKindChange = (kind: FinanzasTransactionKind): void => {
    setForm((current) => ({
      ...current,
      kind,
      selectedCategoryId: resolveCategoryForKind(
        viewModel.categories,
        kind,
        current.selectedCategoryId,
      ),
    }));
  };

  const handleCategoryChange = (categoryId: string): void => {
    const selectedCategory = viewModel.categories.find((category) => category.id === categoryId);

    setForm((current) => ({
      ...current,
      selectedCategoryId: categoryId,
      kind: selectedCategory?.type ?? current.kind,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    const amountMinor = parseMinorAmount(form.amountInput);

    if (amountMinor === null) {
      setFeedback({
        tone: "error",
        message: "El monto tiene que ser un entero positivo en unidades menores.",
      });
      return;
    }

    if (form.selectedCategoryId === null) {
      setFeedback({
        tone: "error",
        message: "Elige una categoria activa antes de guardar.",
      });
      return;
    }

    const transactionDate = new Date(form.dateInput);

    if (Number.isNaN(transactionDate.valueOf())) {
      setFeedback({
        tone: "error",
        message: "La fecha no es valida.",
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await mutations.quickAddTransaction({
        accountId,
        amountMinor,
        categoryId: form.selectedCategoryId,
        date: transactionDate,
        kind: form.kind,
        note: form.noteInput.trim(),
      });

      const refreshed = await refreshHost.refresh({
        preferredTransactionId: result.transactionId,
        resetRegisterForm: true,
      });
      setForm(createRegisterFormState(refreshed.register));
      setFeedback({
        tone: offline ? "offline" : "success",
        message: offline
          ? "Movimiento guardado en este dispositivo. Se actualiza cuando vuelva la conexion."
          : "Movimiento registrado y reflejado en Movimientos.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo registrar el movimiento.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async (): Promise<void> => {
    const name = categoryDraft.nameInput.trim();

    if (name.length === 0) {
      setCategoryFeedback({
        tone: "error",
        message: "Ingresa un nombre para la categoria.",
      });
      return;
    }

    setIsCreatingCategory(true);
    setCategoryFeedback(null);

    try {
      await mutations.createCategory({
        name,
        type: categoryDraft.type,
      });
      const refreshed = await refreshHost.refresh({
        resetRegisterForm: true,
      });
      setForm(createRegisterFormState(refreshed.register));
      setCategoryDraft(createCategoryCreateState(categoryDraft.type));
      setCategoryFeedback({
        tone: offline ? "offline" : "success",
        message: offline
          ? "Categoria creada en este dispositivo. Se actualiza cuando vuelva la conexion."
          : "Categoria creada. Ya puedes continuar desde esta pantalla.",
      });
    } catch (error) {
      setCategoryFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo crear la categoria.",
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return {
    quickAdd: {
      form,
      status: {
        isSaving,
        feedback,
        offline,
      },
      actions: {
        onKindChange: handleKindChange,
        onAmountInputChange: (value) => {
          setForm((current) => ({ ...current, amountInput: value }));
        },
        onCategoryChange: handleCategoryChange,
        onNoteChange: (value) => {
          setForm((current) => ({ ...current, noteInput: value }));
        },
        onDateChange: (value) => {
          setForm((current) => ({ ...current, dateInput: value }));
        },
        onSubmit: handleSubmit,
      },
    },
    categoryCreation: {
      draft: categoryDraft,
      status: {
        isSaving: isCreatingCategory,
        feedback: categoryFeedback,
      },
      actions: {
        onNameChange: (value) => {
          setCategoryDraft((current) => ({ ...current, nameInput: value }));
        },
        onTypeChange: (kind) => {
          setCategoryDraft((current) => ({ ...current, type: kind }));
        },
        onSubmit: handleCreateCategory,
      },
    },
    categorySelection: {
      selectedCategoryId: form.selectedCategoryId,
      onSelectCategory: handleCategoryChange,
    },
  };
};
