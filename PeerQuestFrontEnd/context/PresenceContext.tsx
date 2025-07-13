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
    const ws = new WebSocket(`ws://localhost:8000/ws/presence/?token=${token}`);

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
