import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface RecentActivityProps {
  userId: string | number;
}

interface Notification {
  id?: string | number;
  icon?: string;
  title?: string;
  message?: string;
  text?: string;
  timestamp?: string;
}


const RecentActivity: React.FC<RecentActivityProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const fetchNotifications = async () => {
      try {
        let notifs: Notification[] = [];
        // If this is the logged-in user, use the notifications-proxy endpoint (matches notifications panel)
        if (user && String(user.id) === String(userId)) {
          const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
          if (!token) {
            setNotifications([]);
            setError("No recent activity found for this user.");
            setLoading(false);
            return;
          }
          const res = await fetch("/api/notifications-proxy", {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!res.ok) throw new Error("Could not load recent activity.");
          const data = await res.json();
          notifs = Array.isArray(data) ? data : [];
          // Map to Notification type if needed
          notifs = notifs.map((n: any) => ({
            id: n.id,
            icon: "🔔",
            title: n.title || n.message || n.text,
            message: n.message,
            text: n.text,
            timestamp: n.created_at || n.timestamp,
          }));
        } else {
          // Fallback to user-specific endpoints for other users
          let res;
          try {
            res = await api.get(`/users/${userId}/notifications/`);
          } catch (err: any) {
            if (err?.response?.status === 404) {
              setError("No recent activity found for this user.");
              setNotifications([]);
              setLoading(false);
              return;
            }
            res = await api.get(`/api/notifications/?user_id=${userId}`);
          }
          if (Array.isArray(res.data?.results)) {
            notifs = res.data.results;
          } else if (Array.isArray(res.data)) {
            notifs = res.data;
          } else if (Array.isArray(res.data?.notifications)) {
            notifs = res.data.notifications;
          }
        }
        // Sort by timestamp descending (most recent first)
        notifs = notifs
          .filter(n => n.timestamp)
          .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
        // Enforce a queue of 5: if more than 5, remove oldest
        if (notifs.length > 5) {
          notifs = notifs.slice(0, 5);
        }
        setNotifications(notifs);
      } catch (err: any) {
        setError("Could not load recent activity.");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [userId, user]);

  if (loading) {
    return <p className="text-[#2C1A1D]/60 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">Loading recent activity...</p>;
  }
  if (error) {
    return <p className="text-red-500 text-sm bg-red-50 rounded-2xl p-3 border border-red-200">{error}</p>;
  }
  if (!notifications.length) {
    return <p className="text-[#2C1A1D]/60 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">No recent activity to display.</p>;
  }
  return (
    <ul className="space-y-2">
      {notifications.map((notif, idx) => (
        <li key={notif.id || idx} className="flex items-start gap-2 bg-[#fff7e0]/60 rounded-2xl p-3 border border-[#CDAA7D]/20">
          <span className="text-xl mr-2">{notif.icon || "🔔"}</span>
          <div>
            <div className="font-medium text-[#2C1A1D]">{notif.title || notif.message || notif.text || "Notification"}</div>
            {notif.timestamp && (
              <div className="text-xs text-[#8B75AA]">{new Date(notif.timestamp).toLocaleString()}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default RecentActivity;
