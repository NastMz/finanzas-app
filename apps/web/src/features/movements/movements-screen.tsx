import type { FinanzasMovementsTabViewModel } from "@finanzas/ui";
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
}: MovementsScreenProps): JSX.Element => (
  <DashboardPage
    className={styles.page ?? ""}
    containerClassName={styles.container ?? ""}
  >
    <section data-view="movements" className={styles.content}>
      <MovementsHeader
        account={viewModel.account}
        includeDeleted={viewModel.includeDeleted}
        sync={viewModel.sync}
      />

      <section className={styles.grid}>
        <MovementsTotalsCard
          currency={viewModel.account.currency}
          totals={viewModel.totals}
          itemCount={viewModel.items.length}
        />

        <div className={styles.spanFull}>
          <MovementsListCard
            items={viewModel.items}
            includeDeleted={viewModel.includeDeleted}
          />
        </div>
      </section>
    </section>
  </DashboardPage>
);

/**
 * Renders the Movements tab (`Movimientos`) as HTML.
 */
export const renderMovementsScreen = (
  viewModel: FinanzasMovementsTabViewModel,
): string => renderToStaticMarkup(<MovementsScreen viewModel={viewModel} />);
