"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Calendar, Award, Users, FileText, Star, ChevronDown, User as UserIcon } from "lucide-react"
import type { User, Quest, Guild } from "@/lib/types"
import { formatJoinDate } from "@/lib/date-utils"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  quests: Quest[]
  guilds: Guild[]
  currentUser?: User | null

  defaultTab?: "overview" | "quests" | "guilds" | "achievements" | "profile"
}

export function UserProfileModal({ isOpen, onClose, user, quests, guilds, currentUser, defaultTab = "overview" }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements" | "profile">(defaultTab);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;
  if (!user) return null;

  // Calculate user stats with proper null checks
  const userQuests = (quests || []).filter((q) => q.poster?.id === user.id) || [];
  const completedQuests = (quests || []).filter((q) => q.status === "completed") || [];
  const userGuilds = (guilds || []).filter((g) => g.poster?.username === user.username) || [];
  const ownedGuilds = (guilds || []).filter((g) => g.poster?.username === user.username) || [];

  // Calculate level from XP (assuming 1000 XP per level)
  const level = Math.floor((user.xp || 0) / 1000) + 1;
  const xpForNextLevel = level * 1000;
  const xpProgress = (((user.xp || 0) % 1000) / 1000) * 100;

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser?.id === user.id;

  const tabs = isOwnProfile
    ? [
        { id: "overview", label: "Overview" },
        { id: "profile", label: "Profile" },
        { id: "quests", label: "Quests" },
        { id: "guilds", label: "Guilds" },
        { id: "achievements", label: "Achievements" },
      ]
    : [
        { id: "overview", label: "Overview" },
        { id: "quests", label: "Quests" },
        { id: "guilds", label: "Guilds" },
        { id: "achievements", label: "Achievements" },
      ];

  const currentTab = tabs.find((tab) => tab.id === activeTab);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-[#2C1A1D] to-[#8B75AA] text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Smaller Avatar */}
              <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center text-xl font-bold">
                {user.avatar || user.username?.[0]?.toUpperCase() || "U"}
              </div>

              {/* User Info */}
              <div>
                <h2 className="text-xl font-bold">{user.username || "Unknown User"}</h2>
                <p className="text-[#CDAA7D]">Level {level} Adventurer</p>

                {/* Compact Level Progress Bar */}
                <div className="mt-2 w-48">
                  <div className="flex justify-between text-xs mb-1">
                    <span>
                      XP: {user.xp || 0} / {xpForNextLevel}
                    </span>
                  </div>
                  <div className="w-full bg-[#2C1A1D] rounded-full h-1.5">
                    <div
                      className="bg-[#CDAA7D] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${xpProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Join Date */}
                <div className="flex items-center gap-2 mt-2 text-xs text-[#F4F0E6] opacity-80">
                  <Calendar size={12} />
                  <span>
                    Joined {formatJoinDate(user.createdAt || user.dateJoined)}
                  </span>
                </div>
              </div>
            </div>

            <button onClick={handleClose} className="text-white hover:text-[#CDAA7D] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Compact Stats Cards */}
        <div className="p-4 border-b border-[#CDAA7D]">
          <div className={`grid gap-3 ${isOwnProfile ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div className="bg-white rounded-lg p-3 border border-[#CDAA7D] text-center">
              <div className="text-lg font-bold text-[#8B75AA]">{completedQuests.length}</div>
              <div className="text-xs text-[#2C1A1D]">Completed</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-[#CDAA7D] text-center">
              <div className="text-lg font-bold text-[#8B75AA]">{userQuests.length}</div>
              <div className="text-xs text-[#2C1A1D]">Posted</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-[#CDAA7D] text-center">
              <div className="text-lg font-bold text-[#8B75AA]">{userGuilds.length}</div>
              <div className="text-xs text-[#2C1A1D]">Guilds</div>
            </div>
            {/* Only show gold if viewing own profile */}
            {isOwnProfile && (
              <div className="bg-white rounded-lg p-3 border border-[#CDAA7D] text-center">
                <div className="text-lg font-bold text-[#CDAA7D]">{user.gold || 0}</div>
                <div className="text-xs text-[#2C1A1D]">Gold</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Mobile Dropdown, Desktop Tabs */}
        <div className="border-b border-[#CDAA7D]">
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 text-left flex items-center justify-between bg-white border-b border-[#CDAA7D] hover:bg-[#F4F0E6] transition-colors"
              >
                <span className="font-medium text-[#2C1A1D]">{currentTab?.label}</span>
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-l border-r border-b border-[#CDAA7D] z-10">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#F4F0E6] transition-colors ${
                        activeTab === tab.id ? "bg-[#8B75AA]/10 text-[#8B75AA] font-medium" : "text-[#2C1A1D]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-[#2C1A1D] hover:text-[#8B75AA]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* ...rest of your JSX... */}
          {/* The rest of your JSX remains unchanged */}
        </div>
      </div>
    </div>
  );
}
