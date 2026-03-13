import type {
  FinanzasCategoryManagementState,
  FinanzasTransactionKind,
} from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import styles from "./register-category-onboarding-card.module.css";

export interface RegisterCategoryOnboardingCardProps {
  categoryManagement: FinanzasCategoryManagementState;
  surfaceMode?: "empty" | "partial";
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
  feedback: RegisterCategoryOnboardingCardProps["feedback"],
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

export const RegisterCategoryOnboardingCard = ({
  categoryManagement,
  surfaceMode = categoryManagement.status === "empty" ? "empty" : "partial",
  categoryNameInput = "",
  categoryType = categoryManagement.createAction.supportedTypes[0] ?? "expense",
  isSaving = false,
  feedback = null,
  onCategoryNameChange,
  onCategoryTypeChange,
  onSubmit,
}: RegisterCategoryOnboardingCardProps): JSX.Element => {
  const missingTypesLabel = categoryManagement.missingTypes
    .map((type) => type === "expense" ? "gasto" : "ingreso")
    .join(" y ");
  const feedbackContent = feedback !== null
    ? (
      <p className={`${styles.feedback} ${resolveFeedbackToneClass(feedback) ?? ""}`}>
        {feedback.message}
      </p>
      )
    : null;

  return (
  <SurfaceCard
    title={surfaceMode === "empty" ? "Todavia no tienes categorias activas" : `Falta una categoria para ${missingTypesLabel}`}
    subtitle={surfaceMode === "empty"
      ? "Empieza creando una categoria y despues puedes administrarlas desde Cuenta."
      : "Completa la categoria que falta para seguir registrando desde aqui o desde Cuenta."}
    className={styles.card ?? ""}
    contentClassName={styles.content ?? ""}
  >
      <p className={styles.copy}>
        {surfaceMode === "empty"
          ? "Para registrar movimientos necesitas al menos una categoria. Crea la primera y despues puedes sumar las demas desde Cuenta."
          : `Todavia falta una categoria de ${missingTypesLabel}. Creala aqui para seguir usando el registro.`}
      </p>

    <div className={styles.metrics}>
      <article className={styles.metric}>
        <span className={styles.metricLabel}>Gastos</span>
        <strong className={styles.metricValue}>{categoryManagement.coverageByKind.expense.count}</strong>
      </article>
      <article className={styles.metric}>
        <span className={styles.metricLabel}>Ingresos</span>
        <strong className={styles.metricValue}>{categoryManagement.coverageByKind.income.count}</strong>
      </article>
    </div>

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
        {isSaving
          ? "Creando..."
          : surfaceMode === "empty"
            ? "Crear primera categoria"
            : "Crear categoria pendiente"}
      </button>
    </form>

    {feedbackContent}
  </SurfaceCard>
  );
};
