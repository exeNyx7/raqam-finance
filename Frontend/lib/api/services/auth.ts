import { apiClient } from "../client"
import type { LoginRequest, RegisterRequest, AuthResponse, User } from "../types"

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials)

    // Store tokens
    apiClient.setTokens(response.data.accessToken, response.data.refreshToken)

    return response.data
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", userData)

    // Store tokens
    apiClient.setTokens(response.data.accessToken, response.data.refreshToken)

    return response.data
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } finally {
      // Always clear tokens, even if logout request fails
      apiClient.clearTokens()
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me")
    return response.data
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>("/auth/profile", userData)
    return response.data
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    })
  }

  async resetPassword(email: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { email })
  }

  async verifyResetToken(token: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/verify-reset", { token, newPassword })
  }

  async uploadAvatar(file: File): Promise<User> {
    const response = await apiClient.upload<User>("/auth/avatar", file)
    return response.data
  }
}

export const authService = new AuthService()
