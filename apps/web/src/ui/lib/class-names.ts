/**
 * Joins truthy class names into a single string.
 */
export const classNames = (...values: Array<string | null | undefined>): string =>
  values.filter((value): value is string => value !== null && value !== undefined)
    .join(" ");
