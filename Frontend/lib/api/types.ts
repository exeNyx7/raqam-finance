// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  timestamp: string
}

export interface ApiError {
  message: string
  code: string
  details?: any
  timestamp: string
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

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Transaction Types
export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  ledgerId: string
  userId: string
  type: "income" | "expense"
  status: "pending" | "completed" | "cancelled"
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionRequest {
  description: string
  amount: number
  category: string
  date: string
  ledgerId: string
  type: "income" | "expense"
  metadata?: Record<string, any>
}

// Ledger Types
export interface Ledger {
  id: string
  name: string
  description?: string
  type: "personal" | "shared"
  ownerId: string
  members: LedgerMember[]
  balance: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface LedgerMember {
  userId: string
  role: "owner" | "editor" | "viewer"
  joinedAt: string
}

export interface CreateLedgerRequest {
  name: string
  description?: string
  type: "personal" | "shared"
  members?: Array<{
    userId: string
    role: "editor" | "viewer"
  }>
}

// Budget Types
export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  period: "weekly" | "monthly" | "yearly"
  category?: string
  startDate: string
  endDate: string
  status: "active" | "exceeded" | "completed"
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateBudgetRequest {
  name: string
  amount: number
  period: "weekly" | "monthly" | "yearly"
  category?: string
  startDate: string
}

// Goal Types
export interface Goal {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  category: string
  priority: "low" | "medium" | "high"
  status: "active" | "completed" | "paused"
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateGoalRequest {
  name: string
  description?: string
  targetAmount: number
  targetDate?: string
  category: string
  priority: "low" | "medium" | "high"
  initialAmount?: number
}

// Bill Types
export interface Bill {
  id: string
  description: string
  items: BillItem[]
  paidBy: string
  participants: string[]
  subtotal: number
  tax: number
  taxPercentage: number
  tip: number
  total: number
  date: string
  status: "draft" | "finalized" | "settled"
  splits: Record<string, number>
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  id: string
  name: string
  amount: number
  participants: string[]
}

export interface CreateBillRequest {
  description: string
  items: Omit<BillItem, "id">[]
  paidBy: string
  participants: string[]
  taxPercentage?: number
  tip?: number
  date: string
}

// Notification Types
export interface Notification {
  id: string
  type: "payment_received" | "payment_approved" | "new_expense" | "reminder" | "added_to_ledger"
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  userId: string
  createdAt: string
}

// Query Parameters
export interface QueryParams {
  page?: number
  limit?: number
  sort?: string
  order?: "asc" | "desc"
  search?: string
  filter?: Record<string, any>
}
