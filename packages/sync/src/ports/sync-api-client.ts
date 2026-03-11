import type { SyncPullRequest } from "./sync-pull-request.js";
import type { SyncPullResponse } from "./sync-pull-response.js";
import type { SyncPushRequest } from "./sync-push-request.js";
import type { SyncPushResponse } from "./sync-push-response.js";

/**
 * Backend contract required by the sync engine.
 */
export interface SyncApiClient {
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
  pull(request: SyncPullRequest): Promise<SyncPullResponse>;
}
