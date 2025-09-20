"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { addLedgerTransaction } from "@/services/api"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Receipt, Users, DollarSign, Calculator } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Member {
  id: string
  name: string
  email: string
  avatar?: string | null
}

interface Ledger {
  id: string
  name: string
  description?: string | null
  membersDetailed?: Member[]
  role?: string
  userId: string
}

interface SplitData {
  memberId: string
  amount: number
  percentage: number
}

interface AddLedgerTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ledger: Ledger | null
  onTransactionAdded: () => void
}

export function AddLedgerTransactionModal({ 
  open, 
  onOpenChange, 
  ledger, 
  onTransactionAdded 
}: AddLedgerTransactionModalProps) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    type: "expense" as "expense" | "income",
    date: new Date(),
    paidBy: "", // Member who paid
  })
  const [splitMethod, setSplitMethod] = useState<"equal" | "percentage" | "custom">("equal")
  const [splits, setSplits] = useState<SplitData[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const categories = [
    "Food & Dining",
    "Groceries", 
    "Transportation",
    "Entertainment",
    "Utilities",
    "Rent",
    "Shopping",
    "Travel",
    "Healthcare",
    "Other"
  ]

  // Initialize splits when ledger or members change
  useEffect(() => {
    if (ledger && ledger.membersDetailed && ledger.membersDetailed.length > 0) {
      const initialSplits = ledger.membersDetailed.map(member => ({
        memberId: member.id,
        amount: 0,
        percentage: Math.round(100 / ledger.membersDetailed!.length)
      }))
      setSplits(initialSplits)
      
      // Select all members by default
      setSelectedMembers(new Set(ledger.membersDetailed.map(m => m.id)))
      
      // Set the current user as the default payer
      setFormData(prev => ({ ...prev, paidBy: ledger.userId }))
    }
  }, [ledger])

  // Recalculate splits when amount, method, or selected members change
  useEffect(() => {
    if (formData.amount && selectedMembers.size > 0) {
      calculateSplits()
    }
  }, [formData.amount, splitMethod, selectedMembers])

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        amount: "",
        description: "",
        category: "",
        type: "expense",
        date: new Date(),
        paidBy: "",
      })
      setSplitMethod("equal")
      setSelectedMembers(new Set())
    }
  }, [open])

  const calculateSplits = () => {
    const amount = parseFloat(formData.amount) || 0
    const selectedMemberIds = Array.from(selectedMembers)
    
    setSplits(prevSplits => {
      return prevSplits.map(split => {
        if (!selectedMemberIds.includes(split.memberId)) {
          return { ...split, amount: 0, percentage: 0 }
        }

        switch (splitMethod) {
          case "equal":
            const equalAmount = amount / selectedMemberIds.length
            return { 
              ...split, 
              amount: equalAmount,
              percentage: Math.round(100 / selectedMemberIds.length)
            }
          
          case "percentage":
            // Keep existing percentages, but recalculate amounts
            return {
              ...split,
              amount: (amount * split.percentage) / 100
            }
          
          case "custom":
            // Keep existing amounts
            return split
          
          default:
            return split
        }
      })
    })
  }

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers)
    if (checked) {
      newSelected.add(memberId)
    } else {
      newSelected.delete(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const handlePercentageChange = (memberId: string, percentage: number) => {
    setSplits(prev => prev.map(split => 
      split.memberId === memberId 
        ? { ...split, percentage, amount: (parseFloat(formData.amount) * percentage) / 100 }
        : split
    ))
  }

  const handleCustomAmountChange = (memberId: string, amount: number) => {
    setSplits(prev => prev.map(split => 
      split.memberId === memberId 
        ? { ...split, amount, percentage: (amount / parseFloat(formData.amount)) * 100 }
        : split
    ))
  }

  const getTotalSplitAmount = () => {
    return splits
      .filter(split => selectedMembers.has(split.memberId))
      .reduce((sum, split) => sum + split.amount, 0)
  }

  const getTotalPercentage = () => {
    return splits
      .filter(split => selectedMembers.has(split.memberId))
      .reduce((sum, split) => sum + split.percentage, 0)
  }

  const isValidSplit = () => {
    const totalAmount = getTotalSplitAmount()
    const originalAmount = parseFloat(formData.amount) || 0
    const difference = Math.abs(totalAmount - originalAmount)
    return difference < 0.01 // Allow for small rounding differences
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ledger || !formData.amount || !formData.description || !formData.paidBy) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (selectedMembers.size === 0) {
      toast({
        title: "No Members Selected",
        description: "Please select at least one member to split the expense with.",
        variant: "destructive",
      })
      return
    }

    if (!isValidSplit()) {
      toast({
        title: "Invalid Split",
        description: "The split amounts don't add up to the total amount.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const activeSplits = splits.filter(split => selectedMembers.has(split.memberId))
      
      await addLedgerTransaction(ledger.id, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        type: formData.type,
        date: formData.date,
        paidBy: formData.paidBy,
        splits: activeSplits.map(split => ({
          userId: split.memberId,
          amount: split.amount
        }))
      })

      onTransactionAdded()

      toast({
        title: "Transaction added",
        description: "The shared expense has been added to the ledger.",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!ledger || !ledger.membersDetailed) return null

  const members = ledger.membersDetailed

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Add Shared Expense
          </DialogTitle>
          <DialogDescription>
            Add a new shared expense to {ledger.name} and split it among members.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] overflow-y-auto pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: "expense" | "income") => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Who Paid */}
            <div className="space-y-2">
              <Label>Paid by *</Label>
              <Select value={formData.paidBy} onValueChange={(value) => setFormData({ ...formData, paidBy: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split Method */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label>Split Method</Label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={splitMethod === "equal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSplitMethod("equal")}
                >
                  Equal Split
                </Button>
                <Button
                  type="button"
                  variant={splitMethod === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSplitMethod("percentage")}
                >
                  Percentage
                </Button>
                <Button
                  type="button"
                  variant={splitMethod === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSplitMethod("custom")}
                >
                  Custom Amounts
                </Button>
              </div>

              {/* Members and Splits */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Split among members</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calculator className="h-4 w-4" />
                      <span>
                        Total: ${getTotalSplitAmount().toFixed(2)}
                        {splitMethod === "percentage" && ` (${getTotalPercentage().toFixed(1)}%)`}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {members.map((member) => {
                    const split = splits.find(s => s.memberId === member.id)
                    const isSelected = selectedMembers.has(member.id)
                    
                    return (
                      <div key={member.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked: boolean) => handleMemberToggle(member.id, checked)}
                        />
                        
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {member.id === ledger.userId && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                        </div>

                        {isSelected && split && (
                          <div className="flex items-center gap-2">
                            {splitMethod === "percentage" && (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={split.percentage}
                                  onChange={(e) => handlePercentageChange(member.id, parseFloat(e.target.value) || 0)}
                                  className="w-16 h-8 text-xs"
                                />
                                <span className="text-xs">%</span>
                              </div>
                            )}
                            
                            {splitMethod === "custom" && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={split.amount}
                                  onChange={(e) => handleCustomAmountChange(member.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 h-8 text-xs"
                                />
                              </div>
                            )}
                            
                            <span className="text-sm font-medium min-w-[60px] text-right">
                              ${split.amount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {!isValidSplit() && (
                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                      ⚠️ Split amounts don't add up to the total amount (${formData.amount})
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !isValidSplit()}>
            {isLoading ? "Adding..." : "Add Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}