"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"

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
  settings: AppSettings
  categories: string[]
}

type AppAction =
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "ADD_CATEGORY"; payload: string }
  | { type: "DELETE_CATEGORY"; payload: string }

const initialState: AppState = {
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
        if (parsedState.settings) {
          dispatch({ type: "UPDATE_SETTINGS", payload: parsedState.settings })
        }
        if (Array.isArray(parsedState.categories)) {
          // Replace categories by dispatching delete-all then add-each
          for (const cat of parsedState.categories) {
            dispatch({ type: "ADD_CATEGORY", payload: cat })
          }
        }
      } catch (error) {
        console.error("Failed to load app state:", error)
      }
    }
  }, [])

  // Save state to localStorage on changes
  useEffect(() => {
    localStorage.setItem("raqam_app_state", JSON.stringify(state))
  }, [state])

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
