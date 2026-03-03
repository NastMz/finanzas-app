import type { Clock } from "@finanzas/application";

/**
 * Deterministic clock for tests and local bootstrapping.
 */
export class FixedClock implements Clock {
  private readonly value: Date;

  constructor(value: Date) {
    this.value = new Date(value);
  }

  now(): Date {
    return new Date(this.value);
  }
}
