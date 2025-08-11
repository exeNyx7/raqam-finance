const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function request(path, options = {}, retry = true) {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    const json = await res.json().catch(() => ({}))

    if (res.status === 401 && retry) {
        // Try refresh once
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                })
                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', data.accessToken)
                        localStorage.setItem('refreshToken', data.refreshToken)
                    }
                    return request(path, options, false)
                }
            } catch (_) {
                // fallthrough to error below
            }
        }
    }

    if (!res.ok) {
        const message = json?.message || 'Request failed'
        const error = new Error(message)
        error.status = res.status
        throw error
    }
    return json
}

export async function login({ email, password }) {
    const { data } = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
    return data // { user, accessToken, refreshToken, expiresIn }
}

export async function register({ name, email, password }) {
    const { data } = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    })
    return data // { user, accessToken, refreshToken, expiresIn }
}

// Analytics API
export async function getDashboardStats(period = 'month') {
    const res = await request(`/analytics/dashboard?filter=${JSON.stringify({ period })}`)
    return res.data
}

// Expense Breakdown (by category)
export async function getExpenseBreakdown(period = 'month') {
    const res = await request(`/analytics/expenses/breakdown?filter=${JSON.stringify({ period })}`)
    return res.data
}

// Monthly Trends (income vs expenses over past N months)
export async function getMonthlyTrends(months = 6) {
    const res = await request(`/analytics/trends/monthly?filter=${JSON.stringify({ months })}`)
    return res.data
}

// Transactions API
export async function getTransactions(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/transactions${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    return res.data
}

export async function createTransaction(payload) {
    const res = await request('/transactions', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

// Budgets API
export async function getBudgets(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/budgets${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    return res.data
}

export async function createBudget(payload) {
    const res = await request('/budgets', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateBudget(id, payload) {
    const res = await request(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteBudget(id) {
    const res = await request(`/budgets/${id}`, { method: 'DELETE' })
    return res.data
}

export async function getBudgetProgress(id) {
    const res = await request(`/budgets/${id}/progress`)
    return res.data
}



// Recurrings API
export async function getRecurrings(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/recurrings${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    return res.data
}

export async function getRecurringStats() {
    const res = await request(`/recurrings/stats`)
    return res.data
}

export async function createRecurring(payload) {
    const res = await request('/recurrings', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateRecurring(id, payload) {
    const res = await request(`/recurrings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteRecurring(id) {
    const res = await request(`/recurrings/${id}`, { method: 'DELETE' })
    return res.data
}

// Recurring meta (categories, frequencies, statuses)
export async function getRecurringMeta() {
    const res = await request(`/recurrings/meta`)
    return res.data
}

// Ledgers API (basic)
export async function getLedgers(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/ledgers${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    // list endpoints return { data: { data: [...], pagination } }
    return res.data?.data || res.data
}

// Goals API
export async function getGoals(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/goals${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    return res.data
}

export async function createGoal(payload) {
    const res = await request('/goals', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateGoal(id, payload) {
    const res = await request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteGoal(id) {
    const res = await request(`/goals/${id}`, { method: 'DELETE' })
    return res.data
}

export async function addGoalContribution(id, { amount, note }) {
    const res = await request(`/goals/${id}/contributions`, { method: 'POST', body: JSON.stringify({ amount, note }) })
    return res.data
}

// Bills API
export async function getBills(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/bills${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    // list endpoints return { data: { data: [...], pagination } }
    // For consistency, return array when present, otherwise single
    return res.data?.data || res.data
}

export async function createBill(payload) {
    const res = await request('/bills', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updateBill(id, payload) {
    const res = await request(`/bills/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deleteBill(id) {
    const res = await request(`/bills/${id}`, { method: 'DELETE' })
    return res.data
}

// People API
export async function getPeople(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/people${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    return res.data?.data || res.data
}

export async function createPerson(payload) {
    const res = await request('/people', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

export async function updatePerson(id, payload) {
    const res = await request(`/people/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function deletePerson(id) {
    const res = await request(`/people/${id}`, { method: 'DELETE' })
    return res.data
}

// Ledger detail & creation
export async function getLedger(id) {
    const res = await request(`/ledgers/${id}`)
    return res.data
}

export async function createLedger(payload) {
    const res = await request('/ledgers', { method: 'POST', body: JSON.stringify(payload) })
    return res.data
}

// Settings API
export async function getSettings() {
    const res = await request('/settings')
    return res.data
}

export async function updateSettings(payload) {
    const res = await request('/settings', { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function getCategories() {
    const res = await request('/settings/categories')
    return res.data
}

export async function addCategory(name) {
    const res = await request('/settings/categories', { method: 'POST', body: JSON.stringify({ name }) })
    return res.data
}

export async function deleteCategory(name) {
    const res = await request(`/settings/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
    return res.data
}

// Profile API
export async function getProfile() {
    const res = await request('/users/me')
    return res.data
}

export async function updateProfile(payload) {
    const res = await request('/users/me', { method: 'PATCH', body: JSON.stringify(payload) })
    return res.data
}

export async function changePassword({ currentPassword, newPassword }) {
    const res = await request('/users/me/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
    return res.data
}

// Ledger membership actions
export async function leaveLedger(id) {
    const res = await request(`/ledgers/${id}/leave`, { method: 'POST' })
    return res.data
}

// Notifications API
export async function getNotifications(params = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') qs.append(key, JSON.stringify(value))
            else qs.append(key, String(value))
        }
    })
    const url = `/notifications${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await request(url)
    return res.data?.data || res.data
}

export async function getNotificationStats() {
    const res = await request('/notifications/stats')
    return res.data
}

export async function markNotificationRead(id) {
    const res = await request(`/notifications/${id}/read`, { method: 'POST' })
    return res.data
}

export async function markAllNotificationsRead() {
    const res = await request('/notifications/mark-all-read', { method: 'POST' })
    return res.data
}

export async function deleteNotification(id) {
    const res = await request(`/notifications/${id}`, { method: 'DELETE' })
    return res.data
}