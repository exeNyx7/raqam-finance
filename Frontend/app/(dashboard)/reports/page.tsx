"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, Download } from "lucide-react"
import { getDashboardStats, getExpenseBreakdown, getMonthlyTrends, getTransactions, getBudgets, getGoals } from "@/services/api"

export default function ReportsPage() {
  const { state } = useApp()
  const [timeRange, setTimeRange] = useState("month")
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<{
    totalBalance: number
    monthlyIncome: number
    monthlyExpenses: number
    activeLedgers?: number
    trends: { income: number; expenses: number; balance: number }
  } | null>(null)
  const [expenseBreakdown, setExpenseBreakdown] = useState<Array<{ category: string; amount: number; percentage: number }>>([])
  const [monthly, setMonthly] = useState<Array<{ month: string; income: number; expenses: number; savings: number }>>([])
  const [topExpenses, setTopExpenses] = useState<Array<{ description: string; amount: number; date: string; category: string }>>([])
  const [budgets, setBudgets] = useState<Array<{ id: string; name: string; amount: number; spent: number; period: string; category?: string }>>([])
  const [goals, setGoals] = useState<Array<{ id: string; name: string; category: string; currentAmount: number; targetAmount: number; status: string }>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [ov, breakdown, trends, tx, budgetsRes, goalsRes] = await Promise.all([
          getDashboardStats(timeRange),
          getExpenseBreakdown(timeRange),
          getMonthlyTrends(6),
          getTransactions({ sort: "-amount", limit: 5, filter: { type: "expense" } }),
          getBudgets({ limit: 50 }),
          getGoals({ limit: 50 }),
        ])
        if (cancelled) return
        setOverview(ov)
        setExpenseBreakdown((breakdown || []).map((i: any) => ({ category: i.category, amount: i.amount, percentage: i.percentage })))
        setMonthly(trends || [])
        setTopExpenses(
          ((tx && tx.data) || []).map((t: any) => ({ description: t.description, amount: t.amount, date: new Date(t.date).toLocaleDateString(), category: t.category })),
        )
        setBudgets(((budgetsRes && budgetsRes.data) || []).map((b: any) => b))
        setGoals(((goalsRes && goalsRes.data) || []).map((g: any) => g))
      } catch (e) {
        // no-op
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [timeRange])

  const totalExpenses = useMemo(() => expenseBreakdown.reduce((sum, item) => sum + item.amount, 0), [expenseBreakdown])
  const totalIncome = overview?.monthlyIncome || 0
  const totalSavings = Math.max(0, totalIncome - totalExpenses)
  const savingsRate = totalIncome ? (totalSavings / totalIncome) * 100 : 0

  const budgetProgress = budgets.map((budget) => ({
    ...budget,
    percentage: (budget.spent / Math.max(1, budget.amount)) * 100,
  }))

  const goalProgress = goals.map((goal) => ({
    ...goal,
    percentage: (goal.currentAmount / Math.max(1, goal.targetAmount)) * 100,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analyze your financial data and trends</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {state.settings.currency} {totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview ? `${overview.trends.income >= 0 ? '+' : ''}${overview.trends.income.toFixed(1)}% from last period` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {state.settings.currency} {totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview ? `${overview.trends.expenses >= 0 ? '+' : ''}${overview.trends.expenses.toFixed(1)}% from last period` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {state.settings.currency} {totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{savingsRate.toFixed(1)}% savings rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.filter((g) => g.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(goalProgress.reduce((sum, g) => sum + g.percentage, 0) / goalProgress.length || 0)}% avg
              progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="budgets">Budget Performance</TabsTrigger>
          <TabsTrigger value="goals">Goal Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Expense Breakdown</span>
                </CardTitle>
                <CardDescription>Spending by category this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseBreakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.category}</span>
                      <span className="font-medium">
                        {state.settings.currency} {item.amount.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={Math.min(item.percentage, 100)} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Expenses</CardTitle>
                <CardDescription>Largest individual transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topExpenses.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {expense.date} • {expense.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        -{state.settings.currency} {expense.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Monthly Trends</span>
              </CardTitle>
              <CardDescription>Income, expenses, and savings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthly.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{month.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-green-600">
                          Income: {state.settings.currency} {month.income.toLocaleString()}
                        </span>
                        <span className="text-red-600">
                          Expenses: {state.settings.currency} {month.expenses.toLocaleString()}
                        </span>
                        <span className="text-blue-600">
                          Savings: {state.settings.currency} {month.savings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1 h-4 bg-muted rounded">
                      <div
                        className="bg-red-500 rounded-l"
                        style={{ width: `${(month.expenses / Math.max(1, month.income)) * 100}%` }}
                      />
                      <div
                        className="bg-blue-500 rounded-r"
                        style={{ width: `${(month.savings / Math.max(1, month.income)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Performance</CardTitle>
              <CardDescription>How you're tracking against your budgets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetProgress.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No budgets created yet.</p>
                </div>
              ) : (
                budgetProgress.map((budget) => (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{budget.name}</span>
                        <Badge
                          variant={
                            budget.percentage >= 100 ? "destructive" : budget.percentage >= 80 ? "secondary" : "default"
                          }
                          className="ml-2"
                        >
                          {budget.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {state.settings.currency} {budget.spent.toFixed(2)} / {state.settings.currency}{" "}
                          {budget.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {budget.period} • {budget.category}
                        </div>
                      </div>
                    </div>
                    <Progress value={Math.min(budget.percentage, 100)} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>Track your savings goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goalProgress.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No goals created yet.</p>
                </div>
              ) : (
                goalProgress.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{goal.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {goal.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {state.settings.currency} {goal.currentAmount.toLocaleString()} / {state.settings.currency}{" "}
                          {goal.targetAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">{goal.percentage.toFixed(1)}% complete</div>
                      </div>
                    </div>
                    <Progress value={Math.min(goal.percentage, 100)} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
