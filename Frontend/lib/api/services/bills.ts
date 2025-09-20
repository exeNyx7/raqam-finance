import { apiClient } from "../client"
import type { Bill, CreateBillRequest, PaginatedResponse, QueryParams } from "../types"

export class BillService {
  async getBills(params?: QueryParams): Promise<PaginatedResponse<Bill>> {
    const response = await apiClient.get<PaginatedResponse<Bill>>("/bills", params)
    return response.data
  }

  async getBill(id: string): Promise<Bill> {
    const response = await apiClient.get<Bill>(`/bills/${id}`)
    return response.data
  }

  async createBill(data: CreateBillRequest): Promise<Bill> {
    const response = await apiClient.post<Bill>("/bills", data)
    return response.data
  }

  async updateBill(id: string, data: Partial<CreateBillRequest>): Promise<Bill> {
    const response = await apiClient.patch<Bill>(`/bills/${id}`, data)
    return response.data
  }

  async deleteBill(id: string): Promise<void> {
    await apiClient.delete(`/bills/${id}`)
  }

  async finalizeBill(id: string): Promise<Bill> {
    const response = await apiClient.post<Bill>(`/bills/${id}/finalize`)
    return response.data
  }

  async settleBill(id: string): Promise<Bill> {
    const response = await apiClient.post<Bill>(`/bills/${id}/settle`)
    return response.data
  }

  async markPaymentReceived(billId: string, participantId: string): Promise<Bill> {
    const response = await apiClient.post<Bill>(`/bills/${billId}/payments/${participantId}/received`)
    return response.data
  }

  async updatePaymentStatus(billId: string, participantId: string, status: 'paid' | 'pending'): Promise<Bill> {
    const response = await apiClient.patch<Bill>(`/bills/${billId}/payment-status`, {
      participantId,
      status
    })
    return response.data
  }

  async getSettlementDetails(billId: string): Promise<{
    billId: string
    billDescription: string
    totalAmount: number
    paidBy: string
    status: string
    settlements: Array<{
      participantId: string
      owedAmount: number
      isPaid: boolean
      remainingAmount: number
    }>
    summary: {
      totalOwed: number
      totalPaid: number
      totalRemaining: number
      isFullySettled: boolean
      settlementPercentage: number
    }
  }> {
    const response = await apiClient.get(`/bills/${billId}/settlement`)
    return response.data
  }

  async getOptimalSettlements(billId: string): Promise<{
    billId: string
    paidBy: string
    settlements: Array<{
      from: string
      to: string
      amount: number
      reason: string
    }>
    totalPending: number
  }> {
    const response = await apiClient.get(`/bills/${billId}/optimal-settlements`)
    return response.data
  }

  async sendReminder(billId: string, participantId: string): Promise<void> {
    await apiClient.post(`/bills/${billId}/reminders/${participantId}`)
  }

  async getBillSummary(id: string): Promise<{
    bill: Bill
    payments: Array<{
      participantId: string
      amount: number
      status: "pending" | "paid" | "confirmed"
    }>
    totalPaid: number
    totalPending: number
  }> {
    const response = await apiClient.get(`/bills/${id}/summary`)
    return response.data
  }

  async duplicateBill(id: string): Promise<Bill> {
    const response = await apiClient.post<Bill>(`/bills/${id}/duplicate`)
    return response.data
  }
}

export const billService = new BillService()
