import type { ApiResponse, QueryParams } from "./types"

export class ApiClient {
  private baseURL: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL) {
    this.baseURL = baseURL
    this.loadTokensFromStorage()
  }

  private loadTokensFromStorage() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken")
      this.refreshToken = localStorage.getItem("refreshToken")
    }
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
    }
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  private clearTokensFromStorage() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    }
    this.accessToken = null
    this.refreshToken = null
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.saveTokensToStorage(data.accessToken, data.refreshToken)
        return true
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
    }

    this.clearTokensFromStorage()
    return false
  }

  private buildURL(endpoint: string, params?: QueryParams): string {
    const url = new URL(`${this.baseURL}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            url.searchParams.append(key, JSON.stringify(value))
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    return url.toString()
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: QueryParams,
    retryCount = 0,
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, params)

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryCount === 0) {
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          return this.makeRequest<T>(endpoint, options, params, retryCount + 1)
        } else {
          // Redirect to login or emit auth error event
          window.dispatchEvent(new CustomEvent("auth:expired"))
          throw new Error("Authentication expired")
        }
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "An error occurred")
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }

      // Network or other errors
      throw new Error("Network error occurred")
    }
  }

  // Authentication methods
  setTokens(accessToken: string, refreshToken: string) {
    this.saveTokensToStorage(accessToken, refreshToken)
  }

  clearTokens() {
    this.clearTokensFromStorage()
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: "GET" }, params)
  }

  async post<T>(endpoint: string, data?: any, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      params,
    )
  }

  async put<T>(endpoint: string, data?: any, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      params,
    )
  }

  async patch<T>(endpoint: string, data?: any, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      },
      params,
    )
  }

  async delete<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: "DELETE" }, params)
  }

  // File upload
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append("file", file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value))
      })
    }

    const headers: HeadersInit = {}
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Upload failed")
    }

    return data
  }
}

// Create singleton instance
export const apiClient = new ApiClient()
