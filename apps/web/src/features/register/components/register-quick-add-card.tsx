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
    return "Sin sugerencia automatica";
  }

  const category = categories.find((item) => item.id === defaultCategoryId);
  return category?.name ?? "Sin sugerencia automatica";
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
      <section className={styles.amountField} aria-label="Monto de transaccion">
        <div className={styles.amountHeader}>
          <span className={styles.amountLabel}>Monto</span>
          <div className={styles.modeSwitch}>
            <button type="button" className={`${styles.modeButton} ${styles.modeButtonActive}`}>
              Gasto
            </button>
            <button type="button" className={styles.modeButton}>
              Ingreso
            </button>
          </div>
        </div>

        <p className={styles.amountValue}>
          <span className={styles.currency}>{account.currency}</span>
          <span className={styles.amountPlaceholder}>--</span>
        </p>

        <p className={styles.amountHelper}>
          Preparado para registrar un movimiento desde la cuenta activa.
        </p>
      </section>

      <div className={styles.fieldList}>
        <div className={styles.inputRow}>
          <span className={styles.label}>Cuenta</span>
          <span className={styles.value}>{account.name}</span>
        </div>
        <div className={styles.inputRow}>
          <span className={styles.label}>Categoria sugerida</span>
          <span className={styles.value}>{defaultCategoryName}</span>
        </div>
        <div className={styles.inputRow}>
          <span className={styles.label}>Fecha</span>
          <span className={styles.value}>{formatDateLabel(defaultDate)}</span>
        </div>
      </div>

      <div className={styles.footerBar}>
        <p className={styles.footerCopy}>Todo listo para capturar sin cambiar de contexto.</p>
        <button type="button" className={styles.primaryAction}>
          Registrar movimiento
        </button>
      </div>
    </SurfaceCard>
  );
};
