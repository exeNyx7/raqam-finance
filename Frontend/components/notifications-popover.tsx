"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api"
import { useRouter } from "next/navigation"

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchNotifications()
        // Poll every 3 minutes
        const interval = setInterval(fetchNotifications, 180000)
        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        try {
            // Assume default page 1 limit 10 for popover
            const res = await getNotifications({ page: 1, limit: 10, filter: { read: false } })
            const data = Array.isArray(res) ? res : (res?.data || [])
            if (data) {
                setNotifications(data)
                // We'll just count the unread in the first page for now, or use stats endpoint if available
                setUnreadCount(data.filter((n: any) => !n.read).length)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleMarkRead = async (id: string, link?: string) => {
        try {
            await markNotificationRead(id)
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            if (link) {
                setOpen(false)
                router.push(link)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead()
            setNotifications(notifications.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={handleMarkAllRead}>
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? 'bg-muted/20' : ''}`}
                                    onClick={() => handleMarkRead(n.id, n.metadata?.ledgerId ? `/ledgers/${n.metadata.ledgerId}` : undefined)}
                                >
                                    <div className="flex justify-between gap-2">
                                        <h5 className="text-sm font-medium leading-none">{n.title}</h5>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {n.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
