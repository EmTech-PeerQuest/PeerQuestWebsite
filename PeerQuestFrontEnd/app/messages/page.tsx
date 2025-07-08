"use client"

import { useState } from "react";
import MessagingSystem from "@/components/messaging/messaging-system";
import type { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

/**
 * MessagesPage component that initializes the messaging system.
 */
export default function MessagesPage() {
  const { user: currentUser, token } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, "online" | "idle" | "offline">>(
    new Map()
  );

  // Optional: Basic toast fallback
  const showToast = (message: string, type?: string) => {
    console.log(`[${type || "info"}] ${message}`);
  };

  // Wait until both user and token are available
  if (!currentUser || !token) {
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
        token={token}
        showToast={showToast}
        onlineUsers={onlineUsers}
      />
    </div>
  );
}
