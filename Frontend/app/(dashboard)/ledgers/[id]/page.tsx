"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Filter, Download, Settings } from "lucide-react"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { getLedger, getTransactions, getLedgerTransactions, approveLedgerShare, markLedgerSharePaid, deleteLedgerTransaction } from "@/services/api"
import { useAuth } from "@/contexts/auth-context"

type LedgerDetail = {
  id: string
  name: string
  description?: string | null
  balance?: number
  totalExpenses?: number
  membersDetailed: Array<{ id: string; name: string; email: string; avatar?: string | null }>
}

// Transactions will be loaded from API filtered by ledgerId

export default function LedgerDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [filterCategory, setFilterCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [ledgerData, setLedgerData] = useState<LedgerDetail | null>(null)
  const [transactions, setTransactions] = useState<Array<{ id: string; description: string; totalAmount: number; category: string; date: string; paidBy?: { id: string; name?: string | null }; shares?: Array<{ user: { id: string; name?: string | null }, amount: number, status: string }> }>>([])

  useEffect(() => {
    const id = params?.id as string
    if (!id) return
    let mounted = true
      ; (async () => {
        try {
          const data = await getLedger(id)
          if (mounted) setLedgerData(data)
          const ltx = await getLedgerTransactions(id)
          if (mounted) setTransactions(Array.isArray(ltx) ? ltx : [])
        } catch (e) {
          console.error(e)
        }
      })()
    return () => {
      mounted = false
    }
  }, [params?.id])

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleMarkAsPaid = async (transactionId: string) => {
    if (!params?.id) return
    await markLedgerSharePaid(String(params.id), transactionId)
    const ltx = await getLedgerTransactions(String(params.id))
    setTransactions(Array.isArray(ltx) ? ltx : [])
  }

  const handleApprovePayment = async (transactionId: string, userId: string) => {
    if (!params?.id) return
    await approveLedgerShare(String(params.id), transactionId, userId)
    const ltx = await getLedgerTransactions(String(params.id))
    setTransactions(Array.isArray(ltx) ? ltx : [])
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{ledgerData?.name || "Ledger"}</h1>
          <p className="text-muted-foreground">{ledgerData?.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => setShowAddTransaction(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${(ledgerData?.balance || 0) > 0 ? "text-green-600" : (ledgerData?.balance || 0) < 0 ? "text-red-600" : "text-muted-foreground"
                }`}
            >
              {ledgerData?.balance && ledgerData.balance > 0 ? "+" : ""}${(ledgerData?.balance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(ledgerData?.balance || 0) > 0 ? "You are owed" : (ledgerData?.balance || 0) < 0 ? "You owe" : "All settled"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(ledgerData?.totalExpenses || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex -space-x-2 mb-2">
              {ledgerData?.membersDetailed?.map((member) => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{member.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{ledgerData?.membersDetailed?.length || 0} members</p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People with access to this ledger</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ledgerData?.membersDetailed?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{member.name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                {/* Role removed: equal permissions */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>All expenses and payments in this ledger</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Accommodation">Accommodation</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const isPayer = transaction.paidBy?.id && user?.id && transaction.paidBy.id === user.id
                const myShare = (transaction.shares || []).find((s) => s.user?.id === user?.id)
                const canMarkPaid = !!myShare && myShare.status === "pending" && !isPayer
                const canApprove = !!isPayer
                const canDelete = !!isPayer
                const statuses = (transaction.shares || []).map((s) => s.status)
                const overall = statuses.length === 0 ? "-" : statuses.every((s) => s === "approved") ? "approved" : statuses.some((s) => s === "paid") ? "pending approval" : "pending"
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>${Number(transaction.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>{transaction.paidBy?.name || "-"}</TableCell>
                    <TableCell>{overall}</TableCell>
                    <TableCell>{new Date(transaction.date).toISOString().split("T")[0]}</TableCell>
                    <TableCell className="space-x-2">
                      {/* Mark as paid for self if present and not payer */}
                      {canMarkPaid && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(transaction.id)}>Mark Paid</Button>
                      )}
                      {/* Approve buttons only for payer for each participant in paid status */}
                      {canApprove && (transaction.shares || []).filter((s) => s.status === "paid").map((s) => (
                        <Button key={s.user.id} variant="outline" size="sm" onClick={() => handleApprovePayment(transaction.id, s.user.id)}>
                          Approve {s.user.name?.split(" ")[0] || "user"}
                        </Button>
                      ))}
                      {/* Delete only if payer */}
                      {canDelete && (
                        <Button variant="destructive" size="sm" onClick={async () => {
                          if (!params?.id) return
                          await deleteLedgerTransaction(String(params.id), transaction.id)
                          const ltx = await getLedgerTransactions(String(params.id))
                          setTransactions(Array.isArray(ltx) ? ltx : [])
                        }}>Delete</Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddTransactionModal
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        ledgerId={(params?.id as string) || undefined}
        onCreated={async () => {
          const id = params?.id as string
          if (!id) return
          try {
            const ltx = await getLedgerTransactions(id)
            setTransactions(Array.isArray(ltx) ? ltx : [])
          } catch (e) { console.error(e) }
        }}
      />
    </div>
  )
}
