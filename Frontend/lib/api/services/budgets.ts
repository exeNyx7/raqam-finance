import { apiClient } from "../client"
import type { Budget, CreateBudgetRequest, PaginatedResponse, QueryParams } from "../types"

export class BudgetService {
  async getBudgets(params?: QueryParams): Promise<PaginatedResponse<Budget>> {
    const response = await apiClient.get<PaginatedResponse<Budget>>("/budgets", params)
    return response.data
  }

  async getBudget(id: string): Promise<Budget> {
    const response = await apiClient.get<Budget>(`/budgets/${id}`)
    return response.data
  }

  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    const response = await apiClient.post<Budget>("/budgets", data)
    return response.data
  }

  async updateBudget(id: string, data: Partial<CreateBudgetRequest>): Promise<Budget> {
    const response = await apiClient.patch<Budget>(`/budgets/${id}`, data)
    return response.data
  }

  async deleteBudget(id: string): Promise<void> {
    await apiClient.delete(`/budgets/${id}`)
  }

  async getBudgetProgress(id: string): Promise<{
    budget: Budget
    progress: number
    remaining: number
    daysLeft: number
    onTrack: boolean
    projectedSpend: number
  }> {
    const response = await apiClient.get(`/budgets/${id}/progress`)
    return response.data
  }

  async getBudgetsByCategory(category: string, params?: QueryParams): Promise<PaginatedResponse<Budget>> {
    const response = await apiClient.get<PaginatedResponse<Budget>>("/budgets", {
      ...params,
      filter: { category },
    })
    return response.data
  }

  async getBudgetAlerts(): Promise<
    Array<{
      budgetId: string
      budgetName: string
      alertType: "near_limit" | "exceeded" | "expired"
      message: string
      severity: "low" | "medium" | "high"
    }>
  > {
    const response = await apiClient.get("/budgets/alerts")
    return response.data
  }

  async resetBudget(id: string): Promise<Budget> {
    const response = await apiClient.post<Budget>(`/budgets/${id}/reset`)
    return response.data
  }
}

export const budgetService = new BudgetService()
