"use client"

import type React from "react"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import { createLedger } from "@/services/api"

interface CreateLedgerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const mockUsers = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "3", name: "Carol Davis", email: "carol@example.com", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "4", name: "David Wilson", email: "david@example.com", avatar: "/placeholder.svg?height=32&width=32" },
]

export function CreateLedgerModal({ open, onOpenChange }: CreateLedgerModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"personal" | "shared">("personal")
  const [members, setMembers] = useState<
    Array<{ id: string; name: string; email: string; avatar: string; role: "editor" | "viewer" }>
  >([])
  const [emailInput, setEmailInput] = useState("")
  const [searchResults, setSearchResults] = useState<typeof mockUsers>([])
  const { toast } = useToast()

  const handleEmailSearch = (email: string) => {
    setEmailInput(email)
    if (email.length > 2) {
      const results = mockUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(email.toLowerCase()) ||
          user.name.toLowerCase().includes(email.toLowerCase()),
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const addMember = (user: (typeof mockUsers)[0]) => {
    if (!members.find((m) => m.id === user.id)) {
      setMembers([...members, { ...user, role: "editor" }])
      setEmailInput("")
      setSearchResults([])
    }
  }

  const removeMember = (userId: string) => {
    setMembers(members.filter((m) => m.id !== userId))
  }

  const updateMemberRole = (userId: string, role: "editor" | "viewer") => {
    setMembers(members.map((m) => (m.id === userId ? { ...m, role } : m)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await createLedger({ name, description })

    toast({
      title: "Ledger created",
      description: `${name} has been created successfully.`,
    })

    // Reset form
    setName("")
    setDescription("")
    setType("personal")
    setMembers([])
    setEmailInput("")
    setSearchResults([])

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ledger</DialogTitle>
          <DialogDescription>Create a new ledger to track your expenses</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this ledger for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Ledger Type</Label>
            <Select value={type} onValueChange={(value: "personal" | "shared") => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select ledger type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal - Only you can access</SelectItem>
                <SelectItem value="shared">Shared - Multiple people can access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "shared" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Members</Label>
                <div className="relative">
                  <Input
                    placeholder="Search by email or name"
                    value={emailInput}
                    onChange={(e) => handleEmailSearch(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted cursor-pointer"
                          onClick={() => addMember(user)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{user.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {members.length > 0 && (
                <div className="space-y-2">
                  <Label>Members ({members.length})</Label>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{member.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={member.role}
                            onValueChange={(role: "editor" | "viewer") => updateMemberRole(member.id, role)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeMember(member.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Ledger</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
