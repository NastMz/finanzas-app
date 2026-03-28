import { useEffect, useMemo, useState } from "react";
import type {
  MovementsContinuationToken,
  MovementsReviewFilters,
} from "@finanzas/application";
import type {
  FinanzasCategoryOption,
  FinanzasMovementsTabViewModel,
  FinanzasTransactionItemViewModel,
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
  MovementsCategoryCreationContract,
  MovementsEditorContract,
  MovementsEditorDraft,
  MovementsListActionsContract,
  MovementsScreenProps,
  MovementsSelectionContract,
} from "../movements-contracts.js";

interface MovementsMutationPort {
  updateTransaction: (input: {
    transactionId: string;
    amountMinor: bigint;
    categoryId: string;
    date: Date;
    note: string;
  }) => Promise<unknown>;
  deleteTransaction: (input: { transactionId: string }) => Promise<unknown>;
  createCategory: FinanzasUiServiceContract["createCategory"];
}

export interface UseMovementsOrchestrationInput {
  viewModel: FinanzasMovementsTabViewModel;
  categories: FinanzasCategoryOption[];
  offline: boolean;
  refreshHost: HostRefreshAdapter;
  mutations: MovementsMutationPort;
}

export const createMovementDraft = (
  transaction: FinanzasTransactionItemViewModel | null,
): MovementsEditorDraft | null => {
  if (transaction === null || transaction.deleted) {
    return null;
  }

  return {
    amountInput: transaction.amountMinor.toString(),
    categoryId: transaction.categoryId,
    dateInput: toDateTimeLocalValue(transaction.date),
    noteInput: transaction.note ?? "",
    kind: transaction.kind,
  };
};

export const resolveNextSelectedTransactionId = (
  items: FinanzasTransactionItemViewModel[],
  preferredId: string | null,
): string | null => {
  const preferred = items.find((item) => item.id === preferredId && !item.deleted);

  if (preferred !== undefined) {
    return preferred.id;
  }

  return items.find((item) => !item.deleted)?.id ?? null;
};

export const createMovementsResultState = (
  viewModel: FinanzasMovementsTabViewModel,
): MovementsScreenProps["resultState"] => {
  const review = resolveRequiredReviewState(viewModel);

  return {
    activeFilters: review.filters,
    hasResults: viewModel.items.length > 0,
    hasMore: review.page.hasMore,
    nextContinuation: review.page.nextContinuation,
    emptyState: viewModel.items.length === 0 ? "filtered" : "none",
    refreshMode: review.mode,
  };
};

export const createMovementsFilterRefreshOptions = (
  viewModel: FinanzasMovementsTabViewModel,
  filters: Partial<MovementsReviewFilters>,
): Parameters<HostRefreshAdapter["refresh"]>[0] => {
  const review = resolveRequiredReviewState(viewModel);

  return {
    movements: {
      filters,
      page: {
        limit: review.page.limit,
        continuation: null,
      },
      mode: "replace",
    },
  };
};

export const createMovementsCorrectionRefreshOptions = (
  viewModel: FinanzasMovementsTabViewModel,
  preferredTransactionId: string | null,
): Parameters<HostRefreshAdapter["refresh"]>[0] => {
  const review = resolveRequiredReviewState(viewModel);

  return {
    movements: {
      filters: review.filters,
      page: {
        limit: review.page.limit,
        continuation: null,
      },
      mode: "replace",
    },
    preferredTransactionId,
  };
};

export const createMovementsLoadMoreRefreshOptions = (
  viewModel: FinanzasMovementsTabViewModel,
  continuation: MovementsContinuationToken,
): Parameters<HostRefreshAdapter["refresh"]>[0] => {
  const review = resolveRequiredReviewState(viewModel);

  return {
    movements: {
      filters: review.filters,
      page: {
        limit: review.page.limit,
        continuation,
      },
      mode: "append",
    },
  };
};

