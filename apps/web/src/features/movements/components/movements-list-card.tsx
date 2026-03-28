import type { FinanzasMovementsTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { TransactionList } from "../../shared/components/index.js";
import type {
  MovementsListActionsContract,
  MovementsSelectionContract,
} from "../movements-contracts.js";

/**
 * Transactions list card for Movements tab.
 */
export interface MovementsListCardProps {
  items: FinanzasMovementsTabViewModel["items"];
  includeDeleted: boolean;
  emptyLabel?: string;
  selection?: MovementsSelectionContract;
  listActions?: MovementsListActionsContract;
}

export const MovementsListCard = ({
  items,
  includeDeleted,
  emptyLabel,
  selection,
  listActions,
}: MovementsListCardProps): JSX.Element => (
  <SurfaceCard
    title="Historial"
    subtitle={includeDeleted ? "Incluye eliminados" : "Solo activos"}
  >
    <TransactionList
      transactions={items}
      showDeletedState={includeDeleted}
      emptyLabel={emptyLabel ?? "No hay movimientos para los filtros actuales."}
      selectedTransactionId={selection?.selectedTransactionId ?? null}
      transactionActions={(transaction) => [
        {
          label: selection?.selectedTransactionId === transaction.id ? "Editando" : "Editar",
          disabled: transaction.deleted || selection?.busyTransactionId === transaction.id,
          onClick: () => {
            listActions?.onSelectTransaction(transaction.id);
          },
        },
        {
          label: selection?.busyTransactionId === transaction.id ? "Eliminando..." : "Eliminar",
          disabled: transaction.deleted || selection?.busyTransactionId === transaction.id,
          tone: "danger",
          onClick: () => {
            void listActions?.onDeleteTransaction(transaction.id);
          },
        },
      ]}
    />
  </SurfaceCard>
);
