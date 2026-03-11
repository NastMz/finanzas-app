/**
 * Custom UI error for invalid screen inputs or missing local entities.
 */
export class FinanzasUiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanzasUiError";
  }
}
