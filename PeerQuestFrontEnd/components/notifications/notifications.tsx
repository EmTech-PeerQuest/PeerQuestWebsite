"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, Check, Award, Shield, MessageSquare } from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface NotificationsProps {
  currentUser: UserType | null;
  onClose: () => void;
}

export function Notifications({ currentUser, onClose }: NotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  // Helper to perform approve/reject via backend
  // Helper to fetch notifications (for reuse)
  const fetchNotifications = async (token: string) => {
    try {
      const res = await fetch("/api/notifications-proxy", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch notifications (status ${res.status})`);
      const data = await res.json();
      setNotifications(
        data.map((n: any) => ({
          ...n,
          createdAt: new Date(n.created_at),
          type: n.notif_type,
          questTitle: n.quest_title,
          status: n.status,
          result: n.result,
          questId: n.quest_id,
          // Use related application ID if available, otherwise fallback to quest ID to avoid null errors
          applicationId: n.application_id,
        }))
      );
    } catch (err) {
      console.error("[Notifications] Error fetching notifications:", err);
      setNotifications([]);
    }
  };

  const performAction = async (id: number, action: 'approve' | 'reject') => {
    // Prevent null/invalid applicationId
    if (!id) {
      alert('Cannot process this notification; it may be outdated. Please refresh to get updated notifications.');
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;
    try {
      const res = await fetch(`/api/applications/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    if (res.ok) {
      // Refetch notifications to get updated status
      await fetchNotifications(token);
      // Refresh page data (e.g., quest management) after approval/rejection
      router.refresh();
      // Force a full reload to update client-side quest state
      if (typeof window !== 'undefined') window.location.reload();
      return;
    } else {
        const errorText = await res.text();
        let msg = `Failed to ${action} application.`;
        let shouldRemove = false;
        try {
          const errJson = JSON.parse(errorText);
          msg = errJson.error || errJson.detail || msg;
          if (msg === 'Application is not pending.') {
            shouldRemove = true;
          }
        } catch {}
        alert(msg);
        if (shouldRemove) {
          setNotifications(prev => prev.filter(n => n.questId !== id));
        } else {
          // Optionally, refetch notifications in case status changed
          await fetchNotifications(token);
        }
      }
    } catch (e) {
      alert(`Error during ${action}: ${e}`);
      console.error(`Error during ${action}`, e);
    }
  };
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Navigate to quest application chat or management page
  const handleGoToQuest = (questId: number | string | null, applicationId?: number) => {
    if (!questId) return;
    // Redirect to the application's chat or details; adjust route as needed
    // e.g., using Next.js App Router under /applications/[id]/approve
    if (applicationId) {
      router.push(`/applications/${applicationId}/approve`);
    } else {
      router.push(`/applications/${questId}`);
    }
  };

  // Fetch notifications from backend
  useEffect(() => {
    if (!currentUser) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setNotifications([]);
      return;
    }
    fetchNotifications(token);
  }, [currentUser]);

  // Hide processed quest_application notifications (only show pending)
  const visibleNotifications = notifications.filter((notification) => {
    // For quest_application type, only show if still pending
    if (notification.type === 'quest_application' && notification.status !== 'pending') {
      return false;
    }
    return true;
  });
  const filteredNotifications =
    activeTab === "all" ? visibleNotifications : visibleNotifications.filter((notification) => !notification.read)

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  // Remove colored notification icons, use a neutral icon for all
  const getNotificationIcon = () => {
    return <Bell size={18} className="text-gray-400" />;
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hr ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <div className="notifications-panel bg-white rounded-xl shadow-2xl w-[380px] max-h-[80vh] overflow-hidden flex flex-col border border-[#e5e7eb]">
      <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f7f7fa] text-[#222]">
        <h3 className="font-bold text-base tracking-wide">Notifications</h3>
        <button onClick={onClose} className="text-[#222] hover:text-[#8B75AA]">
          <X size={20} />
        </button>
      </div>

      <div className="flex border-b border-[#e5e7eb] bg-[#f7f7fa]">
        <button
          className={`flex-1 py-2 text-sm font-semibold transition-colors duration-150 ${
            activeTab === "all"
              ? "text-[#8B75AA] border-b-2 border-[#8B75AA] bg-white"
              : "text-gray-400 hover:text-[#8B75AA]"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`flex-1 py-2 text-sm font-semibold transition-colors duration-150 ${
            activeTab === "unread"
              ? "text-[#8B75AA] border-b-2 border-[#8B75AA] bg-white"
              : "text-gray-400 hover:text-[#8B75AA]"
          }`}
          onClick={() => setActiveTab("unread")}
        >
          Unread
        </button>
        <button
          className="py-2 px-4 text-sm text-gray-400 hover:text-[#8B75AA]"
          onClick={markAllAsRead}
        >
          Mark all read
        </button>
        <button
          className="py-2 px-4 text-sm text-gray-400 hover:text-[#8B75AA]"
          onClick={async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (!token) return;
            try {
              const res = await fetch('/api/notifications-proxy?clear_all=1', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              if (!res.ok) {
                const errorText = await res.text();
                alert(errorText || 'Failed to clear notifications.');
              }
              await fetchNotifications(token);
            } catch (e) {
              alert('Error clearing notifications');
            }
          }}
        >
          Clear All
        </button>
      </div>

      <div className="overflow-y-auto flex-1 bg-white">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg shadow-md my-4 mx-4 px-4 py-3 border border-[#e5e7eb] bg-[#f7f7fa] transition-all duration-150 hover:scale-[1.01] hover:border-[#8B75AA] ${
                !notification.read ? "ring-2 ring-[#8B75AA]" : ""
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getNotificationIcon()}</div>
                <div className="flex-1">
                  {/* Quest Application (for owners) with actions */}
                  {notification.type === "quest_application" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#333] text-sm">New Quest Application</span>
                        <span className="text-xs text-gray-600">{formatTime(notification.createdAt)}</span>
                      </div>
                      <div className="text-xs text-gray-700 mt-1">
                        {notification.applicant} applied for your quest '{notification.questTitle}'.
                      </div>
                      {/* No accept/reject/chat actions - notifications are read-only */}
                    </>
                  )}

                  {/* Quest Application Result (for applicants) */}
                  {notification.type === "quest_application_result" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#333] text-sm">{notification.result === "accepted" ? "Accepted!" : "Rejected"}</span>
                        <span className="text-xs text-gray-600">for quest</span>
                        <span className="font-semibold text-[#8B75AA] text-xs">{notification.questTitle || "a quest"}</span>
                        {notification.owner && <span className="text-xs text-gray-600">by {notification.owner}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{formatTime(notification.createdAt)}</div>
                      <div className="text-xs text-gray-700 mt-1">{notification.message}</div>
                      {notification.result === "rejected" && notification.reason && (
                        <div className="mt-2 text-red-500 text-xs font-semibold">Reason: {notification.reason}</div>
                      )}
                    </>
                  )}

                  {/* Kicked from Quest */}
                  {notification.type === "kicked_from_quest" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-500 text-sm">You were kicked from a quest</span>
                        <span className="font-semibold text-[#8B75AA] text-xs">{notification.questTitle || "a quest"}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{formatTime(notification.createdAt)}</div>
                      <div className="text-xs text-gray-700 mt-1">{notification.message}</div>
                      {notification.reason && (
                        <div className="mt-2 text-red-500 text-xs font-semibold">Reason: {notification.reason}</div>
                      )}
                    </>
                  )}

                  {/* Quest Disabled/Deleted by Admin */}
                  {(notification.type === "quest_disabled" || notification.type === "quest_deleted") && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-yellow-600 text-sm">{notification.type === "quest_disabled" ? "Quest Disabled" : "Quest Deleted"}</span>
                        <span className="font-semibold text-[#8B75AA] text-xs">{notification.questTitle || "a quest"}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{formatTime(notification.createdAt)}</div>
                      <div className="text-xs text-gray-700 mt-1">{notification.message}</div>
                      {notification.reason && (
                        <div className="mt-2 text-yellow-600 text-xs font-semibold">Reason: {notification.reason}</div>
                      )}
                    </>
                  )}

                  {/* Fallback for unknown notification types */}
                  {[
                    "quest_application",
                    "quest_application_result",
                    "kicked_from_quest",
                    "quest_disabled",
                    "quest_deleted"
                  ].indexOf(notification.type) === -1 && (
                    <>
                      <div className="font-semibold text-[#333] text-sm">{notification.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatTime(notification.createdAt)}</div>
                      <div className="text-xs text-gray-700 mt-1">{notification.message}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Bell className="mx-auto mb-2 text-gray-300" size={24} />
            <p>No notifications to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
