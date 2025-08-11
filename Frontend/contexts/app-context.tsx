"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"

// Types
export interface Person {
  id: string
  name: string
  email: string
  avatar?: string
  isAppUser: boolean
  phone?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  period: "weekly" | "monthly"
  category?: string
  startDate: string
  endDate: string
  status: "active" | "exceeded" | "completed"
}

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
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  id: string
  name: string
  amount: number
  participants: string[]
}

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
}

export interface AppSettings {
  currency: string
  dateFormat: string
  theme: "light" | "dark" | "system"
  notifications: {
    email: boolean
    push: boolean
    reminders: boolean
  }
  privacy: {
    profileVisibility: "public" | "friends" | "private"
    transactionVisibility: "public" | "friends" | "private"
  }
}

interface AppState {
  people: Person[]
  budgets: Budget[]
  goals: Goal[]
  bills: Bill[]
  settings: AppSettings
  categories: string[]
}

type AppAction =
  | { type: "ADD_PERSON"; payload: Person }
  | { type: "UPDATE_PERSON"; payload: Person }
  | { type: "DELETE_PERSON"; payload: string }
  | { type: "ADD_BUDGET"; payload: Budget }
  | { type: "UPDATE_BUDGET"; payload: Budget }
  | { type: "DELETE_BUDGET"; payload: string }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: Goal }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "ADD_BILL"; payload: Bill }
  | { type: "UPDATE_BILL"; payload: Bill }
  | { type: "DELETE_BILL"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "ADD_CATEGORY"; payload: string }
  | { type: "DELETE_CATEGORY"; payload: string }

const initialState: AppState = {
  people: [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
      isAppUser: true,
      phone: "+1234567890",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
      isAppUser: true,
      phone: "+1234567891",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      name: "Carol Davis",
      email: "carol@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
      isAppUser: false,
      phone: "+1234567892",
      notes: "Friend from college",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  budgets: [
    {
      id: "1",
      name: "Monthly Food Budget",
      amount: 500,
      spent: 320,
      period: "monthly",
      category: "Food & Dining",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      status: "active",
    },
    {
      id: "2",
      name: "Weekly Entertainment",
      amount: 100,
      spent: 85,
      period: "weekly",
      category: "Entertainment",
      startDate: "2024-01-15",
      endDate: "2024-01-21",
      status: "active",
    },
  ],
  goals: [],
  bills: [],
  settings: {
    currency: "PKR",
    dateFormat: "DD/MM/YYYY",
    theme: "system",
    notifications: {
      email: true,
      push: true,
      reminders: true,
    },
    privacy: {
      profileVisibility: "friends",
      transactionVisibility: "friends",
    },
  },
  categories: [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Travel",
    "Income",
    "Emergency",
    "Savings",
    "Investment",
    "Education",
    "Other",
  ],
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_PERSON":
      return { ...state, people: [...state.people, action.payload] }
    case "UPDATE_PERSON":
      return {
        ...state,
        people: state.people.map((person) => (person.id === action.payload.id ? action.payload : person)),
      }
    case "DELETE_PERSON":
      return { ...state, people: state.people.filter((person) => person.id !== action.payload) }
    case "ADD_BUDGET":
      return { ...state, budgets: [...state.budgets, action.payload] }
    case "UPDATE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.map((budget) => (budget.id === action.payload.id ? action.payload : budget)),
      }
    case "DELETE_BUDGET":
      return { ...state, budgets: state.budgets.filter((budget) => budget.id !== action.payload) }
    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.payload] }
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((goal) => (goal.id === action.payload.id ? action.payload : goal)),
      }
    case "DELETE_GOAL":
      return { ...state, goals: state.goals.filter((goal) => goal.id !== action.payload) }
    case "ADD_BILL":
      return { ...state, bills: [...state.bills, action.payload] }
    case "UPDATE_BILL":
      return {
        ...state,
        bills: state.bills.map((bill) => (bill.id === action.payload.id ? action.payload : bill)),
      }
    case "DELETE_BILL":
      return { ...state, bills: state.bills.filter((bill) => bill.id !== action.payload) }
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] }
    case "DELETE_CATEGORY":
      return { ...state, categories: state.categories.filter((cat) => cat !== action.payload) }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Helper functions
  addPerson: (person: Omit<Person, "id" | "createdAt" | "updatedAt">) => void
  updatePerson: (person: Person) => void
  deletePerson: (id: string) => void
  addBudget: (budget: Omit<Budget, "id">) => void
  updateBudget: (budget: Budget) => void
  deleteBudget: (id: string) => void
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "updatedAt">) => void
  updateGoal: (goal: Goal) => void
  deleteGoal: (id: string) => void
  addBill: (bill: Omit<Bill, "id">) => void
  updateBill: (bill: Bill) => void
  deleteBill: (id: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  addCategory: (category: string) => void
  deleteCategory: (category: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("raqam_app_state")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        // Merge with initial state to ensure all properties exist
        Object.keys(parsedState).forEach((key) => {
          if (key in initialState) {
            dispatch({ type: `SET_${key.toUpperCase()}` as any, payload: parsedState[key] })
          }
        })
      } catch (error) {
        console.error("Failed to load app state:", error)
      }
    }
  }, [])

  // Save state to localStorage on changes
  useEffect(() => {
    localStorage.setItem("raqam_app_state", JSON.stringify(state))
  }, [state])

  // Helper functions
  const addPerson = (person: Omit<Person, "id" | "createdAt" | "updatedAt">) => {
    const newPerson: Person = {
      ...person,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "ADD_PERSON", payload: newPerson })
  }

  const updatePerson = (person: Person) => {
    dispatch({ type: "UPDATE_PERSON", payload: { ...person, updatedAt: new Date().toISOString() } })
  }

  const deletePerson = (id: string) => {
    dispatch({ type: "DELETE_PERSON", payload: id })
  }

  const addBudget = (budget: Omit<Budget, "id">) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
    }
    dispatch({ type: "ADD_BUDGET", payload: newBudget })
  }

  const updateBudget = (budget: Budget) => {
    dispatch({ type: "UPDATE_BUDGET", payload: budget })
  }

  const deleteBudget = (id: string) => {
    dispatch({ type: "DELETE_BUDGET", payload: id })
  }

  const addGoal = (goal: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "ADD_GOAL", payload: newGoal })
  }

  const updateGoal = (goal: Goal) => {
    dispatch({ type: "UPDATE_GOAL", payload: { ...goal, updatedAt: new Date().toISOString() } })
  }

  const deleteGoal = (id: string) => {
    dispatch({ type: "DELETE_GOAL", payload: id })
  }

  const addBill = (bill: Omit<Bill, "id">) => {
    const newBill: Bill = {
      ...bill,
      id: Date.now().toString(),
    }
    dispatch({ type: "ADD_BILL", payload: newBill })
  }

  const updateBill = (bill: Bill) => {
    dispatch({ type: "UPDATE_BILL", payload: bill })
  }

  const deleteBill = (id: string) => {
    dispatch({ type: "DELETE_BILL", payload: id })
  }

  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings })
  }

  const addCategory = (category: string) => {
    dispatch({ type: "ADD_CATEGORY", payload: category })
  }

  const deleteCategory = (category: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: category })
  }

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addPerson,
        updatePerson,
        deletePerson,
        addBudget,
        updateBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        addBill,
        updateBill,
        deleteBill,
        updateSettings,
        addCategory,
        deleteCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
