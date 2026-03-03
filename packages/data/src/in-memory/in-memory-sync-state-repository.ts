/**
 * In-memory cursor storage used by the sync engine in tests and local wiring.
 */
export class InMemorySyncStateRepository {
  private cursor: string | null;

  constructor(initialCursor: string | null = null) {
    this.cursor = initialCursor;
  }

  async getCursor(): Promise<string | null> {
    return this.cursor;
  }

  async setCursor(cursor: string): Promise<void> {
    this.cursor = cursor;
  }
}
