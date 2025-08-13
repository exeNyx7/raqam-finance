"use client"

import type React from "react"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { addGoalContribution, withdrawFromGoal } from "@/services/api"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface AddGoalContributionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalId: string | null
  goal?: {
    id: string
    name: string
    currentAmount: number
    targetAmount: number
  } | null
  onSuccess?: () => void
}

export function AddGoalContributionModal({ open, onOpenChange, goalId, goal, onSuccess }: AddGoalContributionModalProps) {
  const { state } = useApp()
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [mode, setMode] = useState<'contribute' | 'withdraw'>("contribute")
  const { toast } = useToast()

  const selectedGoal = goalId ? goal : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedGoal || !goalId) return

    const contributionAmount = Number.parseFloat(amount)
    if (mode === 'contribute') {
      await addGoalContribution(goalId, { amount: contributionAmount, note })
      toast({
        title: "Contribution added",
        description: `${state.settings.currency} ${contributionAmount.toFixed(2)} added to ${selectedGoal.name}.`,
      })
    } else {
      await withdrawFromGoal(goalId, { amount: contributionAmount, note })
      toast({
        title: "Withdrawal completed",
        description: `${state.settings.currency} ${contributionAmount.toFixed(2)} withdrawn from ${selectedGoal.name}.`,
      })
    }

    // Reset form
    setAmount("")
    setNote("")
    setMode('contribute')

    onOpenChange(false)
    onSuccess?.()
  }

  if (!selectedGoal) return null

  const remainingAmount = selectedGoal.targetAmount - selectedGoal.currentAmount
  const progress = (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'contribute' ? 'Add Money to Goal' : 'Withdraw from Goal'}</DialogTitle>
          <DialogDescription>{mode === 'contribute' ? 'Contribute to' : 'Withdraw from'} "{selectedGoal.name}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Current Progress</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {state.settings.currency} {selectedGoal.currentAmount.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                {state.settings.currency} {selectedGoal.targetAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: {state.settings.currency} {remainingAmount.toLocaleString()}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={mode === 'contribute' ? 'default' : 'outline'} className="flex-1" onClick={() => setMode('contribute')}>Add</Button>
              <Button type="button" variant={mode === 'withdraw' ? 'default' : 'outline'} className="flex-1" onClick={() => setMode('withdraw')}>Withdraw</Button>
            </div>
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
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this contribution"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === 'contribute' ? 'Add Contribution' : 'Withdraw'}</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
