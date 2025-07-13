"use client";

import { useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { useNotifications } from "@/context/notification-context";

interface NotificationDropdownProps {
  currentUser: any;
}

export function NotificationDropdown({ currentUser }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, refreshNotifications, markAsRead, markAllAsRead } = useNotifications();

  if (!currentUser) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'guild_application_approved':
        return '✅';
      case 'guild_application_rejected':
        return '❌';
      case 'guild_warned':
        return '⚠️';
      case 'guild_disabled':
        return '🚫';
      case 'guild_re_enabled':
        return '✅';
      case 'warning_reset':
        return '🔄';
      default:
        return '📢';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            refreshNotifications();
          }
        }}
        className="relative p-2 text-[#8B75AA] hover:text-[#7A6699] transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-[#2C1A1D]">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-[#2C1A1D] text-sm">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-[#8B75AA] mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-[#8B75AA] hover:text-[#7A6699] font-medium"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
