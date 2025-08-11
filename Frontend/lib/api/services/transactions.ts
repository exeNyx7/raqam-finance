import { apiClient } from "../client"
import type { Transaction, CreateTransactionRequest, PaginatedResponse, QueryParams } from "../types"

export class TransactionService {
  async getTransactions(params?: QueryParams): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<PaginatedResponse<Transaction>>("/transactions", params)
    return response.data
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`)
    return response.data
  }

  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await apiClient.post<Transaction>("/transactions", data)
    return response.data
  }

  async updateTransaction(id: string, data: Partial<CreateTransactionRequest>): Promise<Transaction> {
    const response = await apiClient.patch<Transaction>(`/transactions/${id}`, data)
    return response.data
  }

  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`)
  }

  async getTransactionsByLedger(ledgerId: string, params?: QueryParams): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(`/ledgers/${ledgerId}/transactions`, params)
    return response.data
  }

  async getTransactionsByCategory(category: string, params?: QueryParams): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<PaginatedResponse<Transaction>>("/transactions", {
      ...params,
      filter: { category },
    })
    return response.data
  }

  async getTransactionStats(period: "week" | "month" | "year" = "month"): Promise<{
    totalIncome: number
    totalExpenses: number
    netAmount: number
    categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>
  }> {
    const response = await apiClient.get(`/transactions/stats`, { filter: { period } })
    return response.data
  }

  async bulkCreateTransactions(transactions: CreateTransactionRequest[]): Promise<Transaction[]> {
    const response = await apiClient.post<Transaction[]>("/transactions/bulk", { transactions })
    return response.data
  }

  async importTransactions(
    file: File,
    format: "csv" | "json" = "csv",
  ): Promise<{
    imported: number
    failed: number
    errors: string[]
  }> {
    const response = await apiClient.upload("/transactions/import", file, { format })
    return response.data
  }

  async exportTransactions(format: "csv" | "json" | "pdf" = "csv", params?: QueryParams): Promise<Blob> {
    const response = await fetch(apiClient["buildURL"](`/transactions/export`, { ...params, format }), {
      headers: {
        Authorization: `Bearer ${apiClient["accessToken"]}`,
      },
    })

    if (!response.ok) {
      throw new Error("Export failed")
    }

    return response.blob()
  }
}

export const transactionService = new TransactionService()