export const useMovementsOrchestration = ({
  viewModel,
  categories,
  offline,
  refreshHost,
  mutations,
}: UseMovementsOrchestrationInput): {
  selection: MovementsSelectionContract;
  editor: MovementsEditorContract;
  categoryCreation: MovementsCategoryCreationContract;
  listActions: MovementsListActionsContract;
} => {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(
    () => resolveNextSelectedTransactionId(viewModel.items, null),
  );
  const [draft, setDraft] = useState<MovementsEditorDraft | null>(() => {
    const initialTransaction = viewModel.items.find(
      (item) => item.id === resolveNextSelectedTransactionId(viewModel.items, null),
    ) ?? null;
    return createMovementDraft(initialTransaction);
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busyTransactionId, setBusyTransactionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<MovementsEditorContract["status"]["feedback"]>(null);
  const [categoryDraft, setCategoryDraft] = useState(() => createCategoryCreateState("expense"));
  const [categoryFeedback, setCategoryFeedback] = useState<MovementsCategoryCreationContract["status"]["feedback"]>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const selectedTransaction = useMemo(
    () => viewModel.items.find((item) => item.id === selectedTransactionId) ?? null,
    [viewModel.items, selectedTransactionId],
  );

  useEffect(() => {
    setDraft(createMovementDraft(selectedTransaction));
  }, [selectedTransaction]);

  useEffect(() => {
    setDraft((current) => {
      if (current === null) {
        return current;
      }

      const resolvedCategoryId = resolveCategoryForKind(
        categories,
        current.kind,
        current.categoryId,
      );

      if (resolvedCategoryId === null || resolvedCategoryId === current.categoryId) {
        return current;
      }

      return {
        ...current,
        categoryId: resolvedCategoryId,
      };
    });
  }, [categories]);

  const handleReviewFiltersChange = async (
    filters: Partial<MovementsReviewFilters>,
  ): Promise<void> => {
    const preferredId = selectedTransactionId;
    setIsRefreshing(true);
    setFeedback(null);

    try {
      const refreshed = await refreshHost.refresh(
        createMovementsFilterRefreshOptions(viewModel, filters),
      );
      setSelectedTransactionId(
        resolveNextSelectedTransactionId(refreshed.movements.items, preferredId),
      );
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo actualizar la lista.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async (
    continuation: MovementsContinuationToken,
  ): Promise<void> => {
    const preferredId = selectedTransactionId;
    setIsRefreshing(true);
    setFeedback(null);

    try {
      const refreshed = await refreshHost.refresh(
        createMovementsLoadMoreRefreshOptions(viewModel, continuation),
      );
      setSelectedTransactionId(
        resolveNextSelectedTransactionId(refreshed.movements.items, preferredId),
      );
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo cargar mas movimientos.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleKindChange = (kind: FinanzasTransactionKind): void => {
    setDraft((current) => {
      if (current === null) {
        return current;
      }

      return {
        ...current,
        kind,
        categoryId: resolveCategoryForKind(categories, kind, current.categoryId) ?? "",
      };
    });
  };

  const handleSave = async (): Promise<void> => {
    if (selectedTransaction === null || draft === null) {
      setFeedback({
        tone: "error",
        message: "Selecciona un movimiento activo antes de guardar cambios.",
      });
      return;
    }

    const amountMinor = parseMinorAmount(draft.amountInput);

    if (amountMinor === null) {
      setFeedback({
        tone: "error",
        message: "El monto tiene que ser un entero positivo en unidades menores.",
      });
      return;
    }

    const transactionDate = new Date(draft.dateInput);

    if (Number.isNaN(transactionDate.valueOf())) {
      setFeedback({
        tone: "error",
        message: "La fecha no es valida.",
      });
      return;
    }

    setIsSaving(true);
    setBusyTransactionId(selectedTransaction.id);
    setFeedback(null);

    try {
      await mutations.updateTransaction({
        transactionId: selectedTransaction.id,
        amountMinor: draft.kind === "expense" ? -amountMinor : amountMinor,
        categoryId: draft.categoryId,
        date: transactionDate,
        note: draft.noteInput.trim(),
      });
      const refreshed = await refreshHost.refresh(
        createMovementsCorrectionRefreshOptions(viewModel, selectedTransaction.id),
      );
      setSelectedTransactionId(
        resolveNextSelectedTransactionId(refreshed.movements.items, selectedTransaction.id),
      );
      setFeedback({
        tone: offline ? "offline" : "success",
        message: offline
          ? "Cambio guardado en este dispositivo. Se actualiza cuando vuelva la conexion."
          : "Movimiento actualizado y resumen recalculado.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo actualizar el movimiento.",
      });
    } finally {
      setIsSaving(false);
      setBusyTransactionId(null);
    }
  };

  const handleDeleteTransaction = async (transactionId: string): Promise<void> => {
    if (!globalThis.confirm?.("Eliminar este movimiento?")) {
      return;
    }

    setBusyTransactionId(transactionId);
    setFeedback(null);

    try {
      await mutations.deleteTransaction({
        transactionId,
      });
      const refreshed = await refreshHost.refresh(
        createMovementsCorrectionRefreshOptions(viewModel, null),
      );
      setSelectedTransactionId(resolveNextSelectedTransactionId(refreshed.movements.items, null));
      setFeedback({
        tone: offline ? "offline" : "success",
        message: offline
          ? "Movimiento eliminado en este dispositivo. Se actualiza cuando vuelva la conexion."
          : "Movimiento eliminado y lista actualizada.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo eliminar el movimiento.",
      });
    } finally {
      setBusyTransactionId(null);
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
      const refreshed = await refreshHost.refresh(
        createMovementsCorrectionRefreshOptions(viewModel, selectedTransactionId),
      );
      setSelectedTransactionId(
        resolveNextSelectedTransactionId(refreshed.movements.items, selectedTransactionId),
      );
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
    selection: {
      selectedTransactionId,
      busyTransactionId,
    },
    editor: {
      draft,
      status: {
        isRefreshing,
        isSaving,
        feedback,
        offline,
      },
      actions: {
        onKindChange: handleKindChange,
        onAmountChange: (value) => {
          setDraft((current) => current === null ? current : { ...current, amountInput: value });
        },
        onCategoryChange: (value) => {
          setDraft((current) => current === null ? current : { ...current, categoryId: value });
        },
        onDateChange: (value) => {
          setDraft((current) => current === null ? current : { ...current, dateInput: value });
        },
        onNoteChange: (value) => {
          setDraft((current) => current === null ? current : { ...current, noteInput: value });
        },
        onSave: handleSave,
        onCancel: () => {
          setSelectedTransactionId(null);
          setFeedback(null);
        },
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
    listActions: {
      onToggleIncludeDeleted: () =>
        handleReviewFiltersChange({
          includeDeleted: !resolveRequiredReviewState(viewModel).filters.includeDeleted,
        }),
      onReviewFiltersChange: handleReviewFiltersChange,
      onLoadMore: handleLoadMore,
      onSelectTransaction: (transactionId) => {
        setSelectedTransactionId(transactionId);
        setFeedback(null);
      },
      onDeleteTransaction: handleDeleteTransaction,
    },
  };
};

const resolveRequiredReviewState = (
  viewModel: FinanzasMovementsTabViewModel,
): NonNullable<FinanzasMovementsTabViewModel["review"]> => {
  if (viewModel.review === undefined) {
    throw new Error("Movements review metadata is required for orchestration.");
  }

  return viewModel.review;
};
