"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, User, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateLedgerModal } from "@/components/create-ledger-modal"
import { getLedgers } from "@/services/api"

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
  const [ledgers, setLedgers] = useState<LedgerListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const list = await getLedgers()
          if (mounted) setLedgers(list)
        } catch (e) {
          console.error(e)
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  const personalLedgers = useMemo(() => ledgers.filter((l) => (l.membersDetailed?.length || 0) <= 1), [ledgers])
  const sharedLedgers = useMemo(() => ledgers.filter((l) => (l.membersDetailed?.length || 0) > 1), [ledgers])

  const LedgerCard = ({ ledger, isShared = false }: { ledger: any; isShared?: boolean }) => (
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
            <DropdownMenuItem>Edit Ledger</DropdownMenuItem>
            {isShared && ledger.role !== "owner" && (
              <DropdownMenuItem className="text-destructive">Leave Ledger</DropdownMenuItem>
            )}
            {(!isShared || ledger.role === "owner") && (
              <DropdownMenuItem className="text-destructive">Delete Ledger</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span
              className={`font-semibold ${ledger.balance > 0 ? "text-green-600" : ledger.balance < 0 ? "text-red-600" : "text-muted-foreground"
                }`}
            >
              {ledger.balance > 0 ? "+" : ""}${ledger.balance.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Transactions</span>
            <span className="text-sm">{ledger.transactionCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Activity</span>
            <span className="text-sm">{ledger.lastActivity}</span>
          </div>
          {isShared && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Members</span>
                <div className="flex -space-x-2">
                  {(ledger.membersDetailed || []).slice(0, 3).map((member: any, i: number) => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
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
              {/* Role removed: equal permissions for all members */}
            </>
          )}
        </div>
        <Button asChild className="w-full mt-4 bg-transparent" variant="outline">
          <Link href={`/ledgers/${ledger.id}`}>View Ledger</Link>
        </Button>
      </CardContent>
    </Card>
  )

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalLedgers.map((ledger) => (
              <LedgerCard key={ledger.id} ledger={ledger} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sharedLedgers.map((ledger) => (
              <LedgerCard key={ledger.id} ledger={ledger} isShared />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CreateLedgerModal open={showCreateLedger} onOpenChange={setShowCreateLedger} />
    </div>
  )
}
