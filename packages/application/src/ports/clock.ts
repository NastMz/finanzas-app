/**
 * Clock abstraction to make time deterministic in tests and adapters.
 */
export interface Clock {
  now(): Date;
}
