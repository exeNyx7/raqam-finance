"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, MoreHorizontal, Users, UserPlus, Edit, Trash2, Bell, Mail } from "lucide-react"
import { AddPersonModal } from "@/components/add-person-modal"
import { createPerson, deletePerson as apiDeletePerson, getPeople } from "@/services/api"

type Person = {
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

export default function PeoplePage() {
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const list = await getPeople()
          if (mounted) setPeople(list)
        } catch (e) {
          console.error(e)
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  const appUsers = useMemo(() => people.filter((p) => p.isAppUser), [people])
  const customUsers = useMemo(() => people.filter((p) => !p.isAppUser), [people])

  const filteredAppUsers = appUsers.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredCustomUsers = customUsers.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDeletePerson = async (personId: string) => {
    await apiDeletePerson(personId)
    setPeople((prev) => prev.filter((p) => p.id !== personId))
  }

  const handleRemindPerson = (person: any) => {
    // Mock reminder functionality
    console.log(`Sending reminder to ${person.name}`)
  }

  const PersonCard = ({ person, showActions = true }: { person: any; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={person.avatar || "/placeholder.svg"} />
              <AvatarFallback>{(person.name?.charAt(0) || "?").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{person.name}</h3>
                <Badge variant={person.isAppUser ? "default" : "secondary"} className="text-xs">
                  {person.isAppUser ? "App User" : "Custom"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{person.email}</p>
              {person.phone && <p className="text-sm text-muted-foreground">{person.phone}</p>}
              {person.notes && <p className="text-sm text-muted-foreground italic">{person.notes}</p>}
              <p className="text-xs text-muted-foreground">Added {formatDate(person.createdAt)}</p>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem>View Transactions</DropdownMenuItem>
                {!person.isAppUser && (
                  <DropdownMenuItem onClick={() => handleRemindPerson(person)}>
                    <Bell className="mr-2 h-4 w-4" />
                    Send Reminder
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePerson(person.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground">Manage your contacts and relationships</p>
        </div>
        <Button onClick={() => setShowAddPerson(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{people.length}</div>
            <p className="text-xs text-muted-foreground">In your network</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appUsers.length}</div>
            <p className="text-xs text-muted-foreground">Using Raqam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customUsers.length}</div>
            <p className="text-xs text-muted-foreground">Not on app</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* People Lists */}
      <Tabs defaultValue="app-users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="app-users">App Users ({filteredAppUsers.length})</TabsTrigger>
          <TabsTrigger value="custom-users">Custom Contacts ({filteredCustomUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="app-users" className="space-y-4">
          {filteredAppUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No App Users Found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? "No app users match your search." : "You haven't added any app users yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAppUsers.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom-users" className="space-y-4">
          {filteredCustomUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Custom Contacts Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? "No custom contacts match your search." : "You haven't added any custom contacts yet."}
                </p>
                <Button onClick={() => setShowAddPerson(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCustomUsers.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddPersonModal open={showAddPerson} onOpenChange={setShowAddPerson} />
    </div>
  )
}
