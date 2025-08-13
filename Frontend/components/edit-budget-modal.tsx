"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

import { updateBudget, deleteBudget } from "@/services/api"

interface EditBudgetModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    budget: {
        id: string
        name: string
        amount: number
        period: "weekly" | "monthly" | "yearly"
        category?: string
        startDate: string
        endDate: string
    }
    onUpdated?: () => void
    onDeleted?: () => void
}

export function EditBudgetModal({ open, onOpenChange, budget, onUpdated, onDeleted }: EditBudgetModalProps) {
    const { state } = useApp()
    const [name, setName] = useState("")
    const [amount, setAmount] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (!budget) return
        setName(budget.name || "")
        setAmount(String(budget.amount ?? ""))
    }, [budget])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!budget?.id) return

        try {
            await updateBudget(budget.id, {
                name,
                amount: Number.parseFloat(amount),
            } as any)

            toast({
                title: "Budget updated",
                description: `${name} has been updated successfully.`,
            })

            onOpenChange(false)
            onUpdated?.()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update budget. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async () => {
        if (!budget?.id) return

        setIsDeleting(true)
        try {
            await deleteBudget(budget.id)

            toast({
                title: "Budget deleted",
                description: `${budget.name} has been deleted successfully.`,
            })

            onOpenChange(false)
            onDeleted?.()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete budget. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Budget</DialogTitle>
                    <DialogDescription>Update your budget name and amount</DialogDescription>
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

                    {/* Display read-only information */}
                    <div className="space-y-2 p-3 bg-muted rounded-lg">
                        <div className="text-sm">
                            <span className="font-medium">Period:</span> {budget?.period}
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Category:</span> {budget?.category || "None"}
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Duration:</span> {budget?.startDate} - {budget?.endDate}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="mr-auto"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? "Deleting..." : "Delete Budget"}
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


