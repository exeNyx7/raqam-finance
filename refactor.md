# Raqam Finance Refactoring & Stabilization Plan

**Goal:** Secure authentication, consolidate redundant API clients, standardize data flows, and fix schema relations before scaling new features.

## Phase 1: Authentication Security (HttpOnly Cookies)
**Objective:** Eliminate XSS vulnerabilities by removing refresh tokens from `localStorage`.

1. **Backend CORS Update:** In `Backend/src/server.js`, update the CORS middleware to set `credentials: true`.
2. **Backend Auth Controller:** In `Backend/src/controllers/authController.js`, update `login`, `register`, and `refresh` methods to attach the `refreshToken` as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Remove `refreshToken` from the JSON response payloads.
3. **Frontend API Client:** In `Frontend/lib/api/client.ts`, add `credentials: "include"` to all `fetch` requests inside the `makeRequest` method. Remove all logic related to `localStorage.setItem('refreshToken', ...)`.
4. **Frontend Auth Context:** In `Frontend/contexts/auth-context.tsx`, remove manual `localStorage` token management. Rely on the API client's silent refresh mechanism and the `/auth/me` endpoint to verify sessions on load.

## Phase 2: API Client Consolidation
**Objective:** Remove duplicate fetching logic to prevent race conditions and out-of-sync states.

1. **Delete Procedural Client:** Completely delete `Frontend/services/api.js`.
2. **Migrate Endpoints:** Ensure all API calls previously defined in `api.js` (e.g., `getDashboardStats`, `getLedgers`, `createTransaction`) are properly mapped using the singleton `apiClient` from `Frontend/lib/api/client.ts`.
3. **Update Imports:** Search the entire `/Frontend` directory for imports from `@/services/api` and replace them with calls using the unified `apiClient`.
4. **Remove Cache Hacks:** Remove query string cache-busters like `_t=Date.now()` from fetching functions. Configure Next.js caching appropriately via fetch options (`cache: 'no-store'`).

## Phase 3: Backend Response Standardization
**Objective:** Ensure every API endpoint returns a predictable `{ success: boolean, message?: string, data?: any }` format without double-nesting.

1. **Fix Refresh Endpoint:** Update `authController.refresh` to return `{ success: true, data: { accessToken } }` instead of raw tokens.
2. **Fix List Endpoints:** Audit all controller files (e.g., `ledgerController.js`, `billController.js`, `personController.js`) to ensure list responses do not wrap data twice (e.g., returning `{ data: { data: [...] } }`).
3. **Global Error Handler:** Sanitize the global error handler in `Backend/src/server.js` so it does not expose internal stack traces or raw database errors in the `message` field.

## Phase 4: Database Schema & Integrity Fixes
**Objective:** Fix broken relationships and missing data mappings.

1. **Fix Foreign Keys:** In `Backend/src/models/Transaction.js` and `Backend/src/models/LedgerTransaction.js`, change `ledgerId: { type: String }` to `ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' }`.
2. **Fix UsersMap Generation:** Ensure controllers fetching `LedgerTransaction` records always aggregate and pass the `usersMap` to the `.toClient(usersMap)` method so participant names resolve correctly instead of returning `null`.

## Phase 5: Cashflow & System Integration (From TODO Sprint)
**Objective:** Ensure ledger and bill payments sync with the main dashboard.

1. **MongoDB Transactions:** When marking a bill or ledger share as "Paid", implement a Mongoose Transaction (Session) in the controller.
2. **Cascading Updates:** The transaction must:
   - Update the specific `Bill` or `LedgerTransaction` status.
   - Create a corresponding standard `Transaction` entry reflecting the payment.
   - Adjust the respective `User`'s total balance/cashflow.