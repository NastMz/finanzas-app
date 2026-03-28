# UI v1 - Flows and Experience (Mobile-First)

Status: Proposed  
Date: 2026-03-03

## 1. Goal

Define the v1 experience without turning the app into a collection of CRUD screens.
The UI is designed around **user intentions**, and each screen should help the user make a decision.

## 2. Design Principles

- Record an expense in under 10 seconds.
- Show context (balance, trend, categories) before asking for manual editing.
- Minimize long forms; rely on smart defaults and progressive editing.
- Prioritize quick reading and action on mobile.
- Every flow should account for `loading`, `empty`, `error`, and `offline` states.

## 3. v1 Navigation Map

Main tab bar (4 tabs):

1. **Home**
2. **Movements**
3. **Register** (primary action)
4. **Account** (settings, sync, data)

## 4. Priority Flows (Jobs to Be Done)

### F1. Quick expense entry

**Intent:** "I just spent money and I want to record it now."

Steps:
1. Tap `Register`.
2. Enter the amount (numeric keyboard), suggested category, optional note.
3. Confirm.
4. See immediate feedback plus an "Undo" option.

Non-negotiable UX:

- Default account is preselected.
- Default date = now.
- Most recently used categories appear first.

### F2. Understand where money went

**Intent:** "I want to know where my money went."

Steps:
1. Open `Home`.
2. Review the monthly summary (total expenses, income, balance).
3. Review top categories and drill into a filtered list.

Non-negotiable UX:

- Visual indicator for the dominant category.
- Quick range filter (week/month).

### F3. Review and correct transactions

**Intent:** "I need to fix a transaction that was entered incorrectly."

Steps:
1. Open `Movements`.
2. Narrow the review by account, category, date range, and deleted visibility.
3. Load more matching results when the current window is not enough.
4. Edit or delete.
5. Reflect the changes in the summary without losing the active review context.

Non-negotiable UX:

- Bounded list ordered by descending date with an explicit first-slice `Load more` action.
- Active review filters stay visible after edit, delete, or category recovery actions.
- Short delete confirmation.

### F4. Trust the synchronization state

**Intent:** "I want to know whether my data is saved and synchronized."

Steps:
1. Open `Account`.
2. Review sync status (last attempt, pending items, errors).
3. Trigger manual sync if needed.

Non-negotiable UX:

- Clear states: `Synced`, `Pending`, `Error`.
- Actionable error messages without technical jargon.

## 5. v1 Screens and Minimum Content

### Home

- Current balance.
- Current month expenses.
- Top 3 categories.
- Last 5 transactions.
- Primary CTA: `Add transaction`.

### Movements

- Transaction list.
- Filters: date range, account, category, deleted visibility.
- Review scope summary plus a manual `Load more` action for long histories.
- Per-item actions: edit, delete.

### Register

- Amount (required).
- Type (expense/income).
- Category.
- Account.
- Date.
- Note (optional).

### Account

- Sync status.
- Account and category management.
- Basic preferences (main currency, export in later phases).

## 6. UI Contracts (Preliminary)

These contracts belong to the UI layer and map to existing `commands` / `queries`.

- `queryHomeSummary(monthRange)` -> balance, totals, top categories, recent items
- `queryTransactionList(filters)` -> paginated/list items
- `commandQuickAddTransaction(input)` -> creates a quick transaction
- `commandEditTransaction(input)` -> updates a transaction
- `commandDeleteTransaction(id)` -> tombstone delete
- `querySyncStatus()` -> visual synchronization status
- `commandSyncNow()` -> manual sync trigger

Notes:

- `queryHomeSummary` can already map to `GetAccountSummary` (by account/range).
- `querySyncStatus` can already map to `GetSyncStatus`.
- There is a shared headless implementation (`createFinanzasUiService` in `@finanzas/ui`) with per-host wrappers; `web` is the first visual consumer.
- `apps/web` already materializes the 4 v1 tabs (`Home`, `Movements`, `Register`, `Account`) with React components, CSS Modules, and `load*ScreenHtml` helpers inside each feature.

## 7. Anti-Patterns to Avoid

- An `Accounts` or `Categories` screen that is only an empty form with no context.
- Forcing the user to complete non-critical fields for quick entry.
- Duplicating the same filters on every screen without a clear purpose.
- Showing technical sync states without functional translation for the user.

## 8. Slice-Based Implementation Plan

### Slice 1 (usable MVP)

- Quick `Register` flow + `Movements` list.
- Basic edit/delete.
- Simple `Home` summary (totals + recent items).

### Slice 2

- Top categories, advanced filters, search.
- More detailed sync status in `Account`.

### Slice 3

- UX refinements: suggestions, shortcuts, better empty states.

## 9. v1 Acceptance Criteria

- A user can record, correct, and review expenses without leaving the 4 tabs.
- No connectivity is required for local CRUD.
- Every screen has defined `empty`, `error`, and `loading` states.
- Flows F1-F4 can run end-to-end on mobile.
