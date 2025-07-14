import React, { createContext, useContext, useState, useEffect } from "react";

type PresenceMap = Map<string, "online" | "idle" | "offline">;

const PresenceContext = createContext<{
  onlineUsers: PresenceMap;
  setOnlineUsers: React.Dispatch<React.SetStateAction<PresenceMap>>;
}>({
  onlineUsers: new Map(),
  setOnlineUsers: () => {},
});

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceMap>(new Map());

  useEffect(() => {
    // Pass token for authentication if required
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    // --- Dynamic WebSocket URL construction ---
    // Use wss:// if served over HTTPS, otherwise ws://
    // Use NEXT_PUBLIC_WS_BASE_URL if defined, else fallback to window.location.host
    let wsProtocol = 'ws:';
    let wsHost = '';
    if (typeof window !== 'undefined') {
      wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsHost = process.env.NEXT_PUBLIC_WS_BASE_URL?.trim()
        ? process.env.NEXT_PUBLIC_WS_BASE_URL.trim().replace(/\/$/, '')
        : window.location.host;
    } else {
      // SSR fallback (should not connect on server, but just in case)
      wsProtocol = process.env.NEXT_PUBLIC_WS_BASE_URL?.startsWith('https') ? 'wss:' : 'ws:';
      wsHost = process.env.NEXT_PUBLIC_WS_BASE_URL?.trim() || 'localhost:8000';
    }
    const wsUrl = `${wsProtocol}//${wsHost}/ws/presence/?token=${token}`;
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.debug('[WS][Presence] Connecting to:', wsUrl, {
        wsProtocol,
        wsHost,
        NEXT_PUBLIC_WS_BASE_URL: process.env.NEXT_PUBLIC_WS_BASE_URL,
        location: window.location.href,
      });
    }
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "presence_update") {
          setOnlineUsers((prev) => {
            const updated = new Map(prev);
            updated.set(data.user_id, data.is_online ? "online" : "offline");
            return updated;
          });
        }
      } catch (e) {
        // Ignore
      }
    };

    return () => ws.close();
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers, setOnlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
