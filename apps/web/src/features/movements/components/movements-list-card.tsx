import type { FinanzasMovementsTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { TransactionList } from "../../shared/components/index.js";

/**
 * Transactions list card for Movements tab.
 */
export interface MovementsListCardProps {
  items: FinanzasMovementsTabViewModel["items"];
  includeDeleted: boolean;
  selectedTransactionId?: string | null;
  busyTransactionId?: string | null;
  onSelectTransaction?: (transactionId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export const MovementsListCard = ({
  items,
  includeDeleted,
  selectedTransactionId = null,
  busyTransactionId = null,
  onSelectTransaction,
  onDeleteTransaction,
}: MovementsListCardProps): JSX.Element => (
  <SurfaceCard
    title="Historial"
    subtitle={includeDeleted ? "Incluye eliminados" : "Solo activos"}
  >
    <TransactionList
      transactions={items}
      showDeletedState={includeDeleted}
      emptyLabel="No hay movimientos para los filtros actuales."
      selectedTransactionId={selectedTransactionId}
      transactionActions={(transaction) => [
        {
          label: selectedTransactionId === transaction.id ? "Editando" : "Editar",
          disabled: transaction.deleted || busyTransactionId === transaction.id,
          onClick: () => {
            onSelectTransaction?.(transaction.id);
          },
        },
        {
          label: busyTransactionId === transaction.id ? "Eliminando..." : "Eliminar",
          disabled: transaction.deleted || busyTransactionId === transaction.id,
          tone: "danger",
          onClick: () => {
            onDeleteTransaction?.(transaction.id);
          },
        },
      ]}
    />
  </SurfaceCard>
);
