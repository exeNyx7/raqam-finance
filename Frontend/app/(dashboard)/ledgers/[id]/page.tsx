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
import { Plus, Filter, Download, Settings, Check, Clock, AlertCircle } from "lucide-react"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { getLedger } from "@/services/api"

type LedgerDetail = {
  id: string
  name: string
  description?: string | null
  balance?: number
  totalExpenses?: number
  membersDetailed: Array<{ id: string; name: string; email: string; avatar?: string | null; role: string }>
}

const transactions = [
  {
    id: "1",
    description: "Flight Tickets",
    amount: 800.0,
    category: "Travel",
    date: "2024-01-01",
    paidBy: { id: "1", name: "You" },
    splits: [
      { userId: "1", amount: 200.0, status: "paid", isPayer: true },
      { userId: "2", amount: 200.0, status: "pending", isPayer: false },
      { userId: "3", amount: 200.0, status: "marked_paid", isPayer: false },
      { userId: "4", amount: 200.0, status: "settled", isPayer: false },
    ],
    status: "pending",
  },
  {
    id: "2",
    description: "Hotel Accommodation",
    amount: 600.0,
    category: "Accommodation",
    date: "2024-01-02",
    paidBy: { id: "2", name: "Alice Johnson" },
    splits: [
      { userId: "1", amount: 150.0, status: "settled", isPayer: false },
      { userId: "2", amount: 150.0, status: "paid", isPayer: true },
      { userId: "3", amount: 150.0, status: "settled", isPayer: false },
      { userId: "4", amount: 150.0, status: "settled", isPayer: false },
    ],
    status: "settled",
  },
  {
    id: "3",
    description: "Group Dinner",
    amount: 120.0,
    category: "Food",
    date: "2024-01-03",
    paidBy: { id: "3", name: "Bob Smith" },
    splits: [
      { userId: "1", amount: 30.0, status: "awaiting_approval", isPayer: false },
      { userId: "2", amount: 30.0, status: "marked_paid", isPayer: false },
      { userId: "3", amount: 30.0, status: "paid", isPayer: true },
      { userId: "4", amount: 30.0, status: "marked_paid", isPayer: false },
    ],
    status: "awaiting_approval",
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "settled":
      return <Check className="h-4 w-4 text-green-600" />
    case "pending":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case "awaiting_approval":
      return <Clock className="h-4 w-4 text-blue-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

const getStatusBadge = (status: string) => {
  const variants = {
    settled: "default",
    pending: "secondary",
    awaiting_approval: "outline",
  } as const

  return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status.replace("_", " ")}</Badge>
}

export default function LedgerDetailPage() {
  const params = useParams()
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [filterCategory, setFilterCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [ledgerData, setLedgerData] = useState<LedgerDetail | null>(null)

  useEffect(() => {
    const id = params?.id as string
    if (!id) return
    let mounted = true
      ; (async () => {
        try {
          const data = await getLedger(id)
          if (mounted) setLedgerData(data)
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

  const handleMarkAsPaid = (transactionId: string, userId: string) => {
    // Mock implementation
    console.log(`Marking transaction ${transactionId} as paid for user ${userId}`)
  }

  const handleApprovePayment = (transactionId: string) => {
    // Mock implementation
    console.log(`Approving payment for transaction ${transactionId}`)
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
                <Badge variant="outline">{member.role}</Badge>
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
                <TableHead>Your Share</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const userSplit = transaction.splits.find((split) => split.userId === "1")
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>{transaction.paidBy.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>${userSplit?.amount.toFixed(2)}</span>
                        {userSplit && (
                          <Badge
                            variant={
                              userSplit.status === "settled"
                                ? "default"
                                : userSplit.status === "paid"
                                  ? "default"
                                  : userSplit.status === "marked_paid"
                                    ? "secondary"
                                    : "outline"
                            }
                            className="text-xs"
                          >
                            {userSplit.status.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(transaction.status)}
                        {getStatusBadge(transaction.status)}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {userSplit && !userSplit.isPayer && userSplit.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(transaction.id, "1")}>
                            Mark Paid
                          </Button>
                        )}
                        {transaction.paidBy.id === "1" && transaction.status === "awaiting_approval" && (
                          <Button size="sm" onClick={() => handleApprovePayment(transaction.id)}>
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddTransactionModal open={showAddTransaction} onOpenChange={setShowAddTransaction} />
    </div>
  )
}
