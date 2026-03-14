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
}: MovementsScreenProps): JSX.Element => {
  const selectedTransactionId = selection?.selectedTransactionId ?? null;
  const selectedTransaction = viewModel.items.find((item) => item.id === selectedTransactionId) ?? null;
  const editorStatus = editor?.status;
  const deletedCount = viewModel.items.filter((item) => item.deleted).length;

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
          includeDeleted={viewModel.includeDeleted}
          sync={viewModel.sync}
          itemCount={viewModel.items.length}
          deletedCount={deletedCount}
          isRefreshing={editorStatus?.isRefreshing ?? false}
          {...(listActions !== undefined
            ? {
                onToggleIncludeDeleted: () => {
                  void listActions.onToggleIncludeDeleted();
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
            <MovementsListCard
              items={viewModel.items}
              includeDeleted={viewModel.includeDeleted}
              {...(selection !== undefined ? { selection } : {})}
              {...(listActions !== undefined ? { listActions } : {})}
            />
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
