import { apiClient } from "../client"

export class AnalyticsService {
  async getDashboardStats(period: "week" | "month" | "quarter" | "year" = "month"): Promise<{
    totalBalance: number
    monthlyIncome: number
    monthlyExpenses: number
    activeLedgers: number
    trends: {
      income: number
      expenses: number
      balance: number
    }
  }> {
    const response = await apiClient.get("/analytics/dashboard", {
      filter: { period },
    })
    return response.data
  }

  async getExpenseBreakdown(period: "week" | "month" | "quarter" | "year" = "month"): Promise<
    Array<{
      category: string
      amount: number
      percentage: number
      transactions: number
      trend: number
    }>
  > {
    const response = await apiClient.get("/analytics/expenses/breakdown", {
      filter: { period },
    })
    return response.data
  }

  async getIncomeBreakdown(period: "week" | "month" | "quarter" | "year" = "month"): Promise<
    Array<{
      source: string
      amount: number
      percentage: number
      transactions: number
      trend: number
    }>
  > {
    const response = await apiClient.get("/analytics/income/breakdown", {
      filter: { period },
    })
    return response.data
  }

  async getMonthlyTrends(months = 12): Promise<
    Array<{
      month: string
      income: number
      expenses: number
      savings: number
      savingsRate: number
    }>
  > {
    const response = await apiClient.get("/analytics/trends/monthly", {
      filter: { months },
    })
    return response.data
  }

  async getBudgetAnalysis(): Promise<{
    totalBudgeted: number
    totalSpent: number
    budgetUtilization: number
    budgets: Array<{
      id: string
      name: string
      budgeted: number
      spent: number
      utilization: number
      status: "on_track" | "warning" | "exceeded"
    }>
  }> {
    const response = await apiClient.get("/analytics/budgets")
    return response.data
  }

  async getGoalAnalysis(): Promise<{
    totalTargetAmount: number
    totalCurrentAmount: number
    overallProgress: number
    goals: Array<{
      id: string
      name: string
      targetAmount: number
      currentAmount: number
      progress: number
      projectedCompletion?: string
      onTrack: boolean
    }>
  }> {
    const response = await apiClient.get("/analytics/goals")
    return response.data
  }

  async getCashFlowAnalysis(period: "week" | "month" | "quarter" | "year" = "month"): Promise<{
    netCashFlow: number
    inflows: Array<{
      date: string
      amount: number
      source: string
    }>
    outflows: Array<{
      date: string
      amount: number
      category: string
    }>
    projectedBalance: number
  }> {
    const response = await apiClient.get("/analytics/cash-flow", {
      filter: { period },
    })
    return response.data
  }

  async getSpendingPatterns(): Promise<{
    dailyAverage: number
    weeklyAverage: number
    monthlyAverage: number
    topCategories: Array<{
      category: string
      frequency: number
      averageAmount: number
    }>
    spendingByDay: Array<{
      day: string
      amount: number
    }>
    spendingByHour: Array<{
      hour: number
      amount: number
      transactions: number
    }>
  }> {
    const response = await apiClient.get("/analytics/spending-patterns")
    return response.data
  }

  async exportReport(
    type: "dashboard" | "expenses" | "income" | "budgets" | "goals",
    format: "pdf" | "csv" | "excel" = "pdf",
    period: "week" | "month" | "quarter" | "year" = "month",
  ): Promise<Blob> {
    const response = await fetch(
      apiClient["buildURL"](`/analytics/export/${type}`, {
        format,
        period,
      }),
      {
        headers: {
          Authorization: `Bearer ${apiClient["accessToken"]}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Export failed")
    }

    return response.blob()
  }
}

export const analyticsService = new AnalyticsService()
