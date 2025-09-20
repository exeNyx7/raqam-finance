// Export all services
export * from "./client"
export * from "./types"
export * from "./hooks/useApi"

// Service exports
export { authService } from "./services/auth"
export { transactionService } from "./services/transactions"
export { ledgerService } from "./services/ledgers"
export { budgetService } from "./services/budgets"
export { goalService } from "./services/goals"
export { billService } from "./services/bills"
export { notificationService } from "./services/notifications"
export { analyticsService } from "./services/analytics"

// Utility functions
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const formatCurrency = (amount: number, currency = "PKR") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export const formatDate = (date: string | Date, format = "DD/MM/YYYY") => {
  const d = new Date(date)

  switch (format) {
    case "DD/MM/YYYY":
      return d.toLocaleDateString("en-GB")
    case "MM/DD/YYYY":
      return d.toLocaleDateString("en-US")
    case "YYYY-MM-DD":
      return d.toISOString().split("T")[0]
    default:
      return d.toLocaleDateString()
  }
}

// Error handling utilities
export const handleApiError = (error: any, fallbackMessage = "An error occurred") => {
  if (error instanceof Error && error.name === "ApiError") {
    return error.message
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return fallbackMessage
}

// Retry utility
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (i === maxRetries) {
        throw error
      }

      // Don't retry on authentication errors
      if (error instanceof Error && error.name === "ApiError" && (error as any).code === "AUTH_EXPIRED") {
        throw error
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }

  throw lastError
}
