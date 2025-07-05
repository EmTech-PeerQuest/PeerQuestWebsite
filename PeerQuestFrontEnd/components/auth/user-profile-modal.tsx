"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Calendar, Award, Users, FileText, Star, ChevronDown } from "lucide-react"
import type { User, Quest, Guild } from "@/lib/types"
import { formatJoinDate } from "@/lib/date-utils"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  quests: Quest[]
  guilds: Guild[]
  currentUser?: User | null
}

export function UserProfileModal({ isOpen, onClose, user, quests, guilds, currentUser }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements">("overview")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [forceOpen, setForceOpen] = useState(false)

  // Auto-open modal if hash starts with #settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash.startsWith("#settings")) {
        setForceOpen(true)
      }
    }
  }, [])

  // If modal is closed, clear hash if it was settings
  const handleClose = () => {
    if (typeof window !== "undefined" && window.location.hash.startsWith("#settings")) {
      window.location.hash = ""
    }
    onClose()
    setForceOpen(false)
  }

  // Show modal if isOpen or forceOpen
  if (!isOpen && !forceOpen) return null

  // Calculate user stats with proper null checks
  const userQuests = (quests || []).filter((q) => q.poster?.id === user.id) || []
  const completedQuests = (quests || []).filter((q) => q.assignedTo === user.id && q.status === "completed") || []
  const userGuilds = (guilds || []).filter((g) => g.membersList?.includes(user.id)) || []
  const ownedGuilds = (guilds || []).filter((g) => g.poster?.id === user.id) || []

  // Calculate level from XP (assuming 1000 XP per level)
  const level = Math.floor((user.xp || 0) / 1000) + 1
  const xpForNextLevel = level * 1000
  const xpProgress = (((user.xp || 0) % 1000) / 1000) * 100

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser?.id === user.id

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "quests", label: "Quests" },
    { id: "guilds", label: "Guilds" },
    { id: "achievements", label: "Achievements" },
  ]

  const currentTab = tabs.find((tab) => tab.id === activeTab)

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

        {/* Compact Content Area */}
        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* About */}
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
                  <Users size={16} />
                  About
                </h3>
                <p className="text-[#2C1A1D] text-sm">{user.bio || "This adventurer hasn't written a bio yet."}</p>

                {user.location && (
                  <div className="flex items-center gap-2 mt-3 text-[#8B75AA]">
                    <MapPin size={14} />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
                  <Award size={16} />
                  Skills
                </h3>
                {user.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-[#8B75AA]/10 text-[#8B75AA] px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No skills listed yet.</p>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {completedQuests.slice(0, 3).map((quest) => (
                    <div key={quest.id} className="flex items-center gap-3 p-2 bg-[#F4F0E6] rounded">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Star size={12} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#2C1A1D] text-sm">Completed: {quest.title}</p>
                        <p className="text-xs text-[#8B75AA]">
                          {quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : "Recently"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {completedQuests.length === 0 && <p className="text-gray-500 text-sm">No recent activity.</p>}
                </div>
              </div>
            </div>
          )}

          {/* Quests Tab */}
          {activeTab === "quests" && (
            <div className="space-y-4">
              {/* Completed Quests */}
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-3">Completed Quests ({completedQuests.length})</h3>
                {completedQuests.length > 0 ? (
                  <div className="space-y-3">
                    {completedQuests.map((quest) => (
                      <div key={quest.id} className="border-b border-[#CDAA7D] pb-2 last:border-b-0">
                        <h4 className="font-medium text-[#2C1A1D] text-sm">{quest.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{quest.description}</p>
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <span className="text-[#8B75AA]">
                            {quest.xp} XP • {quest.reward} Gold
                          </span>
                          <span className="text-gray-500">
                            {quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : "Recently"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No completed quests yet.</p>
                )}
              </div>

              {/* Posted Quests */}
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-3">Posted Quests ({userQuests.length})</h3>
                {userQuests.length > 0 ? (
                  <div className="space-y-3">
                    {userQuests.map((quest) => (
                      <div key={quest.id} className="border-b border-[#CDAA7D] pb-2 last:border-b-0">
                        <h4 className="font-medium text-[#2C1A1D] text-sm">{quest.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{quest.description}</p>
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <span className="text-[#8B75AA]">Reward: {quest.reward} Gold</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              quest.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : quest.status === "in-progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {quest.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No quests posted yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Guilds Tab */}
          {activeTab === "guilds" && (
            <div className="space-y-4">
              {/* Owned Guilds */}
              {ownedGuilds.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                  <h3 className="font-bold text-[#2C1A1D] mb-3">Owned Guilds ({ownedGuilds.length})</h3>
                  <div className="space-y-2">
                    {ownedGuilds.map((guild) => (
                      <div key={guild.id} className="flex items-center gap-3 p-2 bg-[#F4F0E6] rounded">
                        <div className="text-lg">{guild.emblem}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-[#2C1A1D] text-sm">{guild.name}</h4>
                          <p className="text-xs text-[#8B75AA]">{guild.specialization}</p>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          <div>{guild.members} members</div>
                          <div className="text-[#CDAA7D] font-medium">Owner</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Joined Guilds */}
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-3">Joined Guilds ({userGuilds.length})</h3>
                {userGuilds.length > 0 ? (
                  <div className="space-y-2">
                    {userGuilds.map((guild) => (
                      <div key={guild.id} className="flex items-center gap-3 p-2 bg-[#F4F0E6] rounded">
                        <div className="text-lg">{guild.emblem}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-[#2C1A1D] text-sm">{guild.name}</h4>
                          <p className="text-xs text-[#8B75AA]">{guild.specialization}</p>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          <div>{guild.members} members</div>
                          <div>Member</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Not a member of any guilds yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <div className="bg-white rounded-lg p-4 border border-[#CDAA7D] text-center">
              <Award size={32} className="mx-auto text-[#8B75AA] mb-3" />
              <h3 className="font-bold text-[#2C1A1D] mb-2">Achievements Coming Soon</h3>
              <p className="text-gray-500 text-sm">Achievement system will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
