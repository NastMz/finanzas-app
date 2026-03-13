import type {
  FinanzasCategoryOption,
  FinanzasTransactionItemViewModel,
  FinanzasTransactionKind,
} from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import styles from "./movements-editor-card.module.css";

export interface MovementsEditorDraft {
  amountInput: string;
  categoryId: string;
  dateInput: string;
  noteInput: string;
  kind: FinanzasTransactionKind;
}

export interface MovementsEditorCardProps {
  categories: FinanzasCategoryOption[];
  selectedTransaction: FinanzasTransactionItemViewModel | null;
  draft: MovementsEditorDraft | null;
  isSaving?: boolean;
  feedback?: {
    tone: "success" | "error" | "offline";
    message: string;
  } | null;
  onKindChange?: (kind: FinanzasTransactionKind) => void;
  onAmountInputChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
  onNoteChange?: (value: string) => void;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
}

const resolveSelectableCategories = (
  categories: FinanzasCategoryOption[],
  kind: FinanzasTransactionKind,
): FinanzasCategoryOption[] => categories.filter((category) => !category.deleted && category.type === kind);

const resolveFeedbackToneClass = (
  feedback: MovementsEditorCardProps["feedback"],
): string | undefined => {
  switch (feedback?.tone) {
    case "error":
      return styles.feedbackError;
    case "offline":
      return styles.feedbackOffline;
    case "success":
      return styles.feedbackSuccess;
    default:
      return undefined;
  }
};

export const MovementsEditorCard = ({
  categories,
  selectedTransaction,
  draft,
  isSaving = false,
  feedback = null,
  onKindChange,
  onAmountInputChange,
  onCategoryChange,
  onDateChange,
  onNoteChange,
  onSave,
  onCancel,
}: MovementsEditorCardProps): JSX.Element => {
  if (selectedTransaction === null || draft === null) {
    return (
      <SurfaceCard title="Editor" subtitle="Selecciona un movimiento para corregirlo">
        <p className={styles.empty}>Todavia no hay un movimiento seleccionado.</p>
      </SurfaceCard>
    );
  }

  const selectableCategories = resolveSelectableCategories(categories, draft.kind);

  return (
    <SurfaceCard title="Editor" subtitle="Correccion local con persistencia inmediata">
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void onSave?.();
        }}
      >
        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.modeButton} ${draft.kind === "expense" ? styles.modeButtonActive : ""}`}
            onClick={() => {
              onKindChange?.("expense");
            }}
          >
            Gasto
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${draft.kind === "income" ? styles.modeButtonActive : ""}`}
            onClick={() => {
              onKindChange?.("income");
            }}
          >
            Ingreso
          </button>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Monto</span>
          <input
            className={styles.input}
            inputMode="numeric"
            pattern="[0-9]*"
            value={draft.amountInput}
            onChange={(event) => {
              onAmountInputChange?.(event.target.value);
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Categoria</span>
          <select
            className={styles.input}
            value={draft.categoryId}
            onChange={(event) => {
              onCategoryChange?.(event.target.value);
            }}
          >
            {selectableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Fecha</span>
          <input
            className={styles.input}
            type="datetime-local"
            value={draft.dateInput}
            onChange={(event) => {
              onDateChange?.(event.target.value);
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Nota</span>
          <input
            className={styles.input}
            type="text"
            value={draft.noteInput}
            onChange={(event) => {
              onNoteChange?.(event.target.value);
            }}
          />
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryAction} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            disabled={isSaving}
            onClick={() => {
              onCancel?.();
            }}
          >
            Cerrar
          </button>
        </div>

        {feedback !== null
          ? (
            <p className={`${styles.feedback} ${resolveFeedbackToneClass(feedback) ?? ""}`}>
              {feedback.message}
            </p>
            )
          : null}
      </form>
    </SurfaceCard>
  );
};
