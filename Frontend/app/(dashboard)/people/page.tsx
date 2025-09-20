"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Users, UserPlus, Edit, Trash2, Bell, Mail, ChevronLeft, ChevronRight, Loader2, Receipt } from "lucide-react"
import { AddPersonModal } from "@/components/add-person-modal"
import { EditPersonModal } from "@/components/edit-person-modal"
import { deletePerson as apiDeletePerson, getAllPeople } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

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
  source?: "global" | "custom" // New field to distinguish source
}

export default function PeoplePage() {
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showEditPerson, setShowEditPerson] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [selectedPersonForTransactions, setSelectedPersonForTransactions] = useState<Person | null>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [personTransactions, setPersonTransactions] = useState<any>({
    bills: [],
    ledgerTransactions: [],
    directPayments: []
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "app" | "custom">("all")
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const { toast } = useToast()

  const loadPeople = async (page = 1, search = searchTerm, filter = filterType) => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: 12,
        search: search || undefined,
      }
      
      if (filter !== "all") {
        params.filter = JSON.stringify({ 
          isAppUser: filter === "app" 
        })
      }

      const result = await getAllPeople(params)
      
      // Handle different response formats
      let peopleData = []
      let paginationData = {
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      }
      
      if (Array.isArray(result)) {
        // Direct array response
        peopleData = result
        paginationData = {
          total: result.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      } else if (result.data) {
        // Response with data property
        peopleData = result.data
        paginationData = result.pagination || {
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        }
      }
      
      // Normalize data - ensure all people have consistent id field
      const normalizedPeople = peopleData.map((person: any) => ({
        ...person,
        id: person.id || person._id, // Use id if available, fallback to _id
      }))
      
      setPeople([...normalizedPeople]) // Force new array reference
      setPagination(paginationData)
    } catch (e) {
      console.error('Error loading people:', e)
      toast({
        title: "Error",
        description: "Failed to load people. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPeople(1, searchTerm, filterType)
    setCurrentPage(1)
  }, [searchTerm, filterType])

  useEffect(() => {
    loadPeople(currentPage, searchTerm, filterType)
  }, [currentPage])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDeletePerson = async (personId: string) => {
    try {
      await apiDeletePerson(personId)
      // Refresh current page
      await loadPeople(currentPage, searchTerm, filterType)
      toast({
        title: "Person deleted",
        description: "The person has been removed successfully.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to delete person. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person)
    setShowEditPerson(true)
  }

  const handlePersonAdded = async () => {
    // Add small delay to ensure backend has processed the new person
    await new Promise(resolve => setTimeout(resolve, 100))
    // Refresh the current page to show the new person
    await loadPeople(currentPage, searchTerm, filterType)
  }

  const handlePersonUpdated = () => {
    // Refresh the current page to show the updated person
    loadPeople(currentPage, searchTerm, filterType)
  }

  const handleViewTransactions = async (person: Person) => {
    setSelectedPersonForTransactions(person)
    setShowTransactionModal(true)
    setLoadingTransactions(true)
    
    try {
      // Call the actual API endpoint
      const { getPersonTransactions } = await import('@/services/api')
      const transactions = await getPersonTransactions(person.id)
      
      setPersonTransactions({
        bills: transactions.bills || [],
        ledgerTransactions: transactions.ledgerTransactions || [],
        directPayments: transactions.directPayments || []
      })
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast({
        title: "Error",
        description: "Failed to load transaction history. Please try again.",
        variant: "destructive",
      })
      setPersonTransactions({
        bills: [],
        ledgerTransactions: [],
        directPayments: []
      })
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleRemindPerson = (person: Person) => {
    // Mock reminder functionality
    console.log(`Sending reminder to ${person.name}`)
    toast({
      title: "Reminder sent",
      description: `Reminder sent to ${person.name}`,
    })
  }

  const PersonCard = ({ person }: { person: Person }) => (
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
                {person.source === "global" ? (
                  <Badge variant="default" className="text-xs">
                    Raqam User
                  </Badge>
                ) : (
                  <Badge variant={person.isAppUser ? "default" : "secondary"} className="text-xs">
                    {person.isAppUser ? "App User" : "Custom"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{person.email}</p>
              {person.phone && <p className="text-sm text-muted-foreground">{person.phone}</p>}
              {person.notes && <p className="text-sm text-muted-foreground italic">{person.notes}</p>}
              <p className="text-xs text-muted-foreground">
                {person.source === "global" ? "Registered User" : `Added ${formatDate(person.createdAt)}`}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {person.source !== "global" && (
                <DropdownMenuItem onClick={() => handleEditPerson(person)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleViewTransactions(person)}>
                <Receipt className="mr-2 h-4 w-4" />
                View Transactions
              </DropdownMenuItem>
              {!person.isAppUser && person.source !== "global" && (
                <DropdownMenuItem onClick={() => handleRemindPerson(person)}>
                  <Bell className="mr-2 h-4 w-4" />
                  Send Reminder
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>
              {person.source !== "global" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Person</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {person.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeletePerson(person.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={(value: "all" | "app" | "custom") => setFilterType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All People</SelectItem>
            <SelectItem value="app">Raqam Users</SelectItem>
            <SelectItem value="custom">Custom Contacts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">In your network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raqam Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{people.filter(p => p.source === "global").length}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{people.filter(p => p.source === "custom").length}</div>
            <p className="text-xs text-muted-foreground">Your personal contacts</p>
          </CardContent>
        </Card>
      </div>

      {/* People Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : people.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No People Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || filterType !== "all" 
                ? "No people match your current search or filter." 
                : "You haven't added any people yet."}
            </p>
            <Button onClick={() => setShowAddPerson(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, pagination.total)} of {pagination.total} people
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AddPersonModal 
        open={showAddPerson} 
        onOpenChange={setShowAddPerson}
        onPersonAdded={handlePersonAdded}
      />
      <EditPersonModal
        open={showEditPerson}
        onOpenChange={setShowEditPerson}
        person={selectedPerson}
        onPersonUpdated={handlePersonUpdated}
      />

      {/* Transaction History Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction History for {selectedPersonForTransactions?.name}
            </DialogTitle>
            <DialogDescription>
              All transactions involving {selectedPersonForTransactions?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading transaction history...</span>
              </div>
            ) : (
              <>
                {/* Bills Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Split Bills ({personTransactions.bills.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {personTransactions.bills.length > 0 ? (
                      <div className="space-y-2">
                        {personTransactions.bills.map((bill: any) => (
                          <div key={bill.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{bill.description}</h4>
                                <p className="text-sm text-muted-foreground">{bill.date}</p>
                              </div>
                              <span className="font-medium">{bill.amount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No bills found for this person</p>
                        <p className="text-sm">Bills where {selectedPersonForTransactions?.name} is a participant will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ledger Transactions Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Ledger Transactions ({personTransactions.ledgerTransactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {personTransactions.ledgerTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {personTransactions.ledgerTransactions.map((transaction: any) => (
                          <div key={transaction.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{transaction.description}</h4>
                                <p className="text-sm text-muted-foreground">{transaction.date}</p>
                              </div>
                              <span className="font-medium">{transaction.amount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No ledger transactions found for this person</p>
                        <p className="text-sm">Ledger transactions with {selectedPersonForTransactions?.name} will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Direct Payments Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Direct Payments ({personTransactions.directPayments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {personTransactions.directPayments.length > 0 ? (
                      <div className="space-y-2">
                        {personTransactions.directPayments.map((payment: any) => (
                          <div key={payment.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{payment.description}</h4>
                                <p className="text-sm text-muted-foreground">{payment.date}</p>
                              </div>
                              <span className="font-medium">{payment.amount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No direct payments found</p>
                        <p className="text-sm">Person-to-person payments with {selectedPersonForTransactions?.name} will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowTransactionModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}