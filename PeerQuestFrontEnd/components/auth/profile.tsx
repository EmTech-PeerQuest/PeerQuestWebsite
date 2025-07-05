"use client"

import { useState } from "react"
import type { User, Quest, Guild } from "@/lib/types"
import { ChevronDown } from "lucide-react"

interface ProfileProps {
  currentUser: User
  quests: Quest[]
  guilds: Guild[]
  navigateToSection?: (section: string) => void
}

export function Profile({ currentUser, quests, guilds, navigateToSection }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements">("overview")
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  // Debug: log the currentUser to see what avatar data we have
  console.log('Profile component currentUser avatar:', currentUser.avatar);

  // Filter quests by status
  const activeQuests = quests.filter((q) => q.status === "in-progress" && q.assignedTo === currentUser.id)
  const createdQuests = quests.filter((q) => q.poster.id === currentUser.id)
  const completedQuests = quests.filter((q) => q.status === "completed" && q.assignedTo === currentUser.id)

  // Get user's guilds
  const userGuilds = guilds.filter((g) => g.membersList.includes(currentUser.id))

  // Calculate XP progress
  const xpForNextLevel = 1000 // Example value
  const xpProgress = ((currentUser.xp % xpForNextLevel) / xpForNextLevel) * 100

  const completeTestQuest = () => {
    if (window.updateCompletedQuests) {
      const testQuest = {
        id: Date.now(),
        title: "Write Tavern Lore",
        description: "Looking for a skilled writer to create lore and stories about the PeerQuest Tavern's history.",
        status: "completed",
        assignedTo: currentUser.id,
        xp: 250,
        reward: 400,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        completedAt: new Date(),
      }
      window.updateCompletedQuests(testQuest)
    }
  }

  const joinTestGuild = () => {
    if (window.joinGuildTest) {
      window.joinGuildTest(currentUser.id, "Mystic Brewers Guild")
    }
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "quests", label: "Quests" },
    { id: "guilds", label: "Guilds" },
    { id: "achievements", label: "Achievements" },
  ]

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
                  <span>{currentUser.xp} XP</span>
                </div>
                <div className="w-full bg-[#2C1A1D] rounded-full h-2">
                  <div className="bg-[#CDAA7D] h-2 rounded-full" style={{ width: `${xpProgress}%` }}></div>
                </div>
              </div>
            </div>

            {/* Join Date */}
            <div className="text-center sm:text-right">
              <div className="text-sm">Member since</div>
              <div>{currentUser.joinDate || "Invalid Date"}</div>
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
                    setActiveTab(tab.id as any)
                    setShowMobileMenu(false)
                  }}
                  className={`w-full px-4 py-2 text-left ${
                    activeTab === tab.id ? "bg-[#8B75AA] text-white" : "text-[#2C1A1D] hover:bg-gray-50"
                  }`}
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
              className={`px-6 py-3 font-medium transition-colors ${
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
                  <span className="font-medium">{currentUser.completedQuests || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quests Created:</span>
                  <span className="font-medium">{createdQuests.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guilds Joined:</span>
                  <span className="font-medium">{userGuilds.length || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gold:</span>
                  <span className="font-medium text-[#CDAA7D]">{currentUser.gold || 1200}</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">About</h3>
              <p className="text-gray-600 text-sm">
                {currentUser.bio || "Experienced adventurer looking for challenging quests."}
              </p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-[#CDAA7D]">
              <h3 className="font-medium mb-4">Skills</h3>
              {currentUser.skills && currentUser.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentUser.skills.map((skill, index) => (
                    <span key={index} className="bg-[#8B75AA]/10 text-[#8B75AA] px-2 py-1 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No skills listed yet.</p>
              )}
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
                      <p className="text-sm text-gray-600">
                        Looking for a skilled writer to create lore and stories about the PeerQuest Tavern's history.
                      </p>
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
                    <p className="text-sm text-gray-600">
                      Looking for a skilled writer to create lore and stories about the PeerQuest Tavern's history.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                      <span>Reward: 400 Gold</span>
                      <span>Completed: 6/3/2025</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={completeTestQuest}
                className="w-full mt-4 bg-[#8B75AA] text-white py-3 rounded hover:bg-[#7A6699] transition-colors"
              >
                Complete a Test Quest
              </button>
            </div>
          </div>
        )}

        {/* Guilds Tab */}
        {activeTab === "guilds" && (
          <div>
            {userGuilds.length > 0 || currentUser.guilds?.length ? (
              <div className="space-y-4">
                {/* Mystic Brewers Guild */}
                <div className="bg-white rounded-lg border border-[#CDAA7D] overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2C1A1D] rounded-full flex items-center justify-center text-white">
                        🧪
                      </div>
                      <div>
                        <h3 className="font-medium">Mystic Brewers Guild</h3>
                        <p className="text-sm text-[#8B75AA]">Alchemy</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm">
                      A guild dedicated to the art of potion-making and alchemy. We share recipes, techniques, and
                      collaborate on complex brewing projects.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2 text-sm">
                      <span>3 members</span>
                      <span>Created: 4/15/2023</span>
                    </div>
                  </div>
                </div>

                {/* Tavern Defenders */}
                <div className="bg-white rounded-lg border border-[#CDAA7D] overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2C1A1D] rounded-full flex items-center justify-center text-white">
                        🛡️
                      </div>
                      <div>
                        <h3 className="font-medium">Tavern Defenders</h3>
                        <p className="text-sm text-[#8B75AA]">Protection</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm">
                      The official guild for those who help protect and maintain the PeerQuest Tavern. Members get
                      priority on tavern-related quests.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2 text-sm">
                      <span>2 members</span>
                      <span>Created: 2/10/2023</span>
                    </div>
                  </div>
                </div>

                {/* Creative Crafters */}
                <div className="bg-white rounded-lg border border-[#CDAA7D] overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2C1A1D] rounded-full flex items-center justify-center text-white">
                        🎨
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Creative Crafters</h3>
                        <p className="text-sm text-[#8B75AA]">Art & Design</p>
                      </div>
                      <div className="bg-[#CDAA7D]/20 text-[#CDAA7D] text-xs px-2 py-1 rounded">Guild Master</div>
                    </div>
                    <p className="mt-3 text-sm">
                      A guild for artists, designers, and creators of all kinds. We collaborate on creative projects and
                      share techniques.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2 text-sm">
                      <span>1 member</span>
                      <span>Created: 6/20/2023</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-[#CDAA7D] text-center">
                <p className="text-gray-500 mb-6">No guilds joined yet</p>
                <button
                  onClick={joinTestGuild}
                  className="bg-[#8B75AA] text-white px-6 py-3 rounded hover:bg-[#7A6699] transition-colors"
                >
                  Join a Test Guild
                </button>
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
  )
}
