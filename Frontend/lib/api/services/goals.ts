import { apiClient } from "../client"
import type { Goal, CreateGoalRequest, PaginatedResponse, QueryParams } from "../types"

export class GoalService {
  async getGoals(params?: QueryParams): Promise<PaginatedResponse<Goal>> {
    const response = await apiClient.get<PaginatedResponse<Goal>>("/goals", params)
    return response.data
  }

  async getGoal(id: string): Promise<Goal> {
    const response = await apiClient.get<Goal>(`/goals/${id}`)
    return response.data
  }

  async createGoal(data: CreateGoalRequest): Promise<Goal> {
    const response = await apiClient.post<Goal>("/goals", data)
    return response.data
  }

  async updateGoal(id: string, data: Partial<CreateGoalRequest>): Promise<Goal> {
    const response = await apiClient.patch<Goal>(`/goals/${id}`, data)
    return response.data
  }

  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`)
  }

  async addContribution(goalId: string, amount: number, note?: string): Promise<Goal> {
    const response = await apiClient.post<Goal>(`/goals/${goalId}/contributions`, {
      amount,
      note,
    })
    return response.data
  }

  async getGoalContributions(
    goalId: string,
    params?: QueryParams,
  ): Promise<
    PaginatedResponse<{
      id: string
      amount: number
      note?: string
      createdAt: string
    }>
  > {
    const response = await apiClient.get(`/goals/${goalId}/contributions`, params)
    return response.data
  }

  async getGoalProgress(id: string): Promise<{
    goal: Goal
    progress: number
    remaining: number
    daysLeft?: number
    onTrack: boolean
    projectedCompletion?: string
    monthlyTarget?: number
  }> {
    const response = await apiClient.get(`/goals/${id}/progress`)
    return response.data
  }

  async pauseGoal(id: string): Promise<Goal> {
    const response = await apiClient.post<Goal>(`/goals/${id}/pause`)
    return response.data
  }

  async resumeGoal(id: string): Promise<Goal> {
    const response = await apiClient.post<Goal>(`/goals/${id}/resume`)
    return response.data
  }

  async completeGoal(id: string): Promise<Goal> {
    const response = await apiClient.post<Goal>(`/goals/${id}/complete`)
    return response.data
  }
}

export const goalService = new GoalService()
