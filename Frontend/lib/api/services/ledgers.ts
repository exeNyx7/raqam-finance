import { apiClient } from "../client"
import type { Ledger, CreateLedgerRequest, PaginatedResponse, QueryParams } from "../types"

export class LedgerService {
  async getLedgers(params?: QueryParams): Promise<PaginatedResponse<Ledger>> {
    const response = await apiClient.get<PaginatedResponse<Ledger>>("/ledgers", params)
    return response.data
  }

  async getLedger(id: string): Promise<Ledger> {
    const response = await apiClient.get<Ledger>(`/ledgers/${id}`)
    return response.data
  }

  async createLedger(data: CreateLedgerRequest): Promise<Ledger> {
    const response = await apiClient.post<Ledger>("/ledgers", data)
    return response.data
  }

  async updateLedger(id: string, data: Partial<CreateLedgerRequest>): Promise<Ledger> {
    const response = await apiClient.patch<Ledger>(`/ledgers/${id}`, data)
    return response.data
  }

  async deleteLedger(id: string): Promise<void> {
    await apiClient.delete(`/ledgers/${id}`)
  }

  async addMember(ledgerId: string, userId: string, role: "editor" | "viewer"): Promise<Ledger> {
    const response = await apiClient.post<Ledger>(`/ledgers/${ledgerId}/members`, {
      userId,
      role,
    })
    return response.data
  }

  async updateMemberRole(ledgerId: string, userId: string, role: "editor" | "viewer"): Promise<Ledger> {
    const response = await apiClient.patch<Ledger>(`/ledgers/${ledgerId}/members/${userId}`, {
      role,
    })
    return response.data
  }

  async removeMember(ledgerId: string, userId: string): Promise<Ledger> {
    const response = await apiClient.delete<Ledger>(`/ledgers/${ledgerId}/members/${userId}`)
    return response.data
  }

  async leaveLedger(ledgerId: string): Promise<void> {
    await apiClient.post(`/ledgers/${ledgerId}/leave`)
  }

  async getLedgerBalance(ledgerId: string): Promise<{
    balance: number
    currency: string
    lastUpdated: string
  }> {
    const response = await apiClient.get(`/ledgers/${ledgerId}/balance`)
    return response.data
  }

  async getLedgerStats(
    ledgerId: string,
    period: "week" | "month" | "year" = "month",
  ): Promise<{
    totalTransactions: number
    totalIncome: number
    totalExpenses: number
    memberStats: Array<{
      userId: string
      totalContributed: number
      totalOwed: number
    }>
  }> {
    const response = await apiClient.get(`/ledgers/${ledgerId}/stats`, {
      filter: { period },
    })
    return response.data
  }
}

export const ledgerService = new LedgerService()
