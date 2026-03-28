import type { FinanzasMovementsTabViewModel } from "@finanzas/ui";
import type { MovementsReviewFilters } from "@finanzas/application";

import { StatusPill } from "../../../ui/components/index.js";
import { getSyncStatusLabel, getSyncTone } from "../../shared/lib/formatters.js";
import styles from "./movements-header.module.css";

/**
 * Header block for Movements screen.
 */
export interface MovementsHeaderProps {
  account: FinanzasMovementsTabViewModel["account"];
  review: NonNullable<FinanzasMovementsTabViewModel["review"]>;
  accountOptions: FinanzasMovementsTabViewModel["accountOptions"];
  categoryOptions: FinanzasMovementsTabViewModel["categoryOptions"];
  sync: FinanzasMovementsTabViewModel["sync"];
  itemCount: number;
  deletedCount: number;
  isRefreshing?: boolean;
  onToggleIncludeDeleted?: () => void;
  onReviewFiltersChange?: (
    filters: Partial<MovementsReviewFilters>,
  ) => void | Promise<void>;
}

const toDateInputValue = (value: Date | null): string => value?.toISOString().slice(0, 10) ?? "";

const parseDateFilter = (
  value: string,
  boundary: "start" | "end",
): Date | null => {
  if (value.trim().length === 0) {
    return null;
  }

  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }

  return boundary === "start"
    ? new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    : new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
};

const resolveSelectableAccounts = (
  accountOptions: FinanzasMovementsTabViewModel["accountOptions"],
  currentAccountId: string | null,
  fallbackAccount: FinanzasMovementsTabViewModel["account"],
): FinanzasMovementsTabViewModel["accountOptions"] => {
  const options = (accountOptions ?? [fallbackAccount]).filter((account) => !account.deleted);

  if (
    currentAccountId !== null &&
    options.every((account) => account.id !== currentAccountId)
  ) {
    return [...options, fallbackAccount];
  }

  return options;
};

const resolveSelectableCategories = (
  categoryOptions: FinanzasMovementsTabViewModel["categoryOptions"],
  currentCategoryId: string | null,
): FinanzasMovementsTabViewModel["categoryOptions"] => {
  const options = (categoryOptions ?? []).filter((category) => !category.deleted);

  if (
    currentCategoryId !== null &&
    options.every((category) => category.id !== currentCategoryId)
  ) {
    const currentCategory = (categoryOptions ?? []).find((category) => category.id === currentCategoryId);

    return currentCategory !== undefined ? [...options, currentCategory] : options;
  }

  return options;
};

export const MovementsHeader = ({
  account,
  review,
  accountOptions,
  categoryOptions,
  sync,
  itemCount,
  deletedCount,
  isRefreshing = false,
  onToggleIncludeDeleted,
  onReviewFiltersChange,
}: MovementsHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Ledger</p>
      <h1 className={styles.title}>Movimientos</h1>
      <p className={styles.subtitle}>{review.scopeLabel}</p>
      <p className={styles.period}>
        Revisa por cuenta, categoria o fecha antes de corregir un movimiento.
      </p>

      <div className={styles.filterGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Cuenta</span>
          <select
            className={styles.fieldInput}
            value={review.filters.accountId ?? "all"}
            disabled={isRefreshing}
            onChange={(event) => {
              void onReviewFiltersChange?.({
                accountId: event.target.value === "all" ? null : event.target.value,
              });
            }}
          >
            <option value="all">Todas las cuentas</option>
            {(resolveSelectableAccounts(accountOptions, review.filters.accountId, account) ?? []).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Categoria</span>
          <select
            className={styles.fieldInput}
            value={review.filters.categoryId ?? "all"}
            disabled={isRefreshing}
            onChange={(event) => {
              void onReviewFiltersChange?.({
                categoryId: event.target.value === "all" ? null : event.target.value,
              });
            }}
          >
            <option value="all">Todas las categorias</option>
            {(resolveSelectableCategories(categoryOptions, review.filters.categoryId) ?? []).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Desde</span>
          <input
            className={styles.fieldInput}
            type="date"
            value={toDateInputValue(review.filters.dateRange.from)}
            disabled={isRefreshing}
            onChange={(event) => {
              void onReviewFiltersChange?.({
                dateRange: {
                  from: parseDateFilter(event.target.value, "start"),
                  to: review.filters.dateRange.to,
                },
              });
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Hasta</span>
          <input
            className={styles.fieldInput}
            type="date"
            value={toDateInputValue(review.filters.dateRange.to)}
            disabled={isRefreshing}
            onChange={(event) => {
              void onReviewFiltersChange?.({
                dateRange: {
                  from: review.filters.dateRange.from,
                  to: parseDateFilter(event.target.value, "end"),
                },
              });
            }}
          />
        </label>
      </div>

      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={review.filters.includeDeleted}
          disabled={isRefreshing}
          onChange={() => {
            if (onReviewFiltersChange !== undefined) {
              void onReviewFiltersChange({
                includeDeleted: !review.filters.includeDeleted,
              });
              return;
            }

            void onToggleIncludeDeleted?.();
          }}
        />
        <span>
          {review.filters.includeDeleted ? "Incluye eliminados" : "Solo activos"}
        </span>
      </label>
    </div>

    <div className={styles.sideBlock}>
      <StatusPill
        label={getSyncStatusLabel(sync.status)}
        tone={getSyncTone(sync.status)}
        className={styles.syncBadge ?? ""}
      />

      <div className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Movimientos</span>
          <strong className={styles.metricValue}>{itemCount}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Eliminados</span>
          <strong className={styles.metricValue}>{deletedCount}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Tipo de cuenta</span>
          <strong className={styles.metricValue}>{account.type}</strong>
        </article>
      </div>
    </div>
  </header>
);
