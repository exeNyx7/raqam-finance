# Raqam Finance Refactoring: Phases 6 & 7

**Goal:** Remove legacy code, eliminate split-brain frontend state (mock vs. real data), and patch critical math/logic bugs in the backend.

## Phase 6: Frontend State & Architecture Cleanup
**Objective:** Consolidate type definitions and remove the hardcoded mock data that is desynchronizing the frontend.

1. **Consolidate Types:** - Move any missing type interfaces from `Frontend/services/types.ts` into `Frontend/lib/api/types.ts`.
   - Delete `Frontend/services/types.ts` (and the entire `Frontend/services` folder if it is now empty) to prevent accidental legacy imports.
   - Update any components still importing from `@/services/types` to import from `@/lib/api/types`.
2. **Purge Mock State:** In `Frontend/contexts/app-context.tsx`, the `initialState` object contains hardcoded mock data (e.g., "Alice Johnson", "Monthly Food Budget", etc.). 
   - Empty these arrays. `people`, `budgets`, `goals`, and `bills` must initialize as empty arrays `[]` so the app correctly relies on the backend database via `apiClient` instead of dummy `localStorage` data.

## Phase 7: Backend Logic & Performance Fixes
**Objective:** Fix the ledger math, update budget progress on recurring payments, and prevent frontend DDoS polling.

1. **Extract Budget Utility:** The function `adjustBudgetsForCategoryAndDate` is currently trapped inside `Backend/src/controllers/ledgerController.js`. 
   - Move it into a new utility file: `Backend/src/utils/budgetUtils.js`.
   - Import and use this new utility in `ledgerController.js`.
2. **Fix Recurring Budget Gap:** In `Backend/src/cron/checkRecurring.js`, import the new `budgetUtils.js`. After the cron job successfully creates a recurring `Transaction`, it must call `adjustBudgetsForCategoryAndDate` so automated bills correctly deduct from the user's active budget limits.
3. **Fix Ledger Split Math (TODO #6):** In `Backend/src/controllers/ledgerController.js` -> `addTransaction()`, the `equalShare` is currently calculated by dividing the total amount by the `shareCount` (which excludes the payer). 
   - Update the math to divide by the **total number of involved participants** (debtors + payer) so the split is actually equal among everyone who shared the expense.
4. **Reduce Polling Load:** In `Frontend/components/notifications-popover.tsx`, change the `setInterval` from `30000` (30 seconds) to `180000` (3 minutes) to prevent aggressive background polling from overloading the Express server.