/**
 * Local cursor storage used for incremental pull.
 */
export interface SyncStateRepository {
  getCursor(): Promise<string | null>;
  setCursor(cursor: string): Promise<void>;
}
