"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { updatePerson } from "@/services/api"
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
import { useToast } from "@/hooks/use-toast"

interface Person {
  id: string
  name: string
  email: string
  avatar?: string | null
  isAppUser: boolean
  phone?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

interface EditPersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person | null
  onPersonUpdated: (updatedPerson: Person) => void
}

export function EditPersonModal({ open, onOpenChange, person, onPersonUpdated }: EditPersonModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [userType, setUserType] = useState<"app" | "custom">("app")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Populate form when person changes
  useEffect(() => {
    if (person) {
      setName(person.name || "")
      setEmail(person.email || "")
      setPhone(person.phone || "")
      setNotes(person.notes || "")
      setUserType(person.isAppUser ? "app" : "custom")
    }
  }, [person])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setName("")
      setEmail("")
      setPhone("")
      setNotes("")
      setUserType("app")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!person) return

    if (!name.trim() || !email.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const updatedPerson = await updatePerson(person.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        isAppUser: userType === "app",
        avatar: person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      })

      onPersonUpdated(updatedPerson)

      toast({
        title: "Person updated",
        description: `${name} has been updated successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating person:", error)
      toast({
        title: "Error",
        description: "Failed to update person. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!person) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Person</DialogTitle>
          <DialogDescription>Update the details for {person.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userType">User Type</Label>
            <Select value={userType} onValueChange={(value: "app" | "custom") => setUserType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="app">App User - Has Raqam account</SelectItem>
                <SelectItem value="custom">Custom Contact - No account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this person"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}