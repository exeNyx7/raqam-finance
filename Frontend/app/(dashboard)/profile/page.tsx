"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Download, Shield, Eye, EyeOff, Camera, LogOut, Trash2 } from "lucide-react"
import { changePassword, getProfile, updateProfile, getLedgers, leaveLedger } from "@/services/api"
export default function ProfilePage() {
  const { user: authUser, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [ledgers, setLedgers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    Promise.all([getProfile(), getLedgers({ page: 1, limit: 10 })])
      .then(([profile, ledgersList]) => {
        if (!mounted) return
        setName(profile.name || "")
        setEmail(profile.email || "")
        const formatted = (ledgersList || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          role: l.role,
          members: (l.membersDetailed || l.members || []).length,
          canLeave: l.role !== "owner",
        }))
        setLedgers(formatted)
      })
      .catch((e) => toast({ title: "Failed to load profile", description: e.message, variant: "destructive" }))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [toast])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updated = await updateProfile({ name, email })
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." })
      setIsEditing(false)
      const nextUser = { ...(authUser || {}), name: updated.name, email: updated.email }
      localStorage.setItem("raqam_user", JSON.stringify(nextUser))
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" })
      return
    }
    try {
      await changePassword({ currentPassword, newPassword })
      toast({ title: "Password changed", description: "Your password has been changed successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      toast({ title: "Change failed", description: e.message, variant: "destructive" })
    }
  }

  const handleExportData = () => {
    const payload = { profile: { name, email }, exportDate: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `raqam-profile-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: "Export started", description: "Your data export has started." })
  }

  const handleLeaveLedger = async (ledgerId: string, ledgerName: string) => {
    try {
      await leaveLedger(ledgerId)
      setLedgers((prev) => prev.filter((l) => l.id !== ledgerId))
      toast({ title: "Left ledger", description: `You have left "${ledgerName}".` })
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" })
    }
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion",
      description: "Account deletion would be implemented here with proper confirmation.",
      variant: "destructive",
    })
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={(authUser && authUser.avatar) || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{(authUser?.name || name || "U")?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
              <p className="text-sm text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit">
              <Shield className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Shared Ledgers */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Ledgers</CardTitle>
          <CardDescription>Ledgers you're a member of and your role in each</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ledgers.map((ledger) => (
              <div key={ledger.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{ledger.name}</h4>
                    <Badge variant="outline">{ledger.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ledger.members} members</p>
                </div>
                {ledger.canLeave && (
                  <Button variant="outline" size="sm" onClick={() => handleLeaveLedger(ledger.id, ledger.name)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave
                  </Button>
                )}
              </div>
            ))}
            {ledgers.length === 0 && <p className="text-sm text-muted-foreground">No shared ledgers.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download all your data including transactions, ledgers, and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export My Data
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
