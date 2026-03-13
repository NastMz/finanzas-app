import type {
  FinanzasRegisterTabViewModel,
  FinanzasTransactionKind,
} from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import styles from "./register-quick-add-card.module.css";

/**
 * Preview card for quick-add form defaults.
 */
export interface RegisterQuickAddCardProps {
  account: FinanzasRegisterTabViewModel["account"];
  defaultDate: Date;
  defaultCategoryId: string | null;
  categories: FinanzasRegisterTabViewModel["categories"];
  amountInput?: string;
  noteInput?: string;
  dateInput?: string;
  selectedCategoryId?: string | null;
  kind?: FinanzasTransactionKind;
  isSaving?: boolean;
  feedback?: {
    tone: "success" | "error" | "offline";
    message: string;
  } | null;
  onKindChange?: (kind: FinanzasTransactionKind) => void;
  onAmountInputChange?: (value: string) => void;
  onCategoryChange?: (categoryId: string) => void;
  onNoteChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
  onSubmit?: () => void | Promise<void>;
}

const resolveDefaultCategoryName = (
  defaultCategoryId: string | null,
  categories: FinanzasRegisterTabViewModel["categories"],
): string => {
  if (defaultCategoryId === null) {
    return "Sin sugerencia automatica";
  }

  const category = categories.find((item) => item.id === defaultCategoryId);
  return category?.name ?? "Sin sugerencia automatica";
};

const resolveSelectableCategories = (
  categories: FinanzasRegisterTabViewModel["categories"],
  kind: FinanzasTransactionKind,
): FinanzasRegisterTabViewModel["categories"] =>
  categories.filter((category) => !category.deleted && category.type === kind);

const resolveFeedbackToneClass = (
  feedback: RegisterQuickAddCardProps["feedback"],
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

export const RegisterQuickAddCard = ({
  account,
  defaultDate,
  defaultCategoryId,
  categories,
  amountInput = "",
  noteInput = "",
  dateInput = defaultDate.toISOString().slice(0, 16),
  selectedCategoryId,
  kind = "expense",
  isSaving = false,
  feedback = null,
  onKindChange,
  onAmountInputChange,
  onCategoryChange,
  onNoteChange,
  onDateChange,
  onSubmit,
}: RegisterQuickAddCardProps): JSX.Element => {
  const activeCategoryId = selectedCategoryId ?? defaultCategoryId;
  const defaultCategoryName = resolveDefaultCategoryName(
    activeCategoryId,
    categories,
  );
  const selectableCategories = resolveSelectableCategories(categories, kind);

  return (
    <SurfaceCard
      title="Registro rápido"
      subtitle="Alta real sobre la cuenta activa"
      className={styles.quickCard ?? ""}
      contentClassName={styles.quickContent ?? ""}
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit?.();
        }}
      >
        <section className={styles.amountField} aria-label="Monto de transaccion">
        <div className={styles.amountHeader}>
          <span className={styles.amountLabel}>Monto</span>
          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={`${styles.modeButton} ${kind === "expense" ? styles.modeButtonActive : ""}`}
              onClick={() => {
                onKindChange?.("expense");
              }}
            >
              Gasto
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${kind === "income" ? styles.modeButtonActive : ""}`}
              onClick={() => {
                onKindChange?.("income");
              }}
            >
              Ingreso
            </button>
          </div>
        </div>

          <label className={styles.amountInputWrap}>
            <span className={styles.currency}>{account.currency}</span>
            <input
              className={styles.amountInput}
              name="amountMinor"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="120000"
              value={amountInput}
              onChange={(event) => {
                onAmountInputChange?.(event.target.value);
              }}
            />
          </label>

          <p className={styles.amountHelper}>
            Captura directa con persistencia local inmediata y cola de sync si aplica.
          </p>
        </section>

        <div className={styles.fieldList}>
          <div className={styles.inputRow}>
            <span className={styles.label}>Cuenta</span>
            <span className={styles.value}>{account.name}</span>
          </div>
          <label className={styles.inputRow}>
            <span className={styles.label}>Categoria</span>
            <select
              className={styles.select}
              value={activeCategoryId ?? ""}
              onChange={(event) => {
                onCategoryChange?.(event.target.value);
              }}
            >
              {selectableCategories.length === 0
                ? <option value="">Sin categorias activas</option>
                : selectableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
          <label className={styles.inputRow}>
            <span className={styles.label}>Fecha</span>
            <input
              className={styles.input}
              type="datetime-local"
              value={dateInput}
              onChange={(event) => {
                onDateChange?.(event.target.value);
              }}
            />
          </label>
          <label className={styles.inputRow}>
            <span className={styles.label}>Nota</span>
            <input
              className={styles.input}
              type="text"
              placeholder="Mercado, taxi, reembolso..."
              value={noteInput}
              onChange={(event) => {
                onNoteChange?.(event.target.value);
              }}
            />
          </label>
        </div>

        <div className={styles.footerBar}>
          <p className={styles.footerCopy}>
            {defaultCategoryName === "Sin sugerencia automatica"
              ? "Elegi una categoria para guardar el movimiento."
              : `Sugerencia activa: ${defaultCategoryName}.`}
          </p>
          <button
            type="submit"
            className={styles.primaryAction}
            disabled={isSaving || selectableCategories.length === 0}
          >
            {isSaving ? "Guardando..." : "Registrar movimiento"}
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
