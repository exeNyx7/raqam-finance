/**
 * Compatibility shim — replaces Frontend/services/api.ts.
 * All functions delegate to the unified apiClient; no duplicate request
 * logic, no localStorage token management, no cache-buster params.
 */
import { apiClient } from "./client"

// List endpoints return { success, data: { data: [], pagination } }.
// Extract just the inner array so consumers receive the same shape as before.
function extractList(r: { data: any }) {
    const inner = r.data
    return inner?.data !== undefined ? inner.data : inner
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getDashboardStats(period = "month") {
    const r = await apiClient.get<any>("/analytics/dashboard", { filter: { period } })
    return r.data
}

export async function getExpenseBreakdown(period = "month") {
    const r = await apiClient.get<any>("/analytics/expenses/breakdown", { filter: { period } })
    return r.data
}

export async function getMonthlyTrends(months = 6) {
    const r = await apiClient.get<any>("/analytics/trends/monthly", { filter: { months } })
    return r.data
}

// ─── Transactions ──────────────────────────────────────────────────────────────

export async function getTransactions(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/transactions", params)
    return r.data
}

export async function createTransaction(payload: any) {
    const r = await apiClient.post<any>("/transactions", payload)
    return r.data
}

// ─── Budgets ───────────────────────────────────────────────────────────────────

export async function getBudgets(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/budgets", params)
    return r.data
}

export async function createBudget(payload: any) {
    const r = await apiClient.post<any>("/budgets", payload)
    return r.data
}

export async function updateBudget(id: string, payload: any) {
    const r = await apiClient.patch<any>(`/budgets/${id}`, payload)
    return r.data
}

export async function deleteBudget(id: string) {
    const r = await apiClient.delete<any>(`/budgets/${id}`)
    return r.data
}

export async function getBudgetProgress(id: string) {
    const r = await apiClient.get<any>(`/budgets/${id}/progress`)
    return r.data
}

// ─── Recurrings ────────────────────────────────────────────────────────────────

export async function getRecurrings(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/recurrings", params)
    return r.data
}

export async function getRecurringStats() {
    const r = await apiClient.get<any>("/recurrings/stats")
    return r.data
}

export async function createRecurring(payload: any) {
    const r = await apiClient.post<any>("/recurrings", payload)
    return r.data
}

export async function updateRecurring(id: string, payload: any) {
    const r = await apiClient.patch<any>(`/recurrings/${id}`, payload)
    return r.data
}

export async function deleteRecurring(id: string) {
    const r = await apiClient.delete<any>(`/recurrings/${id}`)
    return r.data
}

export async function getRecurringMeta() {
    const r = await apiClient.get<any>("/recurrings/meta")
    return r.data
}

// ─── Ledgers ───────────────────────────────────────────────────────────────────

export async function getLedgers(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/ledgers", params)
    return extractList(r)
}

export async function getLedger(id: string) {
    const r = await apiClient.get<any>(`/ledgers/${id}`)
    return r.data
}

export async function createLedger(payload: any) {
    const r = await apiClient.post<any>("/ledgers", payload)
    return r.data
}

export async function updateLedger(id: string, payload: any) {
    const r = await apiClient.patch<any>(`/ledgers/${id}`, payload)
    return r.data
}

export async function deleteLedger(id: string) {
    const r = await apiClient.delete<any>(`/ledgers/${id}`)
    return r.data
}

export async function leaveLedger(id: string) {
    const r = await apiClient.post<any>(`/ledgers/${id}/leave`)
    return r.data
}

export async function getLedgerTransactions(ledgerId: string) {
    const r = await apiClient.get<any>(`/ledgers/${ledgerId}/transactions`)
    return r.data
}

export async function addLedgerTransaction(ledgerId: string, payload: any) {
    const r = await apiClient.post<any>(`/ledgers/${ledgerId}/transactions`, payload)
    return r.data
}

export async function markLedgerSharePaid(ledgerId: string, txId: string) {
    const r = await apiClient.post<any>(`/ledgers/${ledgerId}/transactions/${txId}/mark-paid`)
    return r.data
}

export async function approveLedgerShare(ledgerId: string, txId: string, userId: string) {
    const r = await apiClient.post<any>(`/ledgers/${ledgerId}/transactions/${txId}/approve/${userId}`)
    return r.data
}

export async function deleteLedgerTransaction(ledgerId: string, txId: string) {
    const r = await apiClient.delete<any>(`/ledgers/${ledgerId}/transactions/${txId}`)
    return r.data
}

// ─── Goals ─────────────────────────────────────────────────────────────────────

export async function getGoals(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/goals", params)
    return r.data
}

export async function createGoal(payload: any) {
    const r = await apiClient.post<any>("/goals", payload)
    return r.data
}

export async function updateGoal(id: string, payload: any) {
    const r = await apiClient.patch<any>(`/goals/${id}`, payload)
    return r.data
}

export async function deleteGoal(id: string) {
    const r = await apiClient.delete<any>(`/goals/${id}`)
    return r.data
}

// Signature matches old: addGoalContribution(id, { amount, note })
export async function addGoalContribution(id: string, { amount, note }: { amount: number; note?: string }) {
    const r = await apiClient.post<any>(`/goals/${id}/contributions`, { amount, note })
    return r.data
}

export async function withdrawFromGoal(id: string, { amount, note }: { amount: number; note?: string }) {
    const r = await apiClient.post<any>(`/goals/${id}/withdraw`, { amount, note })
    return r.data
}

// ─── Bills ─────────────────────────────────────────────────────────────────────

export async function getBills(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/bills", params)
    return extractList(r)
}

export async function createBill(payload: any) {
    const r = await apiClient.post<any>("/bills", payload)
    return r.data
}

export async function updateBill(id: string, payload: any) {
    const r = await apiClient.patch<any>(`/bills/${id}`, payload)
    return r.data
}

export async function deleteBill(id: string) {
    const r = await apiClient.delete<any>(`/bills/${id}`)
    return r.data
}

// ─── People ────────────────────────────────────────────────────────────────────

export async function getAllPeople(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/people/all", params)
    return extractList(r)
}

export async function getPeople(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/people", params)
    return extractList(r)
}

export async function createPerson(payload: any) {
    const r = await apiClient.post<any>("/people", payload)
    return r.data
}

export async function updatePerson(id: string, payload: any) {
    const r = await apiClient.patch<any>(`/people/${id}`, payload)
    return r.data
}

export async function deletePerson(id: string) {
    const r = await apiClient.delete<any>(`/people/${id}`)
    return r.data
}

export async function getPersonTransactions(personId: string) {
    const r = await apiClient.get<any>(`/people/${personId}/transactions`)
    return r.data
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export async function searchUsers(search: string) {
    const r = await apiClient.get<any>("/users/search", search ? { search } : {})
    return r.data
}

// ─── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings() {
    const r = await apiClient.get<any>("/settings")
    return r.data
}

export async function updateSettings(payload: any) {
    const r = await apiClient.patch<any>("/settings", payload)
    return r.data
}

export async function getCategories() {
    const r = await apiClient.get<any>("/settings/categories")
    return r.data
}

export async function addCategory(name: string) {
    const r = await apiClient.post<any>("/settings/categories", { name })
    return r.data
}

export async function deleteCategory(name: string) {
    const r = await apiClient.delete<any>(`/settings/categories/${encodeURIComponent(name)}`)
    return r.data
}

// ─── Profile / Auth ────────────────────────────────────────────────────────────

export async function getProfile() {
    const r = await apiClient.get<any>("/users/me")
    return r.data
}

export async function updateProfile(payload: any) {
    const r = await apiClient.patch<any>("/users/me", payload)
    return r.data
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
    const r = await apiClient.post<any>("/users/me/change-password", payload)
    return r.data
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(params: Record<string, any> = {}) {
    const r = await apiClient.get<any>("/notifications", params)
    return extractList(r)
}

export async function getNotificationStats() {
    const r = await apiClient.get<any>("/notifications/stats")
    return r.data
}

export async function markNotificationRead(id: string) {
    const r = await apiClient.post<any>(`/notifications/${id}/read`)
    return r.data
}

export async function markAllNotificationsRead() {
    const r = await apiClient.post<any>("/notifications/mark-all-read")
    return r.data
}

export async function deleteNotification(id: string) {
    const r = await apiClient.delete<any>(`/notifications/${id}`)
    return r.data
}
