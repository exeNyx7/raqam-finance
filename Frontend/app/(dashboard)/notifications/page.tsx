"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Check, Trash2, DollarSign, UserPlus } from "lucide-react"
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
} from "@/services/api"

export default function NotificationsPage() {
  const [notificationList, setNotificationList] = useState<any[]>([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const items = await getNotifications()
          if (mounted) setNotificationList(items)
        } catch (_) {
          if (mounted) setNotificationList([])
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  const unreadCount = notificationList.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotificationList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (_) { }
  }

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (_) { }
  }

  const deleteNotification = async (id: string) => {
    try {
      await deleteNotificationApi(id)
      setNotificationList((prev) => prev.filter((n) => n.id !== id))
    } catch (_) { }
  }

  const filteredNotifications = notificationList.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "read") return notification.read
    return true
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    const iconColors: Record<string, string> = {
      payment_received: "text-green-600",
      payment_approved: "text-blue-600",
      added_to_ledger: "text-purple-600",
      new_expense: "text-orange-600",
      reminder: "text-yellow-600",
    }
    const IconCmp =
      type === "payment_received" || type === "new_expense" ? DollarSign : type === "payment_approved" ? Check : type === "added_to_ledger" ? UserPlus : Bell
    return (
      <div className={`p-2 rounded-full bg-muted ${iconColors[type] || "text-gray-600"}`}>
        <IconCmp className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your financial activities</p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notificationList.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read ({notificationList.length - unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-center">
                  {filter === "unread"
                    ? "You're all caught up! No unread notifications."
                    : filter === "read"
                      ? "No read notifications to show."
                      : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-colors ${!notification.read ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-semibold">{notification.title}</h4>
                              {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{notification.ledger}</span>
                              {notification.amount && (
                                <span className="font-medium">${notification.amount.toFixed(2)}</span>
                              )}
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 ml-4">
                            {!notification.read && (
                              <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
