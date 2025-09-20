"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { updateLedger } from "@/services/api"
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

interface Ledger {
  id: string
  name: string
  description?: string | null
  membersDetailed?: Array<{ id: string; name: string; email: string; avatar?: string | null }>
  role?: string
  balance?: number
  transactionCount?: number
  lastActivity?: string | null
  userId: string
}

interface EditLedgerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ledger: Ledger | null
  onLedgerUpdated: (updatedLedger: Ledger) => void
}

export function EditLedgerModal({ open, onOpenChange, ledger, onLedgerUpdated }: EditLedgerModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Populate form when ledger changes
  useEffect(() => {
    if (ledger) {
      setName(ledger.name || "")
      setDescription(ledger.description || "")
    }
  }, [ledger])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setName("")
      setDescription("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ledger) return

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Ledger name is required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const updatedLedger = await updateLedger(ledger.id, {
        name: name.trim(),
        description: description.trim() || null,
      })

      onLedgerUpdated(updatedLedger)

      toast({
        title: "Ledger updated",
        description: `${name} has been updated successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating ledger:", error)
      toast({
        title: "Error",
        description: "Failed to update ledger. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!ledger) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Ledger</DialogTitle>
          <DialogDescription>Update the details for {ledger.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ledger Name</Label>
            <Input
              id="name"
              placeholder="Enter ledger name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter a description for this ledger"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Ledger"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}