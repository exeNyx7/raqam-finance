import { ApiResponse, Bill, Budget, Goal, Ledger, LedgerTransaction, PaginatedResponse, Recurring, Transaction, User } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<ApiResponse<T>> {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    }
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' })
    const json = await res.json().catch(() => ({}))

    if (res.status === 401 && retry) {
        // Try refresh once via HttpOnly cookie (no body needed)
        try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            })
            if (refreshRes.ok) {
                const data = await refreshRes.json()
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', data.data.accessToken)
                }
                return request<T>(path, options, false)
            }
        } catch (_) {
            // fallthrough to error below
        }
    }

    if (!res.ok) {
        const message = json?.message || 'Request failed'
        const error = new Error(message) as any
        error.status = res.status
        throw error
    }
    return json as ApiResponse<T>
}

export async function login({ email, password }: any) {
    const { data } = await request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
    return data // { user, accessToken, refreshToken, expiresIn }
}

export async function register({ name, email, password }: any) {
    const { data } = await request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    })
    return data // { user, accessToken, refreshToken, expiresIn }
}

// Analytics API
export async function getDashboardStats(period = 'month') {
    const res = await request<any>(`/analytics/dashboard?filter=${JSON.stringify({ period })}`)
    return res.data
}

export async function getExpenseBreakdown(period = 'month') {
    const res = await request<any>(`/analytics/expenses/breakdown?filter=${JSON.stringify({ period })}`)
    return res.data
}

export async function getMonthlyTrends(months = 6) {
    const res = await request<any>(`/analytics/trends/monthly?filter=${JSON.stringify({ months })}`)
    return res.data
}

