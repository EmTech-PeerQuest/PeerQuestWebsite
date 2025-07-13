import { fetchWithAuth } from "./auth";
import { API_BASE_URL } from "./utils";

export interface Notification {
  id: string;
  user: string;
  type: 'guild_application_approved' | 'guild_application_rejected' | 'guild_warned' | 'guild_disabled' | 'guild_re_enabled' | 'warning_reset';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_guild?: string;
}

export interface NotificationCreatePayload {
  user: string;
  type: string;
  title: string;
  message: string;
  related_guild?: string;
}

// Get user notifications
export async function getUserNotifications(): Promise<Notification[]> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = base.endsWith('/api')
    ? `${base}/notifications/`
    : `${base}/api/notifications/`;
  
  console.debug('[getUserNotifications] GET from', endpoint);
  
  const response = await fetchWithAuth(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch notifications' }));
    throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch notifications`);
  }

  return await response.json();
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = base.endsWith('/api')
    ? `${base}/notifications/${notificationId}/mark-read/`
    : `${base}/api/notifications/${notificationId}/mark-read/`;
  
  console.debug('[markNotificationAsRead] POST to', endpoint);
  
  const response = await fetchWithAuth(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to mark notification as read' }));
    throw new Error(errorData.detail || `HTTP ${response.status}: Failed to mark notification as read`);
  }

  return { success: true };
}

// Create notification (admin only)
export async function createNotification(payload: NotificationCreatePayload): Promise<{ success: boolean; notification?: Notification }> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = base.endsWith('/api')
    ? `${base}/notifications/`
    : `${base}/api/notifications/`;
  
  console.debug('[createNotification] POST to', endpoint, payload);
  
  const response = await fetchWithAuth(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create notification' }));
    throw new Error(errorData.detail || `HTTP ${response.status}: Failed to create notification`);
  }

  const result = await response.json();
  return { success: true, notification: result };
}

// Get unread notification count
export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = base.endsWith('/api')
    ? `${base}/notifications/unread-count/`
    : `${base}/api/notifications/unread-count/`;
  
  console.debug('[getUnreadNotificationCount] GET from', endpoint);
  
  const response = await fetchWithAuth(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to get unread count' }));
    throw new Error(errorData.detail || `HTTP ${response.status}: Failed to get unread count`);
  }

  return await response.json();
}
