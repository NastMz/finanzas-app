import type {
  FinanzasCategoryManagementState,
  FinanzasCategoryOption,
  FinanzasTransactionItemViewModel,
  FinanzasTransactionKind,
} from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import type {
  MovementsCategoryCreationContract,
  MovementsEditorContract,
} from "../movements-contracts.js";
import styles from "./movements-editor-card.module.css";

export interface MovementsEditorCardProps {
  categoryManagement: FinanzasCategoryManagementState;
  categories: FinanzasCategoryOption[];
  selectedTransaction: FinanzasTransactionItemViewModel | null;
  editor?: MovementsEditorContract;
  categoryCreation?: MovementsCategoryCreationContract;
}

const resolveSelectableCategories = (
  categories: FinanzasCategoryOption[],
  kind: FinanzasTransactionKind,
): FinanzasCategoryOption[] => categories.filter((category) => !category.deleted && category.type === kind);

const resolveFeedbackToneClass = (
  feedback: MovementsEditorContract["status"]["feedback"] | MovementsCategoryCreationContract["status"]["feedback"],
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
  categoryManagement,
  categories,
  selectedTransaction,
  editor,
  categoryCreation,
}: MovementsEditorCardProps): JSX.Element => {
  const draft = editor?.draft ?? null;
  const editorStatus = editor?.status;
  const editorActions = editor?.actions;
  const categoryDraft = categoryCreation?.draft;
  const categoryStatus = categoryCreation?.status;
  const categoryActions = categoryCreation?.actions;
  const createCategoryNameInput = categoryDraft?.nameInput ?? "";
  const createCategoryType = categoryDraft?.type ?? "expense";
  const isCreatingCategory = categoryStatus?.isSaving ?? false;
  const feedback = editorStatus?.feedback ?? null;
  const createCategoryFeedback = categoryStatus?.feedback ?? null;
  const isSaving = editorStatus?.isSaving ?? false;

  if (selectedTransaction === null || draft === null) {
    return (
      <SurfaceCard title="Editor" subtitle="Selecciona un movimiento para corregirlo">
        <p className={styles.empty}>Todavia no hay ningun movimiento seleccionado.</p>
      </SurfaceCard>
    );
  }

  const selectableCategories = resolveSelectableCategories(categories, draft.kind);

  if (selectableCategories.length === 0) {
    return (
      <SurfaceCard title="Editor" subtitle="Edita el movimiento seleccionado">
        <div className={styles.guard}>
          <p className={styles.guardTitle}>
            {draft.kind === "expense"
              ? "No hay categorias disponibles para gasto"
              : "No hay categorias disponibles para ingreso"}
          </p>
          <p className={styles.guardCopy}>{categoryManagement.guardMessageByKind[draft.kind]}</p>

          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void categoryActions?.onSubmit();
            }}
          >
            <label className={styles.field}>
              <span className={styles.label}>Nombre</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Ej. Supermercado o Sueldo"
                value={createCategoryNameInput}
                onChange={(event) => {
                  categoryActions?.onNameChange(event.target.value);
                }}
              />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Tipo</span>
              <div className={styles.modeSwitch}>
                {categoryManagement.createAction.supportedTypes.map((supportedType) => (
                  <button
                    key={supportedType}
                    type="button"
                    className={`${styles.modeButton} ${createCategoryType === supportedType ? styles.modeButtonActive : ""}`}
                    onClick={() => {
                      categoryActions?.onTypeChange(supportedType);
                    }}
                  >
                    {supportedType === "expense" ? "Gasto" : "Ingreso"}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryAction}
                disabled={isCreatingCategory || createCategoryNameInput.trim().length === 0}
              >
                {isCreatingCategory ? "Creando..." : "Crear categoria"}
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                disabled={isCreatingCategory}
                onClick={() => {
                  editorActions?.onCancel();
                }}
              >
                Cerrar
              </button>
            </div>

            {createCategoryFeedback !== null
              ? (
                <p className={`${styles.feedback} ${resolveFeedbackToneClass(createCategoryFeedback) ?? ""}`}>
                  {createCategoryFeedback.message}
                </p>
                )
              : null}
          </form>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="Editor" subtitle="Edita el movimiento seleccionado">
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void editorActions?.onSave();
        }}
      >
        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.modeButton} ${draft.kind === "expense" ? styles.modeButtonActive : ""}`}
            onClick={() => {
              editorActions?.onKindChange("expense");
            }}
          >
            Gasto
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${draft.kind === "income" ? styles.modeButtonActive : ""}`}
            onClick={() => {
              editorActions?.onKindChange("income");
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
              editorActions?.onAmountChange(event.target.value);
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Categoria</span>
          <select
            className={styles.input}
            value={draft.categoryId}
            onChange={(event) => {
              editorActions?.onCategoryChange(event.target.value);
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
              editorActions?.onDateChange(event.target.value);
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
              editorActions?.onNoteChange(event.target.value);
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
              editorActions?.onCancel();
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
