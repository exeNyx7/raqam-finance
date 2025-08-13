"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { addLedgerTransaction, createTransaction, getLedger } from "@/services/api"

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  ledgerId?: string
}

export function AddTransactionModal({ open, onOpenChange, onCreated, ledgerId }: AddTransactionModalProps) {
  const { state } = useApp()
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [type, setType] = useState<"income" | "expense">("expense")
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Load ledger members when used inside a ledger
  useEffect(() => {
    let mounted = true
    if (!ledgerId) return
      ; (async () => {
        try {
          const ledger = await getLedger(ledgerId)
          if (!mounted) return
          const list = Array.isArray(ledger?.membersDetailed) ? ledger.membersDetailed : []
          setMembers(list.map((m: any) => ({ id: m.id, name: m.name })))
          // default: select all members except the payer
          const map: Record<string, boolean> = {}
          list.forEach((m: any) => {
            if (m.id) map[m.id] = true
          })
          setSelectedParticipants(map)
        } catch (_) { }
      })()
    return () => { mounted = false }
  }, [ledgerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (ledgerId && type === "expense") {
        const participants = Object.entries(selectedParticipants)
          .filter(([_, checked]) => checked)
          .map(([userId]) => ({ userId }))
        await addLedgerTransaction(ledgerId, {
          description: name,
          totalAmount: Math.abs(Number.parseFloat(amount)),
          category,
          date,
          participants,
        })
      } else {
        await createTransaction({
          description: name,
          amount: type === "expense" ? -Math.abs(Number.parseFloat(amount)) : Math.abs(Number.parseFloat(amount)),
          category,
          date,
          type,
          ledgerId,
        })
      }

      toast({
        title: "Transaction added",
        description: "Your transaction has been added successfully.",
      })

      // Reset form
      setName("")
      setAmount("")
      setCategory("")
      setDate(new Date().toISOString().split("T")[0])
      setType("expense")

      onOpenChange(false)
      onCreated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Add a new transaction to your ledger</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Description</Label>
            <Input
              id="name"
              placeholder="What was this for?"
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
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
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
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {ledgerId && (
            <div className="space-y-2">
              <Label>Split with</Label>
              <div className="max-h-40 overflow-auto space-y-2 border rounded p-2">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={!!selectedParticipants[m.id]}
                      onCheckedChange={(v) => setSelectedParticipants((s) => ({ ...s, [m.id]: Boolean(v) }))}
                    />
                    <span>{m.name}</span>
                  </label>
                ))}
                {members.length === 0 && <div className="text-sm text-muted-foreground">No members</div>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
