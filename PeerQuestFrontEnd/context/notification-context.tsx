"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, type Notification } from '@/lib/api/notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  currentUser: any;
}

export function NotificationProvider({ children, currentUser }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const refreshNotifications = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const [notificationsData, countData] = await Promise.all([
        getUserNotifications(),
        getUnreadNotificationCount()
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(countData.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(notif => markNotificationAsRead(notif.id))
      );
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        getUnreadNotificationCount()
          .then(data => setUnreadCount(data.count))
          .catch(error => console.error('Error fetching unread count:', error));
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser]);

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export { NotificationContext };
