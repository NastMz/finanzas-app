import type { FinanzasMovementsTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { TransactionList } from "../../shared/components/index.js";

/**
 * Transactions list card for Movements tab.
 */
export interface MovementsListCardProps {
  items: FinanzasMovementsTabViewModel["items"];
  includeDeleted: boolean;
}

export const MovementsListCard = ({
  items,
  includeDeleted,
}: MovementsListCardProps): JSX.Element => (
  <SurfaceCard
    title="Historial"
    subtitle={includeDeleted ? "Incluye eliminados" : "Solo activos"}
  >
    <TransactionList
      transactions={items}
      showDeletedState={includeDeleted}
      emptyLabel="No hay movimientos para los filtros actuales."
    />
  </SurfaceCard>
);
