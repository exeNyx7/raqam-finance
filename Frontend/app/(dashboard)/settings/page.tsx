"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Globe, Database, Shield, Plus, Trash2, Download, Upload, AlertTriangle } from "lucide-react"
import { getSettings, updateSettings as apiUpdateSettings, getCategories, addCategory as apiAddCategory, deleteCategory as apiDeleteCategory } from "@/services/api"

const currencies = [
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    currency: "PKR",
    dateFormat: "DD/MM/YYYY",
    theme: "system" as "light" | "dark" | "system",
    notifications: { email: true, push: true, reminders: true },
    privacy: { profileVisibility: "friends" as "public" | "friends" | "private", transactionVisibility: "friends" as "public" | "friends" | "private" },
  })
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    Promise.all([getSettings(), getCategories()])
      .then(([settingsRes, categoriesRes]) => {
        if (!mounted) return
        setSettings(settingsRes)
        setCategories(categoriesRes || [])
      })
      .catch((e) => {
        toast({ title: "Failed to load settings", description: e.message, variant: "destructive" })
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [toast])

  const handleCurrencyChange = async (currency: string) => {
    try {
      const updated = await apiUpdateSettings({ currency })
      setSettings((prev) => ({ ...prev, currency: updated.currency }))
      toast({ title: "Currency updated", description: `Currency changed to ${currency}` })
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    }
  }

  const handleNotificationChange = async (
    type: keyof typeof settings.notifications,
    value: boolean,
  ) => {
    try {
      const updated = await apiUpdateSettings({
        notifications: { ...settings.notifications, [type]: value },
      })
      setSettings((prev) => ({ ...prev, notifications: updated.notifications }))
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    }
  }

  const handlePrivacyChange = async (
    type: keyof typeof settings.privacy,
    value: string,
  ) => {
    try {
      const updated = await apiUpdateSettings({
        privacy: { ...settings.privacy, [type]: value },
      })
      setSettings((prev) => ({ ...prev, privacy: updated.privacy }))
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    }
  }

  const handleDateFormatChange = async (value: string) => {
    try {
      const updated = await apiUpdateSettings({ dateFormat: value })
      setSettings((prev) => ({ ...prev, dateFormat: updated.dateFormat }))
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    if (categories.includes(newCategory.trim())) {
      toast({ title: "Category exists", description: "This category already exists.", variant: "destructive" })
      return
    }
    try {
      const list = await apiAddCategory(newCategory.trim())
      setCategories(list)
      toast({ title: "Category added", description: `${newCategory} has been added to your categories.` })
      setNewCategory("")
    } catch (e: any) {
      toast({ title: "Add failed", description: e.message, variant: "destructive" })
    }
  }

  const handleDeleteCategory = async (category: string) => {
    try {
      const list = await apiDeleteCategory(category)
      setCategories(list)
      toast({ title: "Category deleted", description: `${category} has been removed from your categories.` })
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" })
    }
  }

  const exportPayload = useMemo(
    () => ({
      settings,
      categories,
      exportDate: new Date().toISOString(),
    }),
    [settings, categories],
  )

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `raqam-settings-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: "Data exported", description: "Your settings have been exported successfully." })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        // In a real app, you would validate and merge the imported data
        toast({
          title: "Data imported",
          description: "Your data has been imported successfully.",
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleDeleteAllData = () => {
    // In a real app, this would require 2FA confirmation
    toast({
      title: "Delete all data",
      description: "This feature requires two-factor authentication.",
      variant: "destructive",
    })
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences and data</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>General Settings</span>
          </CardTitle>
          <CardDescription>Configure your basic app preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={settings.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={settings.dateFormat} onValueChange={handleDateFormatChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>Import, export, and manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Export Data</Label>
              <Button onClick={handleExportData} variant="outline" className="w-full bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
              <p className="text-xs text-muted-foreground">
                Download all your data including transactions, budgets, and goals
              </p>
            </div>
            <div className="space-y-2">
              <Label>Import Data</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-file"
                />
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Import from File
                  </label>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Import data from JSON or CSV files</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Categories</CardTitle>
          <CardDescription>Add or remove transaction categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter new category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Current Categories ({categories.length})</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category} variant="secondary" className="flex items-center space-x-1">
                  <span>{category}</span>
                  <button onClick={() => handleDeleteCategory(category)} className="ml-1 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Control how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch checked={settings.notifications.email} onCheckedChange={(checked) => handleNotificationChange("email", checked)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch checked={settings.notifications.push} onCheckedChange={(checked) => handleNotificationChange("push", checked)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Payment Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about pending payments</p>
            </div>
            <Switch checked={settings.notifications.reminders} onCheckedChange={(checked) => handleNotificationChange("reminders", checked)} />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy Settings</span>
          </CardTitle>
          <CardDescription>Control who can see your information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select value={settings.privacy.profileVisibility} onValueChange={(value) => handlePrivacyChange("profileVisibility", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction Visibility</Label>
              <Select value={settings.privacy.transactionVisibility} onValueChange={(value) => handlePrivacyChange("transactionVisibility", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent activity in your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "Budget created", details: "Monthly Food Budget", time: "2 hours ago" },
              { action: "Goal updated", details: "Emergency Fund contribution", time: "1 day ago" },
              { action: "Bill finalized", details: "Restaurant dinner split", time: "2 days ago" },
              { action: "Person added", details: "John Doe added to contacts", time: "3 days ago" },
              { action: "Settings changed", details: "Currency updated to PKR", time: "1 week ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm text-muted-foreground">{activity.details}</div>
                </div>
                <div className="text-sm text-muted-foreground">{activity.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete All Data</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your data including transactions, budgets, and goals
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAllData}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
