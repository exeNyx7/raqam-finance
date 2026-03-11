"use client"

import { useState } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, ArrowRight, Loader2 } from "lucide-react"
import { createTransaction, getCategories } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { predictCategory } from "@/lib/smart-categorization"

interface BankExportUploadProps {
    onImportComplete?: () => void
}

export function BankExportUpload({ onImportComplete }: BankExportUploadProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<"upload" | "map" | "review">("upload")
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [mapping, setMapping] = useState({
        date: "",
        description: "",
        amount: "",
    })
    const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({})
    const [importing, setImporting] = useState(false)
    const { toast } = useToast()
    const [availableCategories, setAvailableCategories] = useState<string[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            parseFile(selectedFile)
        }
    }

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setParsedData(results.data)
                    setHeaders(Object.keys(results.data[0] as object))
                    setStep("map")
                    // Try to auto-map
                    const keys = Object.keys(results.data[0] as object).map(k => k.toLowerCase())
                    const newMapping = { ...mapping }
                    keys.forEach((k, i) => {
                        const originalKey = Object.keys(results.data[0] as object)[i]
                        if (k.includes("date") || k.includes("time")) newMapping.date = originalKey
                        if (k.includes("desc") || k.includes("memo") || k.includes("narrative") || k.includes("details")) newMapping.description = originalKey
                        if (k.includes("amount") || k.includes("value") || k.includes("debit") || k.includes("credit")) newMapping.amount = originalKey
                    })
                    setMapping(newMapping)
                }
            },
            error: (error) => {
                toast({
                    title: "Error parsing file",
                    description: error.message,
                    variant: "destructive",
                })
            }
        })
    }

    const handleMappingSubmit = async () => {
        if (!mapping.date || !mapping.description || !mapping.amount) {
            toast({
                title: "Missing mapping",
                description: "Please map all required fields.",
                variant: "destructive",
            })
            return
        }

        // Load categories for smart prediction
        try {
            const cats = await getCategories()
            setAvailableCategories(cats || [])
        } catch (e) { console.error(e) }

        // Select all rows by default
        const initialSelection: Record<number, boolean> = {}
        parsedData.forEach((_, i) => initialSelection[i] = true)
        setSelectedRows(initialSelection)
        setStep("review")
    }

    const handleImport = async () => {
        setImporting(true)
        let successCount = 0
        let errorCount = 0

        try {
            const rowsToImport = parsedData.filter((_, i) => selectedRows[i])

            // Process in sequence to avoid overwhelming backend
            for (const row of rowsToImport) {
                try {
                    const amountStr = String(row[mapping.amount]).replace(/[^0-9.-]/g, "")
                    const amount = parseFloat(amountStr)
                    const dateStr = row[mapping.date]
                    const description = row[mapping.description]

                    if (isNaN(amount) || !description) continue

                    await createTransaction({
                        description,
                        amount, // Backend handles type based on sign, or we can logic here
                        date: new Date(dateStr).toISOString(), // Basic date parsing
                        type: amount < 0 ? "expense" : "income", // Naive assumption: negative is expense
                        category: predictCategory(description, availableCategories),
                    })
                    successCount++
                } catch (e) {
                    console.error(e)
                    errorCount++
                }
            }

            toast({
                title: "Import complete",
                description: `Successfully imported ${successCount} transactions. ${errorCount > 0 ? `${errorCount} failed.` : ""}`,
            })
            setOpen(false)
            resetState()
            onImportComplete?.()
        } catch (e) {
            toast({
                title: "Import failed",
                description: "Something went wrong during import.",
                variant: "destructive",
            })
        } finally {
            setImporting(false)
        }
    }

    const resetState = () => {
        setStep("upload")
        setFile(null)
        setParsedData([])
        setMapping({ date: "", description: "", amount: "" })
        setSelectedRows({})
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetState()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Transactions</DialogTitle>
                    <DialogDescription>Upload a CSV file from your bank.</DialogDescription>
                </DialogHeader>

                {step === "upload" && (
                    <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>
                )}

                {step === "map" && (
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Date Column</Label>
                                <Select value={mapping.date} onValueChange={(v) => setMapping(m => ({ ...m, date: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description Column</Label>
                                <Select value={mapping.description} onValueChange={(v) => setMapping(m => ({ ...m, description: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Amount Column</Label>
                                <Select value={mapping.amount} onValueChange={(v) => setMapping(m => ({ ...m, amount: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="border rounded-md p-4 bg-muted/50 text-sm">
                            <p className="font-medium mb-2">Preview (First 3 rows)</p>
                            {parsedData.slice(0, 3).map((row, i) => (
                                <div key={i} className="flex gap-4 text-xs">
                                    <div className="w-1/3 truncate">{row[mapping.date] || "-"}</div>
                                    <div className="w-1/3 truncate">{row[mapping.description] || "-"}</div>
                                    <div className="w-1/3 truncate">{row[mapping.amount] || "-"}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === "review" && (
                    <div className="py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"><Checkbox checked={Object.values(selectedRows).every(Boolean)} onCheckedChange={(c) => {
                                        const newState = { ...selectedRows }
                                        Object.keys(newState).forEach(k => newState[Number(k)] = !!c)
                                        setSelectedRows(newState)
                                    }} /></TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Checkbox checked={!!selectedRows[i]} onCheckedChange={(c) => setSelectedRows(prev => ({ ...prev, [i]: !!c }))} /></TableCell>
                                        <TableCell>{row[mapping.date]}</TableCell>
                                        <TableCell>{row[mapping.description]}</TableCell>
                                        <TableCell>{row[mapping.amount]}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <DialogFooter>
                    {step === "map" && (
                        <Button onClick={handleMappingSubmit}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    {step === "review" && (
                        <Button onClick={handleImport} disabled={importing}>
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import {Object.values(selectedRows).filter(Boolean).length} Transactions
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
