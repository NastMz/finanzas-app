import type {
  FinanzasCategoryManagementState,
  FinanzasTransactionKind,
} from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import styles from "./category-coverage-card.module.css";

export interface CategoryCoverageCardProps {
  categoryManagement: FinanzasCategoryManagementState;
  categoryNameInput?: string;
  categoryType?: FinanzasTransactionKind;
  isSaving?: boolean;
  feedback?: {
    tone: "success" | "error" | "offline";
    message: string;
  } | null;
  onCategoryNameChange?: (value: string) => void;
  onCategoryTypeChange?: (value: FinanzasTransactionKind) => void;
  onSubmit?: () => void | Promise<void>;
}

const resolveFeedbackToneClass = (
  feedback: CategoryCoverageCardProps["feedback"],
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

const resolveStatusLabel = (
  status: FinanzasCategoryManagementState["status"],
): string => {
  switch (status) {
    case "empty":
      return "Primer paso pendiente";
    case "partial":
      return "Faltan categorias";
    case "ready":
      return "Categorias listas";
  }
};

export const CategoryCoverageCard = ({
  categoryManagement,
  categoryNameInput = "",
  categoryType = categoryManagement.createAction.supportedTypes[0] ?? "expense",
  isSaving = false,
  feedback = null,
  onCategoryNameChange,
  onCategoryTypeChange,
  onSubmit,
}: CategoryCoverageCardProps): JSX.Element => (
  <SurfaceCard
    title="Categorias"
    subtitle="Revisa las categorias disponibles y crea las que falten."
  >
    <div className={styles.content}>
      <div className={styles.headerRow}>
        <span className={styles.statusBadge}>{resolveStatusLabel(categoryManagement.status)}</span>
        <span className={styles.canonicalBadge}>Seccion principal: Cuenta</span>
      </div>

      <ul className={styles.list} role="list">
        {(["expense", "income"] as const).map((type) => (
          <li key={type} className={styles.item}>
            <div>
              <span className={styles.label}>{type === "expense" ? "Gasto" : "Ingreso"}</span>
              <p className={styles.itemCopy}>
                {categoryManagement.coverageByKind[type].available
                  ? "Disponible"
                  : "Falta crear"}
              </p>
            </div>
            <strong className={styles.value}>{categoryManagement.coverageByKind[type].count}</strong>
          </li>
        ))}
      </ul>

      <p className={styles.summary}>
        {categoryManagement.missingTypes.length === 0
          ? "Ya tienes categorias para gasto e ingreso. Si quieres, agrega mas desde aqui."
          : `Falta agregar ${categoryManagement.missingTypes.map((type) => type === "expense" ? "gasto" : "ingreso").join(" y ")}. Puedes hacerlo desde esta pantalla.`}
      </p>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit?.();
        }}
      >
        <label className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            className={styles.input}
            type="text"
            placeholder="Ej. Supermercado o Sueldo"
            value={categoryNameInput}
            onChange={(event) => {
              onCategoryNameChange?.(event.target.value);
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
                className={`${styles.modeButton} ${categoryType === supportedType ? styles.modeButtonActive : ""}`}
                onClick={() => {
                  onCategoryTypeChange?.(supportedType);
                }}
              >
                {supportedType === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={styles.primaryAction}
          disabled={isSaving || categoryNameInput.trim().length === 0}
        >
          {isSaving ? "Creando..." : "Crear categoria"}
        </button>
      </form>

      {feedback !== null
        ? (
          <p className={`${styles.feedback} ${resolveFeedbackToneClass(feedback) ?? ""}`}>
            {feedback.message}
          </p>
          )
        : null}
    </div>
  </SurfaceCard>
);
