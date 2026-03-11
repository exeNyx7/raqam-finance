"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Search } from "lucide-react"
import { getTransactions, getCategories } from "@/lib/api"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { BankExportUpload } from "@/components/bank-export-upload"
import { useApp } from "@/contexts/app-context"
import { Transaction } from "@/services/types"

export default function TransactionsPage() {
    const { state } = useApp()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterCategory, setFilterCategory] = useState("all")
    const [showAddModal, setShowAddModal] = useState(false)
    const [categories, setCategories] = useState<string[]>([])

    // Load data
    const loadData = async () => {
        setLoading(true)
        try {
            const [txs, cats] = await Promise.all([
                getTransactions({ limit: 100 }), // Fetch recent 100
                getCategories()
            ])
            // Handle pagination wrapper if present
            const list = Array.isArray(txs) ? txs : (txs as any).data || []
            setTransactions(list)
            setCategories(cats || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredTransactions = transactions.filter((t) => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = filterCategory === "all" || t.category === filterCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">Manage and view all your transactions</p>
                </div>
                <div className="flex items-center space-x-2">
                    <BankExportUpload onImportComplete={loadData} />
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>All Transactions</CardTitle>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 w-[200px] or w-full"
                                />
                            </div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No transactions found</TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{t.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{t.category}</Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{t.type}</TableCell>
                                        <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-green-600' : ''}`}>
                                            {state.settings.currency} {Math.abs(t.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                                                {t.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AddTransactionModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                onCreated={loadData}
            />
        </div>
    )
}
