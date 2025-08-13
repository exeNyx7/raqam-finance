"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar } from "lucide-react"
import { CreateBudgetModal } from "@/components/create-budget-modal"
import { EditBudgetModal } from "@/components/edit-budget-modal"

import { getBudgets } from "@/services/api"

export default function BudgetPage() {
  const { state } = useApp()
  const [showCreateBudget, setShowCreateBudget] = useState(false)
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBudget, setEditingBudget] = useState<any | null>(null)

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const res = await getBudgets({ limit: 100 })
      setBudgets(res.data || [])
    } catch (error) {
      console.error("Failed to load budgets:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgets()
  }, [])

  const activeBudgets = budgets.filter((budget) => budget.status === "active")
  const weeklyBudgets = activeBudgets.filter((budget) => budget.period === "weekly")
  const monthlyBudgets = activeBudgets.filter((budget) => budget.period === "monthly")

  const totalBudgeted = activeBudgets.reduce((sum, budget) => sum + (budget.amount || 0), 0)
  const totalSpent = activeBudgets.reduce((sum, budget) => sum + (budget.spent || 0), 0)
  const remainingBudget = totalBudgeted - totalSpent

  const getBudgetStatus = (budget: any) => {
    const percentage = (budget.spent / budget.amount) * 100
    if (percentage >= 100) return { status: "exceeded", color: "text-red-600", variant: "destructive" as const }
    if (percentage >= 80) return { status: "warning", color: "text-yellow-600", variant: "secondary" as const }
    return { status: "good", color: "text-green-600", variant: "default" as const }
  }

  const BudgetCard = ({ budget }: { budget: any }) => {
    const percentage = Math.min((budget.spent / budget.amount) * 100, 100)
    const remaining = budget.amount - budget.spent
    const { status, color, variant } = getBudgetStatus(budget)

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{budget.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={variant}>
                {status === "exceeded" ? "Over Budget" : status === "warning" ? "Near Limit" : "On Track"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setEditingBudget(budget)}>
                Edit
              </Button>
            </div>
          </div>
          <CardDescription className="capitalize">
            {budget.period} • {budget.category}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className={color}>{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Budgeted</p>
              <p className="font-semibold">
                {state.settings.currency} {budget.amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Spent</p>
              <p className="font-semibold">
                {state.settings.currency} {budget.spent.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining</p>
              <p className={`font-semibold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                {state.settings.currency} {remaining.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {budget.startDate} - {budget.endDate}
            </span>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>
                {Math.ceil((new Date(budget.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                left
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
            <p className="text-muted-foreground">Loading your budgets...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-full bg-muted animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">Track and manage your spending limits</p>
        </div>
        <Button onClick={() => setShowCreateBudget(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.settings.currency} {totalBudgeted.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{activeBudgets.length} active budgets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.settings.currency} {totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : "0"}% of total budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            {remainingBudget >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
              {state.settings.currency} {remainingBudget.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{remainingBudget >= 0 ? "Under budget" : "Over budget"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Lists */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Budgets ({monthlyBudgets.length})</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Budgets ({weeklyBudgets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          {monthlyBudgets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Monthly Budgets</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first monthly budget to start tracking your spending.
                </p>
                <Button onClick={() => setShowCreateBudget(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {monthlyBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {weeklyBudgets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Weekly Budgets</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first weekly budget to track short-term spending.
                </p>
                <Button onClick={() => setShowCreateBudget(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeklyBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateBudgetModal open={showCreateBudget} onOpenChange={setShowCreateBudget} onCreated={loadBudgets} />
      {editingBudget && (
        <EditBudgetModal
          open={!!editingBudget}
          onOpenChange={(open) => !open && setEditingBudget(null)}
          budget={editingBudget}
          onUpdated={loadBudgets}
          onDeleted={loadBudgets}
        />
      )}
    </div>
  )
}
