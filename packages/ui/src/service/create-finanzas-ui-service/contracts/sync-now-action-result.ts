import type { SyncNowResult } from "@finanzas/sync";

import type { FinanzasSyncStatusViewModel } from "../../../models/finanzas-ui-types.js";

/**
 * Result returned by manual sync action in `Cuenta`.
 */
export interface SyncNowActionResult {
  ok: boolean;
  result: SyncNowResult | null;
  error: string | null;
  sync: FinanzasSyncStatusViewModel;
}
