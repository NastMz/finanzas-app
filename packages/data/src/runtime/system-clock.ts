import type { Clock } from "@finanzas/application";

/**
 * Runtime clock backed by the current system time.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
