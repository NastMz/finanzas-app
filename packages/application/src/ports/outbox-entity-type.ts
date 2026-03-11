/**
 * Entity types currently supported in the local outbox.
 */
export type OutboxEntityType =
  | "account"
  | "category"
  | "budget"
  | "transaction-template"
  | "recurring-rule"
  | "transaction";
