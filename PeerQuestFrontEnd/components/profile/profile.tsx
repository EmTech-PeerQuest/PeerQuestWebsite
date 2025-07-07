"use client";
import { useState, useEffect } from "react";
import type { User, Quest, Guild } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { formatJoinDate } from "@/lib/date-utils";

interface ProfileProps {
  currentUser: User;
  quests: Quest[];
  guilds: Guild[];
  navigateToSection?: (section: string) => void;
}

export function Profile({ currentUser, quests, guilds, navigateToSection }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements">("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Handle URL hash for tab selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && tabs.some((tab) => tab.id === hash)) {
        setActiveTab(hash as any);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  // Filter quests by status
  const activeQuests = quests.filter((q) => q.status === "in_progress" && q.poster?.id === currentUser.id);
  const createdQuests = quests.filter((q) => q.poster?.id === currentUser.id);
  const completedQuests = quests.filter((q) => q.status === "completed" && q.poster?.id === currentUser.id);

  // Get user's guilds
  const userGuilds = guilds.filter((g) => Array.isArray(g.members) && g.members > 0);

  // Calculate XP progress
  const xpForNextLevel = 1000; // Example value
  const xpProgress = ((currentUser.xp ?? 0) % xpForNextLevel) / xpForNextLevel * 100;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "quests", label: "Quests" },
    { id: "guilds", label: "Guilds" },
    { id: "achievements", label: "Achievements" },
  ];

  return (
    <section className="bg-[#F4F0E6] min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[#2C1A1D] to-[#8B75AA] text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#CDAA7D] rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0 overflow-hidden relative">
              {currentUser.avatar &&
                (currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("data:")) &&
                !avatarError ? (
                <img
                  src={currentUser.avatar}
                  alt={`${currentUser.username}'s avatar`}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-[#2C1A1D] select-none text-center">
                  {currentUser.username?.[0]?.toUpperCase() || "H"}
                </span>
              )}
            </div>
            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{currentUser.username || "HeroicAdventurer"}</h2>
                  <p className="text-[#CDAA7D]">Novice Adventurer</p>
                </div>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="bg-[#CDAA7D] text-[#2C1A1D] px-4 py-2 rounded-lg hover:bg-[#B89A6D] transition-colors text-sm font-medium"
                >
                  Settings
                </button>
              </div>
              {/* Level Bar */}
              <div className="mt-4 max-w-md mx-auto sm:mx-0">
                <div className="flex justify-between text-sm mb-1">
                  <span>Level</span>
                  <span>{currentUser.xp ?? 0} XP</span>
                </div>
                <div className="w-full bg-[#2C1A1D] rounded-full h-2">
                  <div className="bg-[#CDAA7D] h-2 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                </div>
              </div>
            </div>
            {/* Join Date */}
            <div className="text-center sm:text-right">
              <div className="text-sm">Member since</div>
              <div>
                {(() => {
                  const joinDate = currentUser.createdAt ||
                    currentUser.dateJoined ||
                    (currentUser as any).date_joined ||
                    (currentUser as any).created_at ||
                    (currentUser as any).dateJoined ||
                    (currentUser as any).createdAt;
                  if (joinDate) {
                    return formatJoinDate(joinDate, { capitalizeFirst: true });
                  }
                  return "Recently";
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabs and Content Area would go here (restore as needed) */}
    </section>
  );
}
