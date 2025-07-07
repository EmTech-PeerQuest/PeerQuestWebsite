"use client";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import type { User, Quest, Guild } from "@/lib/types";
import { Profile } from "@/components/profile/profile";

// Profile component moved to components/profile/profile.tsx
// ...existing code...

export default function ProfilePage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        // Fetch quests
        const questsRes = await fetch("/api/quests/", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        const questsData = await questsRes.json();
        // Fetch guilds
        const guildsRes = await fetch("/api/guilds/", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        const guildsData = await guildsRes.json();
        setQuests(Array.isArray(questsData) ? questsData : []);
        setGuilds(Array.isArray(guildsData) ? guildsData : []);
      } catch (e) {
        setQuests([]);
        setGuilds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user) {
    return <div className="p-4">Please log in</div>;
  }
  if (loading || quests === null || guilds === null) {
    return (
      <section className="bg-[#F4F0E6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6 animate-pulse">
          <div className="w-24 h-24 bg-[#CDAA7D] rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg" />
          <div className="h-6 w-48 bg-[#E5D8C5] rounded mb-2" />
          <div className="h-4 w-32 bg-[#E5D8C5] rounded mb-4" />
          <div className="w-full max-w-md space-y-2">
            <div className="h-3 w-full bg-[#E5D8C5] rounded" />
            <div className="h-3 w-5/6 bg-[#E5D8C5] rounded" />
            <div className="h-3 w-2/3 bg-[#E5D8C5] rounded" />
            <div className="h-3 w-1/2 bg-[#E5D8C5] rounded" />
          </div>
          <div className="h-10 w-64 bg-[#E5D8C5] rounded-lg mt-6" />
        </div>
      </section>
    );
  }
  return <Profile currentUser={user} quests={quests} guilds={guilds} />;
}
