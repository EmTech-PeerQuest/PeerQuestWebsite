import { useEffect, useState } from "react";
import MessagingSystem from "@/components/messaging/messaging-system";
import { getSessionUser } from "@/lib/api/auth";
import type { User } from "@/lib/types";

/**
 * MessagesPage component that initializes the messaging system.
 * It fetches the current user and sets up the messaging system with online users.
 */
export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, "online" | "idle" | "offline">>(new Map());

  // Optional: Basic toast fallback
  const showToast = (message: string, type?: string) => {
    console.log(`[${type || "info"}] ${message}`);
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getSessionUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }

    fetchUser();
  }, []);

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading user...
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <MessagingSystem
        currentUser={currentUser}
        showToast={showToast}
        onlineUsers={onlineUsers}  // Ensure this is correctly passed to MessagingSystem
      />
    </div>
  );
}
