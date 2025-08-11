"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Calendar, DollarSign, Repeat, Pause, Play, Trash2 } from "lucide-react"
import { CreateRecurringModal } from "@/components/create-recurring-modal"
import { getRecurrings, getRecurringStats, updateRecurring as apiUpdateRecurring, deleteRecurring as apiDeleteRecurring } from "@/services/api"

type Recurring = {
  id: string
  description: string
  amount: number
  category: string
  frequency: string
  nextDue: string
  startDate: string
  lastProcessed?: string | null
  totalOccurrences: number
  status: "active" | "paused" | "expired"
  ledgerId?: string
}

export default function RecurringPage() {
  const [showCreateRecurring, setShowCreateRecurring] = useState(false)
  const [transactions, setTransactions] = useState<Recurring[]>([])
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState<{ activeCount: number; monthlyTotal: number; nextDue: string | null } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [list, stats] = await Promise.all([
        getRecurrings({ page: 1, limit: 100 }),
        getRecurringStats(),
      ])
      setTransactions(list.data as Recurring[])
      setStatsData(stats as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const stats = useMemo(
    () => [
      {
        title: "Active Recurring",
        value: statsData ? statsData.activeCount : "—",
        icon: Repeat,
        color: "text-green-600",
      },
      {
        title: "Monthly Total",
        value: statsData ? `$${statsData.monthlyTotal.toFixed(2)}` : "—",
        icon: DollarSign,
        color: "text-blue-600",
      },
      {
        title: "Next Due",
        value: statsData?.nextDue || "None",
        icon: Calendar,
        color: "text-orange-600",
      },
    ],
    [statsData],
  )

  const toggleStatus = (id: string) => {
    setTransactions((prev) => prev)
    const current = transactions.find((t) => t.id === id)
    if (!current) return
    const nextStatus = current.status === "active" ? "paused" : "active"
    apiUpdateRecurring(id, { status: nextStatus })
      .then(() => fetchData())
      .catch(() => {/* noop */ })
  }

  const deleteTransaction = (id: string) => {
    apiDeleteRecurring(id)
      .then(() => fetchData())
      .catch(() => {/* noop */ })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      paused: "secondary",
      expired: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysUntilDue = (dateString: string) => {
    const today = new Date()
    const dueDate = new Date(dateString)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Overdue"
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    return `${diffDays} days`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
          <p className="text-muted-foreground">Manage your recurring payments and subscriptions</p>
        </div>
        <Button onClick={() => setShowCreateRecurring(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recurring Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recurring Transactions</CardTitle>
          <CardDescription>All your scheduled recurring payments and subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ledger</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <span className="text-red-600">-${transaction.amount.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{transaction.frequency}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(transaction.nextDue)}</span>
                      <span className="text-xs text-muted-foreground">{getDaysUntilDue(transaction.nextDue)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>{transaction.ledgerId || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleStatus(transaction.id)}>
                          {transaction.status === "active" ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateRecurringModal
        open={showCreateRecurring}
        onOpenChange={(open) => {
          setShowCreateRecurring(open)
          if (!open) fetchData()
        }}
      />
    </div>
  )
}
