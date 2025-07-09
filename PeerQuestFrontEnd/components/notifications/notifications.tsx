"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, Award, Shield, MessageSquare } from "lucide-react"
import type { User as UserType } from "@/lib/types"
import { clearAllNotifications, fetchNotifications } from "@/lib/api/notifications"
import { useRouter } from "next/navigation"

interface NotificationsProps {
  currentUser: UserType | null
  onClose: () => void
}

export function Notifications({ currentUser, onClose }: NotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")
  const wsRef = useRef<WebSocket | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch notifications from backend
    async function loadNotifications() {
      try {
        const data = await fetchNotifications()
        setNotifications(
          data
            .filter((n: any) => n.type !== "welcome back to the peerquest tavern")
            .map((n: any) => ({
              id: n.notification_id || n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              read: n.is_read,
              createdAt: new Date(n.created_at),
              actionUrl: n.action_url || "",
              quest_id: n.quest_id || undefined,
            })),
        )
      } catch (err) {
        setNotifications([])
      }
    }
    if (currentUser) {
      loadNotifications()
      // --- WebSocket setup for real-time notifications ---
      let wsHost = process.env.NEXT_PUBLIC_WS_URL || window.location.hostname + ":8000";
      // If wsHost does not include a port, add :8000
      if (!/:\d+$/.test(wsHost)) wsHost += ":8000";
      const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${wsProtocol}://${wsHost}/ws/notifications/${currentUser.id}/`;
      console.log("Connecting to WebSocket:", wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => {
        console.log("WebSocket connection established.");
      };
      wsRef.current.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          if (notification.type === "welcome back to the peerquest tavern") return;
          setNotifications((prev) => [
            {
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              read: false,
              createdAt: new Date(notification.created_at),
              actionUrl: notification.action_url || "",
              quest_id: notification.quest_id || undefined,
            },
            ...prev,
          ]);
        } catch (e) {
          console.error("WebSocket notification parse error", e);
        }
      };
      wsRef.current.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
      wsRef.current.onclose = (event) => {
        console.warn("WebSocket closed:", event);
      };
      return () => {
        wsRef.current?.close();
      };
    } else {
      setNotifications([])
    }
  }, [currentUser])

  const filteredNotifications =
    activeTab === "all" ? notifications : notifications.filter((notification) => !notification.read)

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications? This action cannot be undone.")) {
      return
    }
    try {
      await clearAllNotifications()
      setNotifications([])
    } catch (err) {
      // Optionally show an error toast
      alert("Failed to clear notifications")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "quest_application":
        return <Shield className="text-blue-500" size={18} />
      case "guild_invite":
        return <MessageSquare className="text-green-500" size={18} />
      case "quest_completed":
        return <Check className="text-purple-500" size={18} />
      case "level_up":
        return <Award className="text-yellow-500" size={18} />
      case "message":
        return <MessageSquare className="text-red-500" size={18} />
      default:
        return <Bell className="text-gray-500" size={18} />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) {
      return `${diffMins} min ago`
    } else if (diffHours < 24) {
      return `${diffHours} hr ago`
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    }
  }

  // Remove quest management redirect on notification click
  const handleNotificationClick = (notification: any) => {
    // No redirect or navigation
    // Optionally, you could mark as read or show a toast here
    onClose()
  }

  return (
    <div className="notifications-panel bg-white rounded-lg shadow-lg w-80 max-h-[80vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#2C1A1D] text-white">
        <h3 className="font-bold">Notifications</h3>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X size={18} />
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "all" ? "text-[#8B75AA] border-b-2 border-[#8B75AA]" : "text-gray-500 hover:text-[#8B75AA]"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "unread" ? "text-[#8B75AA] border-b-2 border-[#8B75AA]" : "text-gray-500 hover:text-[#8B75AA]"
          }`}
          onClick={() => setActiveTab("unread")}
        >
          Unread
        </button>
        <button className="py-2 px-4 text-sm text-red-500 hover:text-red-700" onClick={handleClearAll}>
          Clear all
        </button>
        <button className="py-2 px-4 text-sm text-gray-500 hover:text-[#8B75AA]" onClick={markAllAsRead}>
          Mark all read
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? "bg-blue-50" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex">
                <div className="mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <span className="text-xs text-gray-500 ml-2">{formatTime(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="mx-auto mb-2 text-gray-400" size={24} />
            <p>No notifications to display</p>
          </div>
        )}
      </div>
    </div>
  )
}
