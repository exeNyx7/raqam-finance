"use client"

import type React from "react"

import { useEffect, useState } from "react"
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

interface CreateRecurringModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

import { createRecurring, getRecurringMeta, getLedgers } from "@/services/api"

export function CreateRecurringModal({ open, onOpenChange }: CreateRecurringModalProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [frequency, setFrequency] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [ledger, setLedger] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [frequencies, setFrequencies] = useState<{ value: string; label: string }[]>([])
  const [ledgers, setLedgers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    let isCancelled = false
    async function loadMeta() {
      setLoading(true)
      try {
        const [meta, ledgerRes] = await Promise.all([
          getRecurringMeta(),
          getLedgers({ page: 1, limit: 100 }),
        ])
        if (isCancelled) return
        setCategories(meta.categories || [])
        setFrequencies(meta.frequencies || [])
        setLedgers((ledgerRes?.data || []).map((l: any) => ({ id: l.id, name: l.name })))
      } catch (_) {
        // silently ignore for now
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    loadMeta()
    return () => { isCancelled = true }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await createRecurring({
      description,
      amount: parseFloat(amount),
      category,
      frequency,
      startDate,
      ledgerId: ledger || undefined,
    })

    toast({
      title: "Recurring transaction created",
      description: `${description} has been set up successfully.`,
    })

    setDescription("")
    setAmount("")
    setCategory("")
    setFrequency("")
    setStartDate(new Date().toISOString().split("T")[0])
    setLedger("")

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Recurring Transaction</DialogTitle>
          <DialogDescription>Set up a new recurring payment or subscription</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Netflix Subscription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading..." : "Select frequency"} />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="ledger">Ledger</Label>
              <Select value={ledger} onValueChange={setLedger}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading..." : "Select ledger"} />
                </SelectTrigger>
                <SelectContent>
                  {ledgers.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Recurring Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
