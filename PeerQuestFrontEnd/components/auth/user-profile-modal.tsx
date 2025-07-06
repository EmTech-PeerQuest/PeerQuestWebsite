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
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements" | "profile">(defaultTab)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [forceOpen, setForceOpen] = useState(false)

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  // If modal is closed, clear hash
  const handleClose = () => {
    onClose()
    setForceOpen(false)
  }

  // Show modal if isOpen or forceOpen
  if (!isOpen && !forceOpen) return null

  // Calculate user stats with proper null checks
  const userQuests = (quests || []).filter((q) => q.poster?.id === user.id) || []
  const completedQuests = (quests || []).filter((q) => q.status === "completed") || []
  const userGuilds = (guilds || []).filter((g) => g.poster?.username === user.username) || []
  const ownedGuilds = (guilds || []).filter((g) => g.poster?.username === user.username) || []

  // Calculate level from XP (assuming 1000 XP per level)
  const level = Math.floor((user.xp || 0) / 1000) + 1
  const xpForNextLevel = level * 1000
  const xpProgress = (((user.xp || 0) % 1000) / 1000) * 100

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser?.id === user.id

  const tabs = isOwnProfile ? [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "quests", label: "Quests" },
    { id: "guilds", label: "Guilds" },
    { id: "achievements", label: "Achievements" },
  ] : [
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

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Bio Section */}
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-2">About</h3>
                <p className="text-[#2C1A1D]">
                  {user.bio || "This adventurer hasn't shared their story yet."}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-[#8B75AA]" />
                    <h4 className="font-medium text-[#2C1A1D]">Guild Activity</h4>
                  </div>
                  <p className="text-sm text-[#2C1A1D]">
                    Member of {userGuilds.length} guild{userGuilds.length !== 1 ? 's' : ''}
                  </p>
                  {ownedGuilds.length > 0 && (
                    <p className="text-sm text-[#2C1A1D]">
                      Leads {ownedGuilds.length} guild{ownedGuilds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={16} className="text-[#8B75AA]" />
                    <h4 className="font-medium text-[#2C1A1D]">Achievements</h4>
                  </div>
                  <p className="text-sm text-[#2C1A1D]">
                    {completedQuests.length} quest{completedQuests.length !== 1 ? 's' : ''} completed
                  </p>
                </div>
              </div>

              {/* Location */}
              {user.location && (
                <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#8B75AA]" />
                    <span className="text-[#2C1A1D]">{user.location}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "quests" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#2C1A1D]">Quest History</h3>
                <div className="flex gap-2">
                  <span className="text-sm text-[#8B75AA]">
                    Posted: {userQuests.length}
                  </span>
                  <span className="text-sm text-[#8B75AA]">
                    Completed: {completedQuests.length}
                  </span>
                </div>
              </div>

              {userQuests.length === 0 && completedQuests.length === 0 ? (
                <div className="text-center py-8 text-[#2C1A1D]">
                  <FileText size={48} className="mx-auto mb-4 text-[#CDAA7D]" />
                  <p>No quest activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Show most recent quests */}
                  {[...userQuests, ...completedQuests].slice(0, 5).map((quest) => (
                    <div key={quest.id} className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-[#2C1A1D]">{quest.title}</h4>
                          <p className="text-sm text-[#2C1A1D] opacity-70">{quest.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#CDAA7D] font-medium">
                            {quest.reward} gold
                          </div>
                          <div className="text-xs text-[#2C1A1D] opacity-50">
                            {quest.poster?.id === user.id ? "Posted" : "Completed"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "guilds" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#2C1A1D]">Guild Memberships</h3>
                <span className="text-sm text-[#8B75AA]">
                  {userGuilds.length} guild{userGuilds.length !== 1 ? 's' : ''}
                </span>
              </div>

              {userGuilds.length === 0 ? (
                <div className="text-center py-8 text-[#2C1A1D]">
                  <Users size={48} className="mx-auto mb-4 text-[#CDAA7D]" />
                  <p>Not a member of any guilds yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userGuilds.map((guild) => (
                    <div key={guild.id} className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-[#2C1A1D]">{guild.name}</h4>
                          <p className="text-sm text-[#2C1A1D] opacity-70">{guild.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#2C1A1D]">
                            {guild.members || 0} members
                          </div>
                          {guild.poster?.username === user.username && (
                            <div className="text-xs text-[#8B75AA] font-medium">Leader</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-4">
              <h3 className="font-bold text-[#2C1A1D]">Achievements</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Basic achievements based on stats */}
                <div className={`bg-white rounded-lg p-4 border border-[#CDAA7D] ${completedQuests.length >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} className="text-[#CDAA7D]" />
                    <h4 className="font-medium text-[#2C1A1D]">First Quest</h4>
                  </div>
                  <p className="text-sm text-[#2C1A1D]">Complete your first quest</p>
                </div>
                
                <div className={`bg-white rounded-lg p-4 border border-[#CDAA7D] ${completedQuests.length >= 5 ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={16} className="text-[#CDAA7D]" />
                    <h4 className="font-medium text-[#2C1A1D]">Quest Master</h4>
                  </div>
                  <p className="text-sm text-[#2C1A1D]">Complete 5 quests</p>
                </div>
                
                <div className={`bg-white rounded-lg p-4 border border-[#CDAA7D] ${userGuilds.length >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-[#CDAA7D]" />
                    <h4 className="font-medium text-[#2C1A1D]">Guild Member</h4>
                  </div>
                  <p className="text-sm text-[#2C1A1D]">Join your first guild</p>
                </div>
                
                <div className={`bg-white rounded-lg p-4 border border-[#CDAA7D] ${ownedGuilds.length >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={16} className="text-[#CDAA7D]" />
                    <h4 className="font-medium text-[#2C1A1D]">Guild Leader</h4>
                  </div>
                  <p className="text-sm text-[#2C1A1D]">Create your first guild</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && isOwnProfile && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
                <h3 className="font-bold text-[#2C1A1D] mb-4 flex items-center gap-2">
                  <UserIcon size={16} />
                  Edit Profile
                </h3>
                
                {/* Profile Photo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-[#CDAA7D] rounded-full flex items-center justify-center text-2xl font-bold">
                      {user.avatar || user.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <button className="bg-[#8B75AA] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#8B75AA]/90 transition-colors">
                        Change Photo
                      </button>
                      <p className="text-xs text-[#2C1A1D] opacity-70 mt-1">JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-1">Display Name</label>
                    <input
                      type="text"
                      defaultValue={user.displayName || user.username}
                      className="w-full px-3 py-2 border border-[#CDAA7D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-1">Bio</label>
                    <textarea
                      defaultValue={user.bio || ""}
                      rows={3}
                      className="w-full px-3 py-2 border border-[#CDAA7D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                      placeholder="Tell other adventurers about yourself..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-1">Location</label>
                    <input
                      type="text"
                      defaultValue={user.location || ""}
                      className="w-full px-3 py-2 border border-[#CDAA7D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                      placeholder="Where are you adventuring from?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-1">Website</label>
                    <input
                      type="url"
                      defaultValue={user.socialLinks?.website || ""}
                      className="w-full px-3 py-2 border border-[#CDAA7D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button className="bg-[#8B75AA] text-white px-6 py-2 rounded-lg hover:bg-[#8B75AA]/90 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
