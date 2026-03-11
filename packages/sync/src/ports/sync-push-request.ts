import type { OutboxOp } from "@finanzas/application";

/**
 * Push request payload sent by the client to the sync backend.
 */
export interface SyncPushRequest {
  deviceId: string;
  ops: OutboxOp[];
}
