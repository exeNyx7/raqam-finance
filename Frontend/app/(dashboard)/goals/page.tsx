"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Trophy, Target, Calendar, TrendingUp, Flag } from "lucide-react"
import { CreateGoalModal } from "@/components/create-goal-modal"
import { AddGoalContributionModal } from "@/components/add-goal-contribution-modal"
import { deleteGoal, getGoals } from "@/services/api"

export default function GoalsPage() {
  const { state } = useApp()
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [showAddContribution, setShowAddContribution] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const res = await getGoals()
      setGoals(res?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === "active"), [goals])
  const completedGoals = useMemo(() => goals.filter((goal) => goal.status === "completed"), [goals])

  const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Flag className="h-3 w-3" />
      case "medium":
        return <Target className="h-3 w-3" />
      case "low":
        return <TrendingUp className="h-3 w-3" />
      default:
        return <Target className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const GoalCard = ({ goal }: { goal: any }) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100
    const remaining = goal.targetAmount - goal.currentAmount
    const daysRemaining = goal.targetDate ? getDaysRemaining(goal.targetDate) : null

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              {goal.description && <CardDescription className="text-sm">{goal.description}</CardDescription>}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`${getPriorityColor(goal.priority)} text-xs`}>
                <span className="flex items-center space-x-1">
                  {getPriorityIcon(goal.priority)}
                  <span className="capitalize">{goal.priority}</span>
                </span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Current</p>
              <p className="font-semibold text-lg">
                {state.settings.currency} {goal.currentAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Target</p>
              <p className="font-semibold text-lg">
                {state.settings.currency} {goal.targetAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {state.settings.currency} {remaining.toLocaleString()}
              </span>
            </div>
            {goal.targetDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Target Date</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(goal.targetDate)}</span>
                </div>
              </div>
            )}
            {daysRemaining !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days Remaining</span>
                <span className={daysRemaining < 30 ? "text-red-600 font-medium" : ""}>
                  {daysRemaining > 0 ? `${daysRemaining} days` : "Overdue"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedGoal(goal.id)
                setShowAddContribution(true)
              }}
            >
              <Plus className="mr-2 h-3 w-3" />
              Add Money
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!confirm('Delete this goal?')) return
                await deleteGoal(goal.id)
                fetchGoals()
              }}
            >
              Delete
            </Button>
            <Badge variant="outline" className="text-xs">
              {goal.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Track your savings goals and financial targets</p>
        </div>
        <Button onClick={() => setShowCreateGoal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">{completedGoals.length} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.settings.currency} {totalTargetAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all active goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.settings.currency} {totalCurrentAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{overallProgress.toFixed(1)}% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.settings.currency} {(totalTargetAmount - totalCurrentAmount).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">To reach all goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading goals...</CardContent>
        </Card>
      )}
      {activeGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first savings goal to start tracking your financial targets.
            </p>
            <Button onClick={() => setShowCreateGoal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Completed Goals</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{goal.name}</CardTitle>
                    <Badge variant="default" className="bg-green-600">
                      <Trophy className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {state.settings.currency} {goal.targetAmount.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">{goal.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <CreateGoalModal open={showCreateGoal} onOpenChange={setShowCreateGoal} onSuccess={fetchGoals} />
      <AddGoalContributionModal
        open={showAddContribution}
        onOpenChange={setShowAddContribution}
        goalId={selectedGoal}
        goal={selectedGoal ? goals.find((g) => g.id === selectedGoal) ?? null : null}
        onSuccess={fetchGoals}
      />
    </div>
  )
}
