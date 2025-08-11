"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { login as apiLogin, register as apiRegister } from "@/services/api"

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
    const savedUser = localStorage.getItem("raqam_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    const data = await apiLogin({ email, password })
    // persist tokens
    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)
    setUser(data.user)
    localStorage.setItem("raqam_user", JSON.stringify(data.user))
  }

  const signUp = async (email: string, password: string, name: string) => {
    const data = await apiRegister({ name, email, password })
    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)
    setUser(data.user)
    localStorage.setItem("raqam_user", JSON.stringify(data.user))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem("raqam_user")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
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
