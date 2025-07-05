"use client";
import { useAuth } from "@/context/AuthContext";
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

function Profile({ currentUser, quests, guilds, navigateToSection }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements">("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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
               (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:')) && 
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
              <h2 className="text-xl sm:text-2xl font-bold">{currentUser.username || "HeroicAdventurer"}</h2>
              <p className="text-[#CDAA7D]">Novice Adventurer</p>
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
                  // Try multiple possible date field names from backend
                  const joinDate = currentUser.createdAt || 
                                 currentUser.dateJoined || 
                                 (currentUser as any).date_joined ||
                                 (currentUser as any).created_at ||
                                 (currentUser as any).dateJoined ||
                                 (currentUser as any).createdAt;
                  
                  // If we have a join date, use it
                  if (joinDate) {
                    return formatJoinDate(joinDate, { capitalizeFirst: true });
                  }
                  
                  // Fallback: Show "Recently" instead of N/A for better UX
                  return "Recently";
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Tab Dropdown */}
      <div className="sm:hidden border-b border-[#CDAA7D] bg-white">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full px-4 py-3 flex items-center justify-between text-[#2C1A1D] font-medium"
          >
            <span>{tabs.find((tab) => tab.id === activeTab)?.label}</span>
            <ChevronDown size={16} className={`transition-transform ${showMobileMenu ? "rotate-180" : ""}`} />
          </button>
          {showMobileMenu && (
            <div className="border-t border-[#CDAA7D]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left ${activeTab === tab.id ? "bg-[#8B75AA] text-white" : "text-[#2C1A1D] hover:bg-gray-50"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block border-b border-[#CDAA7D] bg-white">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.id ? "border-b-2 border-[#8B75AA] text-[#8B75AA]" : "text-[#2C1A1D] hover:text-[#8B75AA]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content Area */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Stats */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Quests Completed:</span>
                  <span className="font-medium">{currentUser.completedQuests ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quests Created:</span>
                  <span className="font-medium">{createdQuests.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guilds Joined:</span>
                  <span className="font-medium">{userGuilds.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gold:</span>
                  <span className="font-medium text-[#CDAA7D]">{currentUser.gold ?? 0}</span>
                </div>
              </div>
            </div>
            {/* About */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">About</h3>
              <p className="text-gray-600 text-sm">{currentUser.bio || "Experienced adventurer looking for challenging quests."}</p>
            </div>
            {/* Skills */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">Skills</h3>
              <p className="text-gray-500 text-sm">No skills listed yet.</p>
            </div>
            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D] md:col-span-3">
              <h3 className="font-medium mb-4">Recent Activity</h3>
              <p className="text-gray-500 text-sm">No recent activity.</p>
            </div>
          </div>
        )}
        {/* Quests Tab */}
        {activeTab === "quests" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Active Quests */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">Active Quests</h3>
              {activeQuests.length > 0 ? (
                <div className="space-y-4">
                  {activeQuests.map((quest) => (
                    <div key={quest.id} className="border-b border-[#CDAA7D] pb-4">
                      <h4 className="font-medium">{quest.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                        <span>Reward: {quest.reward} Gold</span>
                        <span>Due: {new Date(quest.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No active quests.</p>
              )}
            </div>
            {/* Created Quests */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">Created Quests</h3>
              {createdQuests.length > 0 ? (
                <div className="space-y-4">
                  {createdQuests.map((quest) => (
                    <div key={quest.id} className="border-b border-[#CDAA7D] pb-4">
                      <h4 className="font-medium">{quest.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                        <span>Reward: {quest.reward} Gold</span>
                        <span>Status: {quest.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No created quests.</p>
              )}
            </div>
            {/* Completed Quests */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">Completed Quests</h3>
              {completedQuests.length > 0 ? (
                <div className="space-y-4">
                  {completedQuests.map((quest) => (
                    <div key={quest.id} className="border-b border-[#CDAA7D] pb-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <h4 className="font-medium">{quest.title}</h4>
                        <span className="text-[#8B75AA] font-medium">{quest.xp} XP</span>
                      </div>
                      <p className="text-sm text-gray-600">Looking for a skilled writer to create lore and stories about the PeerQuest Tavern's history.</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                        <span>Completed: {new Date(quest.completedAt || Date.now()).toLocaleDateString()}</span>
                        <span className="text-blue-600 cursor-pointer">VIEW DETAILS</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="border-b border-[#CDAA7D] pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <h4 className="font-medium">WRITE TAVERN LORE</h4>
                      <span className="text-[#8B75AA] font-medium">250 XP</span>
                    </div>
                    <p className="text-sm text-gray-600">Looking for a skilled writer to create lore and stories about the PeerQuest Tavern's history.</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                      <span>Reward: 400 Gold</span>
                      <span>Completed: 6/3/2025</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Guilds Tab */}
        {activeTab === "guilds" && (
          <div>
            {userGuilds.length > 0 ? (
              <div className="space-y-4">
                {/* Example Guilds UI */}
                {userGuilds.map((guild, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-[#CDAA7D] overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2C1A1D] rounded-full flex items-center justify-center text-white">
                          {guild.emblem || "🏆"}
                        </div>
                        <div>
                          <h3 className="font-medium">{guild.name}</h3>
                          <p className="text-sm text-[#8B75AA]">{guild.specialization || "General"}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm">{guild.description || "A guild for adventurers."}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2 text-sm">
                        <span>{guild.members || 1} members</span>
                        <span>Created: {guild.createdAt ? new Date(guild.createdAt).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-[#CDAA7D] text-center">
                <p className="text-gray-500 mb-6">No guilds joined yet</p>
              </div>
            )}
          </div>
        )}
        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="bg-white rounded-lg p-6 border border-[#CDAA7D] text-center">
            <p className="text-gray-500">No achievements yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [guilds, setGuilds] = useState<Guild[] | null>(null);
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
