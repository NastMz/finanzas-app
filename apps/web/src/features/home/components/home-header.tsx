import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { StatusPill } from "../../../ui/components/index.js";
import {
  formatMinorAmount,
  getSyncStatusLabel,
  getSyncTone,
} from "../../shared/lib/formatters.js";
import styles from "./home-header.module.css";

/**
 * Header block for Home screen.
 */
export interface HomeHeaderProps {
  account: FinanzasHomeTabViewModel["account"];
  period: FinanzasHomeTabViewModel["period"];
  totals: FinanzasHomeTabViewModel["totals"];
  sync: FinanzasHomeTabViewModel["sync"];
  transactionCount: number;
}

const getAbsoluteMinor = (amountMinor: bigint): bigint =>
  amountMinor < 0n ? -amountMinor : amountMinor;

const getDayCount = (period: FinanzasHomeTabViewModel["period"]): number => {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const difference = period.to.getTime() - period.from.getTime();
  return Math.max(1, Math.floor(difference / millisecondsPerDay) + 1);
};

const getSavingsRate = (totals: FinanzasHomeTabViewModel["totals"]): number | null => {
  const incomeMinor = getAbsoluteMinor(totals.incomeMinor);

  if (incomeMinor <= 0n) {
    return null;
  }

  return Number((totals.netMinor * 1000n) / incomeMinor) / 10;
};

export const HomeHeader = ({
  account,
  period,
  totals,
  sync,
  transactionCount,
}: HomeHeaderProps): JSX.Element => {
  const averageExpenseMinor = getAbsoluteMinor(totals.expenseMinor) / BigInt(getDayCount(period));
  const savingsRate = getSavingsRate(totals);

  return (
    <header className={styles.hero}>
      <div className={styles.heroTopRow}>
        <div className={styles.copyBlock}>
          <p className={styles.kicker}>Vista diaria</p>
          <h1 className={styles.title}>Inicio</h1>
          <p className={styles.subtitle}>
            Cuenta: {account.name}{" "}({account.currency})
          </p>
        </div>
        <StatusPill
          label={getSyncStatusLabel(sync.status)}
          tone={getSyncTone(sync.status)}
          className={styles.syncBadge ?? ""}
        />
      </div>

      <div className={styles.balanceRow}>
        <section className={styles.balanceBlock}>
          <p className={styles.balanceLabel}>Disponible hoy</p>
          <p className={styles.balanceValue}>
            {formatMinorAmount(totals.netMinor, account.currency)}
          </p>
          <p className={styles.balanceHelper}>
            Balance disponible para operar con claridad durante {period.label}.
          </p>
        </section>

        <section className={styles.statsGrid} aria-label="Indicadores rapidos del periodo">
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Periodo</span>
            <strong className={styles.statValue}>{period.label}</strong>
            <p className={styles.statHelper}>Periodo: {period.label}</p>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Actividad</span>
            <strong className={styles.statValue}>{transactionCount}</strong>
            <p className={styles.statHelper}>Movimientos visibles en este corte.</p>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Ritmo de gasto</span>
            <strong className={styles.statValue}>
              {formatMinorAmount(averageExpenseMinor, account.currency)} / dia
            </strong>
            <p className={styles.statHelper}>Promedio simple de salida diaria.</p>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Ahorro neto</span>
            <strong className={styles.statValue}>
              {savingsRate === null ? "Sin base" : `${savingsRate.toFixed(1)}%`}
            </strong>
            <p className={styles.statHelper}>Proporcion del ingreso que hoy se conserva.</p>
          </article>
        </section>
      </div>

      <div className={styles.footerRow}>
        <p className={styles.metaHint}>
          {sync.pendingOps} cambios pendientes de sincronizar
        </p>
        <p className={styles.metaHint}>Cursor: {sync.cursor ?? "sin cursor"}</p>
      </div>
    </header>
  );
};
