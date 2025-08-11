"use client"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Calculator, Users, Receipt } from "lucide-react"
import type { BillItem } from "@/contexts/app-context"
import { createBill as apiCreateBill } from "@/services/api"

interface BillItemWithId extends BillItem {
  tempId: string
}

export default function SplitBillsPage() {
  const { state, addBill } = useApp()
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<BillItemWithId[]>([])
  const [paidBy, setPaidBy] = useState("")
  const [participants, setParticipants] = useState<string[]>([])
  const [taxPercentage, setTaxPercentage] = useState("")
  const [tipAmount, setTipAmount] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showUserSearch, setShowUserSearch] = useState(false)
  const { toast } = useToast()

  // Mock additional users for search
  const mockUsers = [
    { id: "user1", name: "John Doe", email: "john@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    { id: "user2", name: "Jane Smith", email: "jane@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    { id: "user3", name: "Mike Johnson", email: "mike@example.com", avatar: "/placeholder.svg?height=32&width=32" },
  ]

  const allUsers = [...state.people, ...mockUsers]
  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addItem = () => {
    if (!newItemName || !newItemAmount) return

    const newItem: BillItemWithId = {
      id: Date.now().toString(),
      tempId: Date.now().toString(),
      name: newItemName,
      amount: Number.parseFloat(newItemAmount),
      participants: [],
    }

    setItems([...items, newItem])
    setNewItemName("")
    setNewItemAmount("")
  }

  const removeItem = (tempId: string) => {
    setItems(items.filter((item) => item.tempId !== tempId))
  }

  const updateItemParticipants = (tempId: string, participantId: string, checked: boolean) => {
    setItems(
      items.map((item) =>
        item.tempId === tempId
          ? {
            ...item,
            participants: checked
              ? [...item.participants, participantId]
              : item.participants.filter((p) => p !== participantId),
          }
          : item,
      ),
    )
  }

  const toggleParticipant = (userId: string) => {
    setParticipants((prev) => (prev.includes(userId) ? prev.filter((p) => p !== userId) : [...prev, userId]))
  }

  const calculateBill = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const tax = (subtotal * (Number.parseFloat(taxPercentage) || 0)) / 100
    const tip = Number.parseFloat(tipAmount) || 0
    const total = subtotal + tax + tip

    // Calculate splits
    const splits: Record<string, number> = {}
    participants.forEach((participantId) => {
      splits[participantId] = 0
    })

    // Split items among participants
    items.forEach((item) => {
      if (item.participants.length > 0) {
        const itemShare = item.amount / item.participants.length
        item.participants.forEach((participantId) => {
          if (splits[participantId] !== undefined) {
            splits[participantId] += itemShare
          }
        })
      }
    })

    // Add tax and tip proportionally
    const totalItemAmount = Object.values(splits).reduce((sum, amount) => sum + amount, 0)
    if (totalItemAmount > 0) {
      Object.keys(splits).forEach((participantId) => {
        const proportion = splits[participantId] / totalItemAmount
        splits[participantId] += (tax + tip) * proportion
      })
    }

    return { subtotal, tax, tip, total, splits }
  }

  const finalizeBill = async () => {
    if (items.length === 0 || participants.length === 0 || !paidBy) {
      toast({
        title: "Error",
        description: "Please add items, select participants, and choose who paid.",
        variant: "destructive",
      })
      return
    }

    const { subtotal, tax, tip, total, splits } = calculateBill()

    const bill = {
      description: description || `Bill - ${new Date().toLocaleString()}`,
      items: items.map(({ tempId, ...item }) => item),
      paidBy,
      participants,
      subtotal,
      tax,
      taxPercentage: Number.parseFloat(taxPercentage) || 0,
      tip,
      total,
      date: new Date().toISOString(),
      status: "finalized" as const,
      splits,
    }

    try {
      const created = await apiCreateBill(bill)
      // optionally reflect locally if needed (context will generate an id)
      addBill(bill)
    } catch (e) {
      toast({ title: "Failed", description: "Could not save bill to server.", variant: "destructive" })
      return
    }

    toast({
      title: "Bill finalized",
      description: "The bill has been saved and splits calculated.",
    })

    // Reset form
    setDescription("")
    setItems([])
    setPaidBy("")
    setParticipants([])
    setTaxPercentage("")
    setTipAmount("")
  }

  const { subtotal, tax, tip, total, splits } = calculateBill()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Split Bills</h1>
          <p className="text-muted-foreground">Split bills and expenses with friends and family</p>
        </div>
        <Button onClick={finalizeBill} disabled={items.length === 0 || participants.length === 0}>
          <Receipt className="mr-2 h-4 w-4" />
          Finalize Bill
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bill Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
              <CardDescription>Add bill information and items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Bill Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter bill description or leave empty for auto-generated"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add Items</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                  />
                  <Button onClick={addItem} disabled={!newItemName || !newItemAmount}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {items.length > 0 && (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.tempId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.name}</span>
                            <span className="font-semibold">
                              {state.settings.currency} {item.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.participants.length > 0
                              ? `Split among ${item.participants.length} people`
                              : "No participants selected"}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.tempId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax Percentage (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tip">Tip Amount ({state.settings.currency})</Label>
                  <Input
                    id="tip"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Participants</CardTitle>
              <CardDescription>Choose who was involved in this bill</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>From Your People</Label>
                <div className="grid grid-cols-2 gap-2">
                  {state.people.map((person) => (
                    <div key={person.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                      <Checkbox
                        id={person.id}
                        checked={participants.includes(person.id)}
                        onCheckedChange={(checked) => toggleParticipant(person.id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={person.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{person.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <Label htmlFor={person.id} className="flex-1 text-sm">
                        {person.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Search Other Users</Label>
                <Input
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowUserSearch(e.target.value.length > 0)
                  }}
                />
                {showUserSearch && filteredUsers.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {filteredUsers.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          if (!participants.includes(user.id)) {
                            toggleParticipant(user.id)
                          }
                          setSearchTerm("")
                          setShowUserSearch(false)
                        }}
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

              {participants.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Participants ({participants.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((participantId) => {
                      const participant = allUsers.find((u) => u.id === participantId)
                      return (
                        <Badge key={participantId} variant="secondary" className="flex items-center space-x-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={participant?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{participant?.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <span>{participant?.name}</span>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paidBy">Who Paid the Bill?</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="you">You</SelectItem>
                    {participants.map((participantId) => {
                      const participant = allUsers.find((u) => u.id === participantId)
                      return (
                        <SelectItem key={participantId} value={participantId}>
                          {participant?.name}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Item Participants */}
          {items.length > 0 && participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Items to Participants</CardTitle>
                <CardDescription>Select who was involved in each item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.tempId} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.name}</h4>
                      <span className="font-semibold">
                        {state.settings.currency} {item.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {participants.map((participantId) => {
                        const participant = allUsers.find((u) => u.id === participantId)
                        return (
                          <div key={participantId} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${item.tempId}-${participantId}`}
                              checked={item.participants.includes(participantId)}
                              onCheckedChange={(checked) =>
                                updateItemParticipants(item.tempId, participantId, !!checked)
                              }
                            />
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={participant?.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{participant?.name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <Label htmlFor={`${item.tempId}-${participantId}`} className="text-sm">
                              {participant?.name}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bill Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Bill Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>
                    {state.settings.currency} {subtotal.toFixed(2)}
                  </span>
                </div>
                {tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Tax ({taxPercentage}%)</span>
                    <span>
                      {state.settings.currency} {tax.toFixed(2)}
                    </span>
                  </div>
                )}
                {tip > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Tip</span>
                    <span>
                      {state.settings.currency} {tip.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {state.settings.currency} {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.keys(splits).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Who Owes What</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(splits).map(([participantId, amount]) => {
                  const participant = allUsers.find((u) => u.id === participantId)
                  const isPayer = participantId === paidBy
                  return (
                    <div key={participantId} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={participant?.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{participant?.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{participant?.name}</span>
                        {isPayer && (
                          <Badge variant="outline" className="text-xs">
                            Paid
                          </Badge>
                        )}
                      </div>
                      <span className={`font-semibold ${isPayer ? "text-green-600" : ""}`}>
                        {state.settings.currency} {amount.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