// Transactions API
export async function getTransactions(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/transactions${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<Transaction>>(url)
    return res.data
}

export async function createTransaction(payload: Partial<Transaction>) {
    const res = await request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

// Budgets API
export async function getBudgets(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/budgets${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<Budget>>(url)
    return res.data
}

export async function createBudget(payload: Partial<Budget>) {
    const res = await request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateBudget(id: string, payload: Partial<Budget>) {
    const res = await request<Budget>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteBudget(id: string) {
    const res = await request<null>(`/budgets/${id}`, { method: 'DELETE' })
    return res.data
}

export async function getBudgetProgress(id: string) {
    const res = await request<any>(`/budgets/${id}/progress`)
    return res.data
}

// Recurrings API
export async function getRecurrings(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/recurrings${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<Recurring>>(url)
    return res.data
}

export async function getRecurringStats() {
    const res = await request<any>(`/recurrings/stats`)
    return res.data
}

export async function createRecurring(payload: Partial<Recurring>) {
    const res = await request<Recurring>('/recurrings', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateRecurring(id: string, payload: Partial<Recurring>) {
    const res = await request<Recurring>(`/recurrings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteRecurring(id: string) {
    const res = await request<null>(`/recurrings/${id}`, { method: 'DELETE' })
    return res.data
}

export async function getRecurringMeta() {
    const res = await request<any>(`/recurrings/meta`)
    return res.data
}

// Ledgers API
export async function getLedgers(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/ledgers${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<Ledger>>(url)
    // list endpoints return { data: { data: [...], pagination } }
    // but generic request returns ApiResponse<T>. 
    // If backend returns { success: true, data: { data: [], pagination } }, then T is { data: Ledger[], pagination: ... }
    return res.data.data ? res.data.data : res.data // handle mismatch if any
}

export async function getGoals(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/goals${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<Goal>>(url)
    return res.data
}

export async function createGoal(payload: Partial<Goal>) {
    const res = await request<Goal>('/goals', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateGoal(id: string, payload: Partial<Goal>) {
    const res = await request<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteGoal(id: string) {
    const res = await request<null>(`/goals/${id}`, { method: 'DELETE' })
    return res.data
}

export async function addGoalContribution(id: string, { amount, note }: { amount: number; note?: string }) {
    const res = await request<Goal>(`/goals/${id}/contributions`, { method: 'POST', body: JSON.stringify({ amount, note }) })
    return res.data
}

export async function withdrawFromGoal(id: string, { amount, note }: { amount: number; note?: string }) {
    const res = await request<Goal>(`/goals/${id}/withdraw`, { method: 'POST', body: JSON.stringify({ amount, note }) })
    return res.data
}

export async function getBills(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/bills${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<Bill>>(url)
    return res.data.data ? res.data.data : res.data
}

export async function createBill(payload: Partial<Bill>) {
    const res = await request<Bill>('/bills', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateBill(id: string, payload: Partial<Bill>) {
    const res = await request<Bill>(`/bills/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteBill(id: string) {
    const res = await request<null>(`/bills/${id}`, { method: 'DELETE' })
    return res.data
}

// People API
export async function getAllPeople(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    qs.append('_t', Date.now().toString())
    const url = `/people/all${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<any>(url, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    return res.data.data ? res.data.data : res.data
}

export async function getPeople(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/people${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<any>>(url)
    return res.data.data ? res.data.data : res.data
}

export async function createPerson(payload: any) {
    const res = await request<any>('/people', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updatePerson(id: string, payload: any) {
    const res = await request<any>(`/people/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deletePerson(id: string) {
    const res = await request<null>(`/people/${id}`, { method: 'DELETE' })
    return res.data
}

export async function getPersonTransactions(personId: string) {
    const res = await request<any>(`/people/${personId}/transactions`)
    return res.data
}

export async function getLedger(id: string) {
    const res = await request<Ledger>(`/ledgers/${id}`)
    return res.data
}

export async function createLedger(payload: Partial<Ledger>) {
    const res = await request<Ledger>('/ledgers', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateLedger(id: string, payload: Partial<Ledger>) {
    const res = await request<Ledger>(`/ledgers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteLedger(id: string) {
    const res = await request<null>(`/ledgers/${id}`, { method: 'DELETE' })
    return res.data
}

export async function getLedgerTransactions(ledgerId: string) {
    const res = await request<any>(`/ledgers/${ledgerId}/transactions`)
    return res.data
}

export async function addLedgerTransaction(ledgerId: string, payload: any) {
    const res = await request<any>(`/ledgers/${ledgerId}/transactions`, { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function markLedgerSharePaid(ledgerId: string, txId: string) {
    const res = await request<any>(`/ledgers/${ledgerId}/transactions/${txId}/mark-paid`, { method: 'POST' })
    return res.data
}

export async function approveLedgerShare(ledgerId: string, txId: string, userId: string) {
    const res = await request<any>(`/ledgers/${ledgerId}/transactions/${txId}/approve/${userId}`, { method: 'POST' })
    return res.data
}

export async function deleteLedgerTransaction(ledgerId: string, txId: string) {
    const res = await request<any>(`/ledgers/${ledgerId}/transactions/${txId}`, { method: 'DELETE' })
    return res.data
}

export async function searchUsers(search: string) {
    const qs = new URLSearchParams()
    if (search) qs.append('search', search)
    const res = await request<any>(`/users/search${qs.toString() ? `?${qs.toString()}` : ''}`)
    return res.data
}

// Settings API
export async function getSettings() {
    const res = await request<any>('/settings')
    return res.data
}

export async function updateSettings(payload: any) {
    const res = await request<any>('/settings', { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function getCategories() {
    const res = await request<string[]>('/settings/categories')
    return res.data
}

export async function addCategory(name: string) {
    const res = await request<string[]>('/settings/categories', { method: 'POST', body: JSON.stringify({ name }) })
    return res.data
}

export async function deleteCategory(name: string) {
    const res = await request<string[]>(`/settings/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
    return res.data
}

// Profile API
export async function getProfile() {
    const res = await request<User>('/users/me')
    return res.data
}

export async function updateProfile(payload: Partial<User>) {
    const res = await request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function changePassword({ currentPassword, newPassword }: any) {
    const res = await request<any>('/users/me/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
    return res.data
}

export async function leaveLedger(id: string) {
    const res = await request<any>(`/ledgers/${id}/leave`, { method: 'POST' })
    return res.data
}

export async function getNotifications(params: Record<string, any> = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/notifications${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request<PaginatedResponse<any>>(url)
    return res.data.data ? res.data.data : res.data
}

export async function getNotificationStats() {
    const res = await request<any>('/notifications/stats')
    return res.data
}

export async function markNotificationRead(id: string) {
    const res = await request<any>(`/notifications/${id}/read`, { method: 'POST' })
    return res.data
}

export async function markAllNotificationsRead() {
    const res = await request<any>('/notifications/mark-all-read', { method: 'POST' })
    return res.data
}

export async function deleteNotification(id: string) {
    const res = await request<null>(`/notifications/${id}`, { method: 'DELETE' })
    return res.data
}
