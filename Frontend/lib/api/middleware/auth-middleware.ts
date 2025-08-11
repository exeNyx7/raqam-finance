"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "../client"
import { useToast } from "@/hooks/use-toast"

export function useAuthMiddleware() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthExpired = () => {
      toast({
        title: "Session Expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      })
      router.push("/auth/signin")
    }

    const handleNetworkError = () => {
      toast({
        title: "Network Error",
        description: "Please check your internet connection.",
        variant: "destructive",
      })
    }

    // Listen for auth events
    window.addEventListener("auth:expired", handleAuthExpired)
    window.addEventListener("network:error", handleNetworkError)

    return () => {
      window.removeEventListener("auth:expired", handleAuthExpired)
      window.removeEventListener("network:error", handleNetworkError)
    }
  }, [router, toast])

  return {
    isAuthenticated: apiClient.isAuthenticated(),
    clearAuth: () => apiClient.clearTokens(),
  }
}
