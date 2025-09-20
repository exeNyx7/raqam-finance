"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getPeople, updateLedger } from "@/services/api"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Users, UserMinus, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Person {
  id: string
  name: string
  email: string
  avatar?: string | null
  isAppUser: boolean
}

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

interface LedgerMemberManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ledger: Ledger | null
  onMembersUpdated: () => void
}

export function LedgerMemberManagementModal({ 
  open, 
  onOpenChange, 
  ledger, 
  onMembersUpdated 
}: LedgerMemberManagementModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [people, setPeople] = useState<Person[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPeople, setLoadingPeople] = useState(false)
  const { toast } = useToast()

  // Load people when modal opens
  useEffect(() => {
    if (open) {
      loadPeople()
    }
  }, [open])

  // Initialize selected members when ledger changes
  useEffect(() => {
    if (ledger && ledger.membersDetailed) {
      const currentMemberIds = new Set(ledger.membersDetailed.map(m => m.id))
      setSelectedMemberIds(currentMemberIds)
    }
  }, [ledger])

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setSelectedMemberIds(new Set())
    }
  }, [open])

  const loadPeople = async () => {
    try {
      setLoadingPeople(true)
      const result = await getPeople({ limit: 100 }) // Get more people for selection
      setPeople(result.data || result || [])
    } catch (error) {
      console.error("Error loading people:", error)
      toast({
        title: "Error",
        description: "Failed to load people. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingPeople(false)
    }
  }

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMemberToggle = (personId: string, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedMemberIds)
    if (isSelected) {
      newSelectedIds.add(personId)
    } else {
      newSelectedIds.delete(personId)
    }
    setSelectedMemberIds(newSelectedIds)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ledger) return

    // Owner cannot be removed
    const ownerInSelection = selectedMemberIds.has(ledger.userId)
    if (!ownerInSelection) {
      toast({
        title: "Invalid Selection",
        description: "The ledger owner cannot be removed from the ledger.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Convert selected IDs to the format expected by the backend
      const members = Array.from(selectedMemberIds).map(userId => ({ userId }))

      await updateLedger(ledger.id, {
        members
      })

      onMembersUpdated()

      toast({
        title: "Members updated",
        description: "Ledger members have been updated successfully.",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating members:", error)
      toast({
        title: "Error",
        description: "Failed to update members. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!ledger) return null

  const currentMembers = ledger.membersDetailed || []
  const isOwner = ledger.role === "owner"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Ledger Members
          </DialogTitle>
          <DialogDescription>
            Add or remove members from {ledger.name}. Members can view and add transactions to this ledger.
          </DialogDescription>
        </DialogHeader>

        {!isOwner ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Owner Only</h3>
            <p className="text-muted-foreground">
              Only the ledger owner can manage members. You can only view the current members.
            </p>
          </div>
        ) : (
          <>
            {/* Current Members */}
            <div className="space-y-2">
              <Label>Current Members ({currentMembers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {currentMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar || ""} />
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                    {member.id === ledger.userId && (
                      <Badge variant="secondary" className="text-xs">Owner</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Add/Remove Members</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search people..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* People List */}
              <ScrollArea className="h-64 border rounded-lg p-4">
                {loadingPeople ? (
                  <div className="text-center py-4">Loading people...</div>
                ) : filteredPeople.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? "No people match your search." : "No people available."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPeople.map((person) => {
                      const isSelected = selectedMemberIds.has(person.id)
                      const isOwner = person.id === ledger.userId
                      
                      return (
                        <div key={person.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked: boolean) => handleMemberToggle(person.id, checked)}
                            disabled={isOwner} // Owner cannot be unchecked
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={person.avatar || ""} />
                            <AvatarFallback className="text-xs">
                              {person.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{person.name}</span>
                              {isOwner && <Badge variant="secondary" className="text-xs">Owner</Badge>}
                              {person.isAppUser && <Badge variant="outline" className="text-xs">App User</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{person.email}</p>
                          </div>
                          {isSelected && !isOwner && (
                            <UserMinus className="h-4 w-4 text-red-500" />
                          )}
                          {!isSelected && (
                            <UserPlus className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Members"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {/* Non-owner view */}
        {!isOwner && (
          <div className="space-y-2">
            <Label>Current Members ({currentMembers.length})</Label>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {currentMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2">
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
                          <Badge variant="secondary" className="text-xs">Owner</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}