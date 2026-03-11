export interface User {
    id: string
    name: string
    email: string
    avatar?: string
    createdAt: string
    updatedAt: string
}

export interface Transaction {
    id: string
    description: string
    amount: number
    category: string
    date: string
    ledgerId?: string
    userId: string
    type: 'income' | 'expense'
    status: 'pending' | 'completed' | 'cancelled'
    metadata?: Record<string, any>
    createdAt: string
    updatedAt: string
}

export interface Budget {
    id: string
    name: string
    amount: number
    spent: number
    period: 'weekly' | 'monthly' | 'yearly'
    category?: string
    startDate: string
    endDate: string
    status: 'active' | 'exceeded' | 'completed'
    createdAt: string
    updatedAt: string
}

export interface Recurring {
    id: string
    description: string
    amount: number
    category: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    startDate: string
    nextDue: string
    status: 'active' | 'paused' | 'cancelled'
    lastProcessed?: string
    createdAt: string
    updatedAt: string
}

export interface Goal {
    id: string
    name: string
    description?: string
    targetAmount: number
    currentAmount: number
    deadline?: string
    status: 'active' | 'completed' | 'cancelled'
    bgClass?: string // For UI styling
    createdAt: string
    updatedAt: string
}

export interface Bill {
    id: string
    description: string
    amount: number
    dueDate: string
    status: 'paid' | 'unpaid' | 'overdue'
    paidAt?: string
    category: string
    createdAt: string
    updatedAt: string
}

export interface LedgerMember {
    userId: string
    name?: string // Populated sometimes
    email?: string // Populated sometimes
}

export interface Ledger {
    id: string
    name: string
    description?: string
    members: LedgerMember[]
    membersDetailed?: User[] // UI helper
    balance?: number // Computed field
    totalExpenses?: number // Computed field
    createdAt: string
    updatedAt: string
}

export interface LedgerTransaction {
    id: string
    ledgerId: string
    payerId: string
    description: string
    totalAmount: number
    date: string
    shares: {
        userId: string
        amount: number
        status: 'pending' | 'paid' | 'approved'
        paidAt?: string
        approvedAt?: string
    }[]
    category: string
    createdAt: string
    updatedAt: string
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export interface ApiResponse<T> {
    success: boolean
    message?: string
    data: T
    timestamp: string
}
