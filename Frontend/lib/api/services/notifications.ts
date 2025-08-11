import { apiClient } from "../client"
import type { Notification, PaginatedResponse, QueryParams } from "../types"

export class NotificationService {
  async getNotifications(params?: QueryParams): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get<PaginatedResponse<Notification>>("/notifications", params)
    return response.data
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>("/notifications/unread-count")
    return response.data.count
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all")
  }

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`)
  }

  async updatePreferences(preferences: {
    email: boolean
    push: boolean
    reminders: boolean
    types: string[]
  }): Promise<void> {
    await apiClient.patch("/notifications/preferences", preferences)
  }

  async getPreferences(): Promise<{
    email: boolean
    push: boolean
    reminders: boolean
    types: string[]
  }> {
    const response = await apiClient.get("/notifications/preferences")
    return response.data
  }

  async subscribeToPush(subscription: PushSubscription): Promise<void> {
    await apiClient.post("/notifications/push-subscribe", { subscription })
  }

  async unsubscribeFromPush(): Promise<void> {
    await apiClient.post("/notifications/push-unsubscribe")
  }
}

export const notificationService = new NotificationService()
