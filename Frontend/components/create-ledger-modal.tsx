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
import { createLedger, getPeople, searchUsers } from "@/services/api"
import { useAuth } from "@/contexts/auth-context"

interface CreateLedgerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLedgerCreated?: () => void
}

type SearchResult = { id: string; name: string; email: string; avatar?: string | null; isAppUser: boolean }

export function CreateLedgerModal({ open, onOpenChange, onLedgerCreated }: CreateLedgerModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"personal" | "shared">("personal")
  const [members, setMembers] = useState<
    Array<{ id: string; name: string; email: string; avatar?: string | null }>
  >([])
  const [emailInput, setEmailInput] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const { toast } = useToast()

  const handleEmailSearch = async (email: string) => {
    setEmailInput(email)
    if (email.length > 2) {
      try {
        const [contactsRes, usersRes] = await Promise.all([
          getPeople({ search: email, limit: 5 }),
          searchUsers(email),
        ])
        const contacts = (contactsRes?.data || contactsRes || []).map((p: any) => ({ name: p.name, email: p.email, avatar: p.avatar }))
        let appUsers: Array<{ id: string; name: string; email: string; avatar?: string | null }> = Array.isArray(usersRes) ? usersRes : []
        // filter out current user from app user results
        if (user?.id) {
          appUsers = appUsers.filter((u) => u.id !== user.id && u.email !== user.email)
        }
        const appByEmail = new Map(appUsers.map((u) => [u.email, u]))
        const results: SearchResult[] = []
        // include all app users
        for (const u of appUsers) {
          results.push({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, isAppUser: true })
        }
        // include contacts that are not already app users (for visibility), but mark as not addable
        for (const c of contacts) {
          if (appByEmail.has(c.email)) continue
          results.push({ id: c.email, name: c.name, email: c.email, avatar: c.avatar, isAppUser: false })
        }
        setSearchResults(results)
      } catch (e) {
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  const addMember = (user: SearchResult) => {
    if (!user.isAppUser) {
      toast({ title: "Cannot add contact", description: "This person hasn't joined the app yet.", variant: "destructive" })
      return
    }
    if (!members.find((m) => m.id === user.id)) {
      setMembers([...members, { id: user.id, name: user.name, email: user.email, avatar: user.avatar }])
      setEmailInput("")
      setSearchResults([])
    }
  }

  const removeMember = (userId: string) => {
    setMembers(members.filter((m) => m.id !== userId))
  }

  // Roles removed: all members have equal permissions

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: any = { name, description }
    if (type === "shared" && members.length) {
      payload.members = members.map((m) => ({ userId: m.id }))
    }
    await createLedger(payload)

    toast({
      title: "Ledger created",
      description: `${name} has been created successfully.`,
    })

    // Call the callback to refresh ledgers
    onLedgerCreated?.()

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
                <Label>Add Members (search your contacts or app users by email)</Label>
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
                          className={`flex items-center space-x-2 p-2 ${user.isAppUser ? "hover:bg-muted cursor-pointer" : "opacity-60"}`}
                          onClick={() => user.isAppUser && addMember(user)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{user.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                          {!user.isAppUser && <div className="text-xs text-muted-foreground">Invite to join</div>}
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
