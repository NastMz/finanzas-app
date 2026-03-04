import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

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
}

const formatDateLabel = (value: Date): string =>
  value.toISOString().slice(0, 16).replace("T", " ");

const resolveDefaultCategoryName = (
  defaultCategoryId: string | null,
  categories: FinanzasRegisterTabViewModel["categories"],
): string => {
  if (defaultCategoryId === null) {
    return "Sin sugerencia automática";
  }

  const category = categories.find((item) => item.id === defaultCategoryId);
  return category?.name ?? "Sin sugerencia automática";
};

export const RegisterQuickAddCard = ({
  account,
  defaultDate,
  defaultCategoryId,
  categories,
}: RegisterQuickAddCardProps): JSX.Element => {
  const defaultCategoryName = resolveDefaultCategoryName(
    defaultCategoryId,
    categories,
  );

  return (
    <SurfaceCard
      title="Registro rápido"
      subtitle="Defaults listos para capturar"
      className={styles.quickCard ?? ""}
      contentClassName={styles.quickContent ?? ""}
    >
      <section className={styles.amountField} aria-label="Monto de transacción">
        <span className={styles.amountLabel}>Monto</span>
        <p className={styles.amountValue}>
          <span className={styles.currency}>{account.currency}</span>
          <span className={styles.amountPlaceholder}>—</span>
        </p>
      </section>

      <div className={styles.fieldList}>
        <div className={styles.inputRow}>
          <span className={styles.label}>Tipo</span>
          <span className={styles.value}>Gasto</span>
          <span className={styles.affordance} aria-hidden="true">&gt;</span>
        </div>
        <div className={styles.inputRow}>
          <span className={styles.label}>Cuenta</span>
          <span className={styles.value}>{account.name}</span>
          <span className={styles.affordance} aria-hidden="true">&gt;</span>
        </div>
        <div className={styles.inputRow}>
          <span className={styles.label}>Categoría sugerida</span>
          <span className={styles.value}>{defaultCategoryName}</span>
          <span className={styles.affordance} aria-hidden="true">&gt;</span>
        </div>
        <div className={styles.inputRow}>
          <span className={styles.label}>Fecha</span>
          <span className={styles.value}>{formatDateLabel(defaultDate)}</span>
          <span className={styles.affordance} aria-hidden="true">&gt;</span>
        </div>
      </div>

      <button type="button" className={styles.primaryAction}>
        Registrar movimiento
      </button>
    </SurfaceCard>
  );
};
