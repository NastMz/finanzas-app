import type {
  FinanzasMovementsTabViewModel,
  FinanzasUiServiceContract,
  LoadMovementsTabInput,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  MovementsHeader,
  MovementsListCard,
  MovementsTotalsCard,
} from "./components/index.js";
import styles from "./movements-screen.module.css";

/**
 * Props for `MovementsScreen`.
 */
export interface MovementsScreenProps {
  viewModel: FinanzasMovementsTabViewModel;
}

/**
 * React component for `Movimientos` tab.
 */
export const MovementsScreen = ({
  viewModel,
}: MovementsScreenProps): JSX.Element => {
  const deletedCount = viewModel.items.filter((item) => item.deleted).length;

  return (
    <DashboardPage
      className={styles.page ?? ""}
      containerClassName={styles.container ?? ""}
    >
      <section data-view="movements" className={styles.content}>
        <MovementsHeader
          account={viewModel.account}
          includeDeleted={viewModel.includeDeleted}
          sync={viewModel.sync}
          itemCount={viewModel.items.length}
          deletedCount={deletedCount}
        />

        <section className={styles.grid}>
          <aside className={styles.summaryColumn}>
            <MovementsTotalsCard
              currency={viewModel.account.currency}
              totals={viewModel.totals}
              itemCount={viewModel.items.length}
            />
          </aside>

          <div className={styles.listColumn}>
            <MovementsListCard
              items={viewModel.items}
              includeDeleted={viewModel.includeDeleted}
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
