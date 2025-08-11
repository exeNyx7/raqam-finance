"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { getDashboardStats, getTransactions } from "@/services/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  activeLedgers: number
  trends: {
    income: number
    expenses: number
    balance: number
  }
}

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  ledgerId?: string
  type: "income" | "expense"
  status: string
}

export default function DashboardPage() {
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, transactionsData] = await Promise.all([
        getDashboardStats(),
        getTransactions({ limit: 5, sort: "-date" })
      ])

      setStats(statsData)
      setRecentTransactions(transactionsData.data || [])
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
    }).format(amount)
  }

  const getTrendIcon = (trend: "up" | "down") => {
    return trend === "up" ? TrendingUp : TrendingDown
  }

  const getTrendColor = (trend: "up" | "down") => {
    return trend === "up" ? "text-green-600" : "text-red-600"
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading your financial overview...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const dashboardStats = [
    {
      title: "Total Balance",
      value: formatCurrency(stats?.totalBalance || 0),
      change: stats?.trends?.balance ? `${stats.trends.balance > 0 ? "+" : ""}${stats.trends.balance.toFixed(1)}%` : "0%",
      trend: (stats?.trends?.balance || 0) >= 0 ? "up" as const : "down" as const,
      icon: DollarSign,
    },
    {
      title: "Monthly Income",
      value: formatCurrency(stats?.monthlyIncome || 0),
      change: stats?.trends?.income ? `${stats.trends.income > 0 ? "+" : ""}${stats.trends.income.toFixed(1)}%` : "0%",
      trend: (stats?.trends?.income || 0) >= 0 ? "up" as const : "down" as const,
      icon: TrendingUp,
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(stats?.monthlyExpenses || 0),
      change: stats?.trends?.expenses ? `${stats.trends.expenses > 0 ? "+" : ""}${stats.trends.expenses.toFixed(1)}%` : "0%",
      trend: (stats?.trends?.expenses || 0) >= 0 ? "up" as const : "down" as const,
      icon: TrendingDown,
    },
    {
      title: "Active Ledgers",
      value: stats?.activeLedgers?.toString() || "0",
      change: "+0",
      trend: "up" as const,
      icon: Users,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial activity</p>
        </div>
        <Button onClick={() => setShowAddTransaction(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => {
          const TrendIcon = getTrendIcon(stat.trend)
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={getTrendColor(stat.trend)}>{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity across all ledgers</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet. Add your first transaction to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {transaction.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : transaction.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddTransactionModal open={showAddTransaction} onOpenChange={setShowAddTransaction} onCreated={loadDashboardData} />
    </div>
  )
}
