"use client"

import { useState, useEffect, createContext, useContext } from "react";
import { UserProfileModal } from "@/components/auth/user-profile-modal";
import { QuestAPI } from "@/lib/api/quests";

const UserProfileModalContext = createContext({ open: (user: any) => {}, close: () => {} });

export function useUserProfileModal() {
  return useContext(UserProfileModalContext);
}

export function UserProfileModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [guilds, setGuilds] = useState<any[]>([]); // TODO: implement guilds fetch if needed

  useEffect(() => {
    function handleOpen(e: any) {
      setUser(e.detail.user);
      setIsOpen(true);
      // Fetch quests for this user
      QuestAPI.getQuests({ creator: e.detail.user.id })
        .then(res => setQuests(res.results || []))
        .catch(() => setQuests([]));
      // TODO: fetch guilds if needed
    }
    window.addEventListener("openUserProfileModal", handleOpen);
    return () => window.removeEventListener("openUserProfileModal", handleOpen);
  }, []);

  const close = () => setIsOpen(false);
  const open = (user: any) => {
    setUser(user);
    setIsOpen(true);
  };

  return (
    <UserProfileModalContext.Provider value={{ open, close }}>
      {children}
      <UserProfileModal
        isOpen={isOpen}
        onClose={close}
        user={user}
        quests={quests}
        guilds={guilds}
      />
    </UserProfileModalContext.Provider>
  );
}
