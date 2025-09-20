"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, User, MoreHorizontal, Settings, UserPlus, Receipt } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateLedgerModal } from "@/components/create-ledger-modal"
import { EditLedgerModal } from "@/components/edit-ledger-modal"
import { LedgerMemberManagementModal } from "@/components/ledger-member-management-modal"
import { AddLedgerTransactionModal } from "@/components/add-ledger-transaction-modal"
import { getLedgers, deleteLedger, leaveLedger } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type LedgerListItem = {
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

export default function LedgersPage() {
  const [showCreateLedger, setShowCreateLedger] = useState(false)
  const [showEditLedger, setShowEditLedger] = useState(false)
  const [showMemberManagement, setShowMemberManagement] = useState(false)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [selectedLedger, setSelectedLedger] = useState<LedgerListItem | null>(null)
  const [ledgers, setLedgers] = useState<LedgerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLedger, setActionLedger] = useState<LedgerListItem | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLedgers()
  }, [])

  const loadLedgers = async () => {
    try {
      setLoading(true)
      const list = await getLedgers()
      setLedgers(list)
    } catch (e) {
      console.error(e)
      toast({
        title: "Error",
        description: "Failed to load ledgers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const personalLedgers = useMemo(() => ledgers.filter((l) => (l.membersDetailed?.length || 0) <= 1), [ledgers])
  const sharedLedgers = useMemo(() => ledgers.filter((l) => (l.membersDetailed?.length || 0) > 1), [ledgers])

  const handleEditLedger = (ledger: LedgerListItem) => {
    setSelectedLedger(ledger)
    setShowEditLedger(true)
  }

  const handleManageMembers = (ledger: LedgerListItem) => {
    setSelectedLedger(ledger)
    setShowMemberManagement(true)
  }

  const handleAddTransaction = (ledger: LedgerListItem) => {
    setSelectedLedger(ledger)
    setShowAddTransaction(true)
  }

  const handleDeleteLedger = async () => {
    if (!actionLedger) return

    try {
      setIsDeleting(true)
      await deleteLedger(actionLedger.id)
      
      toast({
        title: "Ledger deleted",
        description: "The ledger has been permanently deleted.",
      })
      
      await loadLedgers()
      setShowDeleteDialog(false)
      setActionLedger(null)
    } catch (error) {
      console.error("Error deleting ledger:", error)
      toast({
        title: "Error",
        description: "Failed to delete ledger. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLeaveLedger = async () => {
    if (!actionLedger) return

    try {
      setIsLeaving(true)
      await leaveLedger(actionLedger.id)
      
      toast({
        title: "Left ledger",
        description: "You have left the ledger successfully.",
      })
      
      await loadLedgers()
      setShowLeaveDialog(false)
      setActionLedger(null)
    } catch (error) {
      console.error("Error leaving ledger:", error)
      toast({
        title: "Error",
        description: "Failed to leave ledger. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLeaving(false)
    }
  }

  const LedgerCard = ({ ledger, isShared = false }: { ledger: LedgerListItem; isShared?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {isShared ? (
            <Users className="h-4 w-4 text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-base">{ledger.name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/ledgers/${ledger.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditLedger(ledger)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Ledger
            </DropdownMenuItem>
            {isShared && (
              <DropdownMenuItem onClick={() => handleManageMembers(ledger)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Manage Members
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleAddTransaction(ledger)}>
              <Receipt className="mr-2 h-4 w-4" />
              Add Transaction
            </DropdownMenuItem>
            {isShared && ledger.role !== "owner" && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  setActionLedger(ledger)
                  setShowLeaveDialog(true)
                }}
              >
                Leave Ledger
              </DropdownMenuItem>
            )}
            {(!isShared || ledger.role === "owner") && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  setActionLedger(ledger)
                  setShowDeleteDialog(true)
                }}
              >
                Delete Ledger
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ledger.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{ledger.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span
              className={`font-semibold ${
                (ledger.balance || 0) > 0 
                  ? "text-green-600" 
                  : (ledger.balance || 0) < 0 
                    ? "text-red-600" 
                    : "text-muted-foreground"
              }`}
            >
              {(ledger.balance || 0) > 0 ? "+" : ""}${(ledger.balance || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Transactions</span>
            <span className="text-sm">{ledger.transactionCount || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Activity</span>
            <span className="text-sm">{ledger.lastActivity || "No activity"}</span>
          </div>
          {isShared && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Members</span>
                <div className="flex -space-x-2">
                  {(ledger.membersDetailed || []).slice(0, 3).map((member, i) => (
                    <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatar || ""} />
                      <AvatarFallback className="text-xs">{member.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                  ))}
                  {(ledger.membersDetailed || []).length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs">+{(ledger.membersDetailed || []).length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
              {ledger.role && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant={ledger.role === "owner" ? "default" : "secondary"} className="text-xs">
                    {ledger.role}
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>
        <Button asChild className="w-full mt-4" variant="outline">
          <Link href={`/ledgers/${ledger.id}`}>View Ledger</Link>
        </Button>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ledgers</h1>
            <p className="text-muted-foreground">Manage your personal and shared financial ledgers</p>
          </div>
        </div>
        <div className="text-center py-8">Loading ledgers...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledgers</h1>
          <p className="text-muted-foreground">Manage your personal and shared financial ledgers</p>
        </div>
        <Button onClick={() => setShowCreateLedger(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ledger
        </Button>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Ledgers ({personalLedgers.length})</TabsTrigger>
          <TabsTrigger value="shared">Shared Ledgers ({sharedLedgers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {personalLedgers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Personal Ledgers</h3>
              <p className="text-muted-foreground mb-4">Create your first personal ledger to start tracking your finances.</p>
              <Button onClick={() => setShowCreateLedger(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Personal Ledger
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personalLedgers.map((ledger) => (
                <LedgerCard key={ledger.id} ledger={ledger} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          {sharedLedgers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Shared Ledgers</h3>
              <p className="text-muted-foreground mb-4">Create a shared ledger to split expenses with friends, family, or roommates.</p>
              <Button onClick={() => setShowCreateLedger(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Shared Ledger
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sharedLedgers.map((ledger) => (
                <LedgerCard key={ledger.id} ledger={ledger} isShared />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateLedgerModal 
        open={showCreateLedger} 
        onOpenChange={setShowCreateLedger}
        onLedgerCreated={loadLedgers}
      />
      
      <EditLedgerModal
        open={showEditLedger}
        onOpenChange={setShowEditLedger}
        ledger={selectedLedger}
        onLedgerUpdated={loadLedgers}
      />

      <LedgerMemberManagementModal
        open={showMemberManagement}
        onOpenChange={setShowMemberManagement}
        ledger={selectedLedger}
        onMembersUpdated={loadLedgers}
      />

      <AddLedgerTransactionModal
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        ledger={selectedLedger}
        onTransactionAdded={loadLedgers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ledger</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{actionLedger?.name}"? This action cannot be undone and will permanently delete all transactions and data associated with this ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLedger}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Ledger</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{actionLedger?.name}"? You will no longer have access to this ledger and its transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveLedger}
              disabled={isLeaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeaving ? "Leaving..." : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
