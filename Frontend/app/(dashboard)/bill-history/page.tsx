"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { History, Search, Filter, MoreHorizontal, Eye, Download, Trash2, ChevronLeft, ChevronRight, X, Calendar, DollarSign, Users, Receipt } from "lucide-react"
import { getBills as apiGetBills, deleteBill as apiDeleteBill, getAllPeople } from "@/services/api"
import { billService } from "@/lib/api/services/bills"
import { useApp } from "@/contexts/app-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"

export default function BillHistoryPage() {
  const { state } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [showBillDetails, setShowBillDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [paymentStatus, setPaymentStatus] = useState<Record<string, boolean>>({})
  const [settlementDetails, setSettlementDetails] = useState<any>(null)
  const [optimalSettlements, setOptimalSettlements] = useState<any>(null)
  const [loadingSettlement, setLoadingSettlement] = useState(false)
  const [people, setPeople] = useState<any[]>([])
  
  // Advanced filters
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [dateRange, setDateRange] = useState({ from: "", to: "" })

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        const [billsResponse, peopleData] = await Promise.all([
          billService.getBills(),
          getAllPeople()
        ])
        const billsData = billsResponse.data
        if (isMounted) {
          setBills(Array.isArray(billsData) ? billsData : [])
          setPeople(Array.isArray(peopleData) ? peopleData : [])
        }
      } catch (_) {
        if (isMounted) {
          setBills([])
          setPeople([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredBills = useMemo(() => {
    let filtered = bills.filter((bill) => {
      const matchesSearch = bill.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || bill.status === statusFilter

      let matchesDate = true
      if (dateFilter !== "all") {
        const billDate = new Date(bill.date)
        const now = new Date()

        switch (dateFilter) {
          case "today":
            matchesDate = billDate.toDateString() === now.toDateString()
            break
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = billDate >= weekAgo
            break
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = billDate >= monthAgo
            break
        }
      }

      // Advanced filters
      let matchesAmount = true
      if (minAmount && bill.total < parseFloat(minAmount)) matchesAmount = false
      if (maxAmount && bill.total > parseFloat(maxAmount)) matchesAmount = false

      let matchesDateRange = true
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from)
        const billDate = new Date(bill.date)
        matchesDateRange = billDate >= fromDate
      }
      if (dateRange.to && matchesDateRange) {
        const toDate = new Date(dateRange.to)
        const billDate = new Date(bill.date)
        matchesDateRange = billDate <= toDate
      }

      return matchesSearch && matchesStatus && matchesDate && matchesAmount && matchesDateRange
    })

    return filtered
  }, [bills, searchTerm, statusFilter, dateFilter, minAmount, maxAmount, dateRange])

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage)
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleViewDetails = async (bill: any) => {
    setSelectedBill(bill)
    setShowBillDetails(true)
    
    // Initialize payment status for this bill
    const initialPaymentStatus: Record<string, boolean> = {}
    bill.participants?.forEach((participantId: string) => {
      // Use the actual payment status from the bill, or default to paid if they're the bill payer
      initialPaymentStatus[participantId] = bill.paymentStatus?.[participantId] || participantId === bill.paidBy
    })
    setPaymentStatus(initialPaymentStatus)
    
    // Fetch settlement details
    try {
      setLoadingSettlement(true)
      const [settlementData, optimalData] = await Promise.all([
        billService.getSettlementDetails(bill.id),
        billService.getOptimalSettlements(bill.id)
      ])
      setSettlementDetails(settlementData)
      setOptimalSettlements(optimalData)
    } catch (error) {
      console.error('Error fetching settlement details:', error)
      toast({
        title: "Error",
        description: "Failed to load settlement details.",
        variant: "destructive",
      })
    } finally {
      setLoadingSettlement(false)
    }
  }

  const handleMarkPayment = async (participantId: string, isPaid: boolean) => {
    if (!selectedBill) return
    
    try {
      console.log('Updating payment status:', { billId: selectedBill.id, participantId, status: isPaid ? 'paid' : 'pending' })
      
      // Call API to update payment status and create transaction
      const updatedBill = await billService.updatePaymentStatus(
        selectedBill.id, 
        participantId, 
        isPaid ? 'paid' : 'pending'
      )
      
      console.log('Payment status updated successfully:', updatedBill)
      
      // Update local state
      setPaymentStatus(prev => ({
        ...prev,
        [participantId]: isPaid
      }))
      
      // Update the bill in the bills list
      setBills(prevBills => 
        prevBills.map(bill => 
          bill.id === selectedBill.id 
            ? updatedBill
            : bill
        )
      )
      
      // Update selected bill
      setSelectedBill(updatedBill)
      
      // Refresh settlement details after payment update
      try {
        const [refreshedSettlement, refreshedOptimal] = await Promise.all([
          billService.getSettlementDetails(selectedBill.id),
          billService.getOptimalSettlements(selectedBill.id)
        ])
        setSettlementDetails(refreshedSettlement)
        setOptimalSettlements(refreshedOptimal)
      } catch (error) {
        console.error('Error refreshing settlement details:', error)
      }
      
      // Show success message
      toast({
        title: isPaid ? "Payment marked" : "Payment unmarked",
        description: `${getUserName(participantId)} has been marked as ${isPaid ? 'paid' : 'unpaid'}${isPaid ? '. Transaction added to your cashflow.' : ''}.`,
      })
      
      // Check if all participants have paid
      const allPaid = selectedBill.participants?.every((pId: string) => 
        pId === selectedBill.paidBy || paymentStatus[pId]
      )
      
      if (allPaid && isPaid) {
        toast({
          title: "Bill fully settled!",
          description: "All participants have paid their share.",
        })
      }
      
    } catch (error) {
      console.error('Error updating payment status:', error)
      
      // Revert the local state change since API failed
      setPaymentStatus(prev => ({
        ...prev,
        [participantId]: !isPaid
      }))
      
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportBill = (bill: any) => {
    const exportData = {
      description: bill.description,
      total: bill.total,
      date: bill.date,
      status: bill.status,
      participants: bill.participants,
      items: bill.items,
      paidBy: bill.paidBy
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bill-${bill.description.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export successful",
      description: "Bill data has been exported as JSON file.",
    })
  }

  const clearAdvancedFilters = () => {
    setMinAmount("")
    setMaxAmount("")
    setDateRange({ from: "", to: "" })
    setSearchTerm("")
    setStatusFilter("all")
    setDateFilter("all")
    setCurrentPage(1)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      finalized: "default",
      settled: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getUserName = (userId: string) => {
    if (userId === "current_user" || userId === "you") {
      return `You${user?.name ? ` (${user.name})` : ""}`
    }
    
    // Find the person in people array
    const person = people.find(p => p.id === userId)
    if (person) {
      return person.name
    }
    
    // If it's the current user's ID
    if (user && userId === user.id) {
      return `You${user.name ? ` (${user.name})` : ""}`
    }
    
    return userId || "Unknown User"
  }
  
  const getUserAvatar = (userId: string) => {
    if (userId === "current_user" || userId === "you") {
      return user?.avatar || "/placeholder.svg"
    }
    return "/placeholder.svg"
  }

  const handleDeleteBill = async (billId: string) => {
    await apiDeleteBill(billId)
    setBills((prev) => prev.filter((b) => b.id !== billId))
  }

  const totalBills = bills.length
  const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0)
  const settledBills = bills.filter((bill) => bill.status === "settled").length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bill History</h1>
          <p className="text-muted-foreground">View and manage all your split bills</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBills}</div>
            <p className="text-xs text-muted-foreground">{settledBills} settled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Across all bills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Rate</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBills > 0 ? Math.round((settledBills / totalBills) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Bills settled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Bills</CardTitle>
          <CardDescription>Search and filter your bill history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Advanced Filters</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Amount Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    />
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>
                
                {/* Clear Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <Button variant="outline" onClick={clearAdvancedFilters} className="w-full">
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bills ({filteredBills.length})</CardTitle>
              <CardDescription>All your split bills and their details</CardDescription>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading bills…</h3>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bills Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "No bills match your current filters."
                  : "You haven't created any bills yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bill.description}</div>
                        <div className="text-sm text-muted-foreground">{bill.items.length} items</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(bill.total)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Subtotal: {formatCurrency(bill.subtotal)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getUserAvatar(bill.paidBy) || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{getUserName(bill.paidBy)?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getUserName(bill.paidBy)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {bill.participants.slice(0, 3).map((participantId: string) => (
                          <Avatar key={participantId} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={getUserAvatar(participantId) || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{getUserName(participantId)?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                        ))}
                        {bill.participants.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs">+{bill.participants.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(bill.date)}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(bill)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportBill(bill)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteBill(bill.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Modal */}
      <Dialog open={showBillDetails} onOpenChange={setShowBillDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Bill Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete information about this bill and participant breakdown
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedBill.description}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-lg">
                      {formatCurrency(selectedBill.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Subtotal: {formatCurrency(selectedBill.subtotal)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Status & Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {getStatusBadge(selectedBill.status)}
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedBill.date)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bill Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Items ({selectedBill.items?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedBill.items && selectedBill.items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Participants</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBill.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{formatCurrency(item.amount)}</TableCell>
                            <TableCell>
                              <div className="flex -space-x-1">
                                {item.participants?.slice(0, 5).map((participantId: string, pIndex: number) => (
                                  <Avatar key={pIndex} className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={getUserAvatar(participantId)} />
                                    <AvatarFallback className="text-xs">
                                      {getUserName(participantId)?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {item.participants?.length > 5 && (
                                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                    <span className="text-xs">+{item.participants.length - 5}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No items found</p>
                  )}
                </CardContent>
              </Card>

              {/* Participants & Payment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Participants & Payment Status</span>
                  </CardTitle>
                  <CardDescription>
                    Mark participants as paid when they settle their portion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Paid By */}
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getUserAvatar(selectedBill.paidBy)} />
                          <AvatarFallback>{getUserName(selectedBill.paidBy)?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getUserName(selectedBill.paidBy)}</p>
                          <p className="text-sm text-muted-foreground">Paid the bill</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-100 border-green-300 text-green-700">
                          Paid
                        </Badge>
                        <input 
                          type="checkbox" 
                          checked={true} 
                          disabled 
                          className="h-4 w-4 text-green-600"
                        />
                      </div>
                    </div>

                    {/* Other Participants */}
                    {selectedBill.participants?.filter((p: string) => p !== selectedBill.paidBy).map((participantId: string, index: number) => {
                      const splitAmount = selectedBill.splits?.[participantId] || 0
                      const isPaid = paymentStatus[participantId] || false
                      
                      return (
                        <div key={index} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isPaid ? 'bg-green-50 border-green-200' : 'bg-background'}`}>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getUserAvatar(participantId)} />
                              <AvatarFallback>{getUserName(participantId)?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getUserName(participantId)}</p>
                              <p className="text-sm text-muted-foreground">
                                Owes: {formatCurrency(splitAmount)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={isPaid ? "outline" : "secondary"} className={isPaid ? "bg-green-100 border-green-300 text-green-700" : ""}>
                              {isPaid ? "Paid" : "Pending"}
                            </Badge>
                            <label className="flex items-center space-x-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isPaid}
                                onChange={(e) => handleMarkPayment(participantId, e.target.checked)}
                                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                              />
                              <span className="text-sm text-muted-foreground">Mark as paid</span>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Enhanced Settlement Summary */}
                    {selectedBill.participants && (
                      <div className="mt-3 space-y-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Settlement Details
                          </h4>
                          
                          {loadingSettlement ? (
                            <div className="text-sm text-muted-foreground">Loading settlement details...</div>
                          ) : settlementDetails ? (
                            <div className="space-y-2">
                              {/* Settlement Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">Progress:</span>
                                  <span>{settlementDetails.summary.settlementPercentage}% complete</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      settlementDetails.summary.isFullySettled ? 'bg-green-600' : 'bg-primary'
                                    }`}
                                    style={{ width: `${settlementDetails.summary.settlementPercentage}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Settlement Summary Cards */}
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-card p-2 rounded-lg border">
                                  <div className="text-muted-foreground">Total Owed</div>
                                  <div className="font-semibold text-foreground">{formatCurrency(settlementDetails.summary.totalOwed)}</div>
                                </div>
                                <div className="bg-card p-2 rounded-lg border">
                                  <div className="text-muted-foreground">Paid</div>
                                  <div className="font-semibold text-green-600">{formatCurrency(settlementDetails.summary.totalPaid)}</div>
                                </div>
                                <div className="bg-card p-2 rounded-lg border">
                                  <div className="text-muted-foreground">Remaining</div>
                                  <div className="font-semibold text-orange-600">{formatCurrency(settlementDetails.summary.totalRemaining)}</div>
                                </div>
                              </div>

                              {/* Individual Settlement Details - Compact */}
                              {settlementDetails.settlements.length > 0 && (
                                <div className="space-y-1">
                                  <h5 className="text-xs font-medium text-muted-foreground">Individual Settlements</h5>
                                  {settlementDetails.settlements.map((settlement: any) => (
                                    <div key={settlement.participantId} className="flex items-center justify-between p-2 bg-card rounded border text-sm">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${settlement.isPaid ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                                        <span className="text-foreground">{getUserName(settlement.participantId)}</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-foreground">{formatCurrency(settlement.owedAmount)}</div>
                                        {settlement.remainingAmount > 0 && (
                                          <div className="text-xs text-orange-600">pending</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Settlement Status - Compact */}
                              <div className={`p-2 rounded text-center text-sm font-medium border ${
                                settlementDetails.summary.isFullySettled 
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' 
                                  : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800'
                              }`}>
                                {settlementDetails.summary.isFullySettled 
                                  ? '✅ Fully Settled' 
                                  : `💰 ${formatCurrency(settlementDetails.summary.totalRemaining)} Pending`
                                }
                              </div>

                              {/* Optimal Settlement Suggestions - Compact */}
                              {optimalSettlements && optimalSettlements.settlements.length > 0 && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded dark:bg-blue-950 dark:border-blue-800">
                                  <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                                    💡 Payment Suggestions
                                  </h5>
                                  <div className="space-y-1">
                                    {optimalSettlements.settlements.slice(0, 3).map((settlement: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between text-xs">
                                        <span className="text-blue-600 dark:text-blue-400">
                                          {getUserName(settlement.from)} → {getUserName(settlement.to)}
                                        </span>
                                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                                          {formatCurrency(settlement.amount)}
                                        </span>
                                      </div>
                                    ))}
                                    {optimalSettlements.settlements.length > 3 && (
                                      <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
                                        +{optimalSettlements.settlements.length - 3} more...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Settlement Progress:</span>
                                <span>
                                  {selectedBill.participants.filter((pId: string) => 
                                    pId === selectedBill.paidBy || paymentStatus[pId]
                                  ).length} / {selectedBill.participants.length} paid
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${(selectedBill.participants.filter((pId: string) => 
                                      pId === selectedBill.paidBy || paymentStatus[pId]
                                    ).length / selectedBill.participants.length) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
