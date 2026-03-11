"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Optimistically restore cached user, then validate via /auth/me
    const savedUser = localStorage.getItem("raqam_user")
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch (_) {}
    }

    apiClient.get<User>("/auth/me")
      .then((res) => {
        const freshUser = (res as any).data ?? res
        setUser(freshUser)
        localStorage.setItem("raqam_user", JSON.stringify(freshUser))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem("raqam_user")
      })
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email: string, password: string) => {
    const res = await apiClient.post<any>("/auth/login", { email, password })
    const data = (res as any).data ?? res
    apiClient.setTokens(data.accessToken)
    setUser(data.user)
    localStorage.setItem("raqam_user", JSON.stringify(data.user))
  }

  const signUp = async (email: string, password: string, name: string) => {
    const res = await apiClient.post<any>("/auth/register", { name, email, password })
    const data = (res as any).data ?? res
    apiClient.setTokens(data.accessToken)
    setUser(data.user)
    localStorage.setItem("raqam_user", JSON.stringify(data.user))
  }

  const signOut = async () => {
    await apiClient.post("/auth/logout").catch(() => {})
    apiClient.clearTokens()
    setUser(null)
    localStorage.removeItem("raqam_user")
  }

  const resetPassword = async (email: string) => {
    // Mock password reset - replace with Supabase auth
    console.log("Password reset sent to:", email)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
