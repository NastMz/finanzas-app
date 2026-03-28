import type {
  FinanzasMovementsTabViewModel,
  FinanzasUiServiceContract,
  LoadMovementsTabInput,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  MovementsEditorCard,
  MovementsHeader,
  MovementsListCard,
  MovementsTotalsCard,
} from "./components/index.js";
import type { MovementsScreenProps } from "./movements-contracts.js";
import styles from "./movements-screen.module.css";

/**
 * React component for `Movimientos` tab.
 */
export const MovementsScreen = ({
  viewModel,
  categories = [],
  selection,
  editor,
  categoryCreation,
  listActions,
  resultState,
}: MovementsScreenProps): JSX.Element => {
  const selectedTransactionId = selection?.selectedTransactionId ?? null;
  const selectedTransaction = viewModel.items.find((item) => item.id === selectedTransactionId) ?? null;
  const editorStatus = editor?.status;
  const review = viewModel.review;
  const deletedCount = viewModel.items.filter((item) => item.deleted).length;
  const resolvedResultState = resultState ?? (review === undefined
    ? undefined
    : {
        activeFilters: review.filters,
        hasResults: viewModel.items.length > 0,
        hasMore: review.page.hasMore,
        nextContinuation: review.page.nextContinuation,
        emptyState: viewModel.items.length === 0 ? "filtered" : "none",
        refreshMode: review.mode,
      });
  const emptyLabel = resolvedResultState?.emptyState === "filtered"
    ? "No hay movimientos para los filtros actuales. Ajusta la revision para seguir."
    : "Todavia no hay movimientos cargados.";

  return (
    <DashboardPage
      className={styles.page ?? ""}
      containerClassName={styles.container ?? ""}
    >
      <section data-view="movements" className={styles.content}>
        {editorStatus?.offline === true
          ? <p className={`${styles.notice} ${styles.noticeOffline}`}>Sin conexion: puedes seguir ajustando movimientos. Los cambios se sincronizaran despues.</p>
          : null}

        {editorStatus?.isRefreshing === true
          ? <p className={`${styles.notice} ${styles.noticeInfo}`}>Actualizando movimientos y resumen...</p>
          : null}

        <MovementsHeader
          account={viewModel.account}
          review={review ?? {
            filters: {
              dateRange: {
                from: null,
                to: null,
              },
              accountId: viewModel.account.id,
              categoryId: null,
              includeDeleted: viewModel.includeDeleted,
            },
            page: {
              limit: viewModel.items.length,
              hasMore: false,
              nextContinuation: null,
            },
            mode: "replace",
            scopeLabel: `${viewModel.account.name} (${viewModel.account.currency})`,
          }}
          accountOptions={viewModel.accountOptions}
          categoryOptions={viewModel.categoryOptions}
          sync={viewModel.sync}
          itemCount={viewModel.items.length}
          deletedCount={deletedCount}
          isRefreshing={editorStatus?.isRefreshing ?? false}
          {...(listActions !== undefined
            ? {
                onToggleIncludeDeleted: () => {
                  void listActions.onToggleIncludeDeleted();
                },
                onReviewFiltersChange: (filters) => {
                  void listActions.onReviewFiltersChange?.(filters);
                },
              }
            : {})}
        />

        <section className={styles.grid}>
          <aside className={styles.summaryColumn}>
            <div className={styles.summaryStack}>
              <MovementsTotalsCard
                currency={viewModel.account.currency}
                totals={viewModel.totals}
                itemCount={viewModel.items.length}
              />
              <MovementsEditorCard
                categoryManagement={viewModel.categoryManagement}
                categories={categories}
                selectedTransaction={selectedTransaction}
                {...(editor !== undefined ? { editor } : {})}
                {...(categoryCreation !== undefined ? { categoryCreation } : {})}
              />
            </div>
          </aside>

          <div className={styles.listColumn}>
            {resolvedResultState?.emptyState === "filtered"
              ? <p className={`${styles.notice} ${styles.noticeInfo}`}>No hay movimientos con la revision actual. Cambia cuenta, categoria o fechas para seguir.</p>
              : null}

            <MovementsListCard
              items={viewModel.items}
              includeDeleted={review?.filters.includeDeleted ?? viewModel.includeDeleted}
              emptyLabel={emptyLabel}
              {...(selection !== undefined ? { selection } : {})}
              {...(listActions !== undefined ? { listActions } : {})}
            />

            {resolvedResultState?.hasMore === true &&
            resolvedResultState.nextContinuation !== null &&
            listActions?.onLoadMore !== undefined
              ? (
                <div className={styles.loadMoreCard}>
                  <p className={styles.loadMoreCopy}>
                    Carga el siguiente bloque sin perder los filtros activos.
                  </p>
                  <button
                    type="button"
                    className={styles.loadMoreButton}
                    disabled={editorStatus?.isRefreshing === true}
                    onClick={() => {
                      const continuation = resolvedResultState.nextContinuation;

                      if (continuation === null) {
                        return;
                      }

                      void listActions.onLoadMore?.(continuation);
                    }}
                  >
                    {editorStatus?.isRefreshing === true && resolvedResultState.refreshMode === "append"
                      ? "Cargando..."
                      : "Cargar mas movimientos"}
                  </button>
                </div>
                )
              : null}
          </div>
        </section>
      </section>
    </DashboardPage>
  );
};

/**
 * Renders the Movements tab (`Movimientos`) as HTML.
 */
export const renderMovementsScreen = (
  viewModel: FinanzasMovementsTabViewModel,
): string => renderToStaticMarkup(<MovementsScreen viewModel={viewModel} />);

/**
 * Loads Movements tab data and returns render-ready HTML.
 */
export const loadMovementsScreenHtml = async (
  loadMovementsTab: FinanzasUiServiceContract["loadMovementsTab"],
  input?: LoadMovementsTabInput,
): Promise<string> => renderMovementsScreen(await loadMovementsTab(input));
