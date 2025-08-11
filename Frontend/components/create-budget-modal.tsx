"use client"

import type React from "react"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface CreateBudgetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

import { createBudget } from "@/services/api"

export function CreateBudgetModal({ open, onOpenChange, onCreated }: CreateBudgetModalProps) {
  const { state } = useApp()
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly")
  const [category, setCategory] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const { toast } = useToast()

  const calculateEndDate = (start: string, period: "weekly" | "monthly") => {
    const startDate = new Date(start)
    if (period === "weekly") {
      startDate.setDate(startDate.getDate() + 7)
    } else {
      startDate.setMonth(startDate.getMonth() + 1)
    }
    return startDate.toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const endDate = calculateEndDate(startDate, period)

    await createBudget({
      name,
      amount: Number.parseFloat(amount),
      period,
      category,
      startDate,
      endDate,
    })

    toast({
      title: "Budget created",
      description: `${name} budget has been created successfully.`,
    })

    // Reset form
    setName("")
    setAmount("")
    setPeriod("monthly")
    setCategory("")
    setStartDate(new Date().toISOString().split("T")[0])

    onOpenChange(false)
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>Set up a new budget to track your spending</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              placeholder="e.g., Monthly Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({state.settings.currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={period} onValueChange={(value: "weekly" | "monthly") => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {state.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">End Date: {calculateEndDate(startDate, period)}</div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Budget</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
