/**
 * Pull request payload sent by the client to retrieve remote changes.
 */
export interface SyncPullRequest {
  deviceId: string;
  cursor: string | null;
}
