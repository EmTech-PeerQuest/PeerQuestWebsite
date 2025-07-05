"use client"

import { useState } from "react"
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react"
<<<<<<< HEAD
=======
import { useTranslation } from 'react-i18next'
>>>>>>> Profile/Settings
import type { User, Quest, Guild } from "@/lib/types"
import { UserProfileModal } from '@/components/auth/user-profile-modal'
import { MessagingModal } from '@/components/messaging/messaging-modal'

interface UserSearchProps {
  users: User[]
  quests: Quest[]
  guilds: Guild[]
  currentUser: User | null
  showToast: (message: string, type?: string) => void
}

export function UserSearch({ users, quests, guilds, currentUser, showToast }: UserSearchProps) {
<<<<<<< HEAD
=======
  const { t } = useTranslation()
>>>>>>> Profile/Settings
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"username" | "level" | "quests">("level")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string>("all")
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null)
  const [messagingUser, setMessagingUser] = useState<User | null>(null)

  // Get all unique skills from users
  const allSkills = Array.from(new Set(users.flatMap((user) => user.skills || []).filter(Boolean)))

  // Filter users based on search query and selected skill
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSkill = selectedSkill === "all" || (user.skills && user.skills.includes(selectedSkill))

    return matchesSearch && matchesSkill
  })

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue

    if (sortField === "username") {
      aValue = a.username.toLowerCase()
      bValue = b.username.toLowerCase()
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    } else if (sortField === "level") {
      aValue = a.level || 0
      bValue = b.level || 0
    } else {
      aValue = a.completedQuests?.length || 0
      bValue = b.completedQuests?.length || 0
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue
  })

  const toggleSort = (field: "username" | "level" | "quests") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleViewProfile = (user: User) => {
    setSelectedUserProfile(user)
  }

  const handleSendMessage = (user: User) => {
    if (!currentUser) {
<<<<<<< HEAD
      showToast("Please log in to send messages", "error")
=======
      showToast(t('toastMessages.pleaseLogin'), "error")
>>>>>>> Profile/Settings
      return
    }
    setMessagingUser(user)
  }

  return (
    <section className="bg-[#F4F0E6] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#2C1A1D] font-serif mb-6">Find Adventurers</h2>
        <p className="text-center text-[#8B75AA] mb-8">
          DISCOVER SKILLED ADVENTURERS TO COLLABORATE WITH ON YOUR QUESTS.
        </p>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search adventurers..."
              className="w-full px-4 py-3 pl-10 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CDAA7D]" />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <Filter size={16} className="mr-2 text-[#8B75AA]" />
              <span className="text-[#2C1A1D] font-medium mr-2">Sort by:</span>
            </div>

            <button
              className="flex items-center px-3 py-1 border border-[#CDAA7D] rounded bg-white hover:bg-[#F4F0E6]"
              onClick={() => toggleSort("username")}
            >
              <span className={sortField === "username" ? "text-[#8B75AA] font-medium" : "text-[#2C1A1D]"}>
                Username
              </span>
              {sortField === "username" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </button>

            <button
              className="flex items-center px-3 py-1 border border-[#CDAA7D] rounded bg-white hover:bg-[#F4F0E6]"
              onClick={() => toggleSort("level")}
            >
              <span className={sortField === "level" ? "text-[#8B75AA] font-medium" : "text-[#2C1A1D]"}>Level</span>
              {sortField === "level" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </button>

            <button
              className="flex items-center px-3 py-1 border border-[#CDAA7D] rounded bg-white hover:bg-[#F4F0E6]"
              onClick={() => toggleSort("quests")}
            >
              <span className={sortField === "quests" ? "text-[#8B75AA] font-medium" : "text-[#2C1A1D]"}>
                Completed Quests
              </span>
              {sortField === "quests" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </button>

            <div className="ml-auto">
              <select
                className="px-3 py-1 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="all">All Skills</option>
                {allSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-[#CDAA7D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* User Header */}
              <div className="bg-[#CDAA7D] p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-xl text-white">
                    {user.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2C1A1D]">{user.displayName || user.username}</h3>
                    <p className="text-sm text-[#2C1A1D]/70">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#8B75AA] text-white text-xs px-2 py-1 rounded-full">LVL {user.level || 1}</span>
                </div>
              </div>

              {/* User Content */}
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-[#CDAA7D]">🏆</span>
                      <span className="text-[#2C1A1D] font-medium">{user.completedQuests?.length || 0} Quests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#8B75AA]">👥</span>
                      <span className="text-[#2C1A1D] font-medium">{user.guilds?.length || 0} Guilds</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                    className="text-[#8B75AA] hover:text-[#7A6699]"
                  >
                    {expandedUserId === user.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[#2C1A1D] mb-2">Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-[#8B75AA]/10 text-[#8B75AA] rounded text-xs">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">No skills listed</span>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedUserId === user.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-[#2C1A1D] mb-2">About:</h4>
                      <p className="text-sm text-[#2C1A1D]">
                        {user.bio || "This adventurer hasn't shared their story yet."}
                      </p>
                    </div>

                    {/* Badges */}
                    {user.badges && user.badges.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-[#2C1A1D] mb-2">Badges:</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.badges.map((badge, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-2 py-1 bg-[#CDAA7D]/10 text-[#CDAA7D] rounded text-xs"
                            >
                              <span>{badge.icon}</span>
                              <span>{badge.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleViewProfile(user)}
                    className="px-3 py-1 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors text-sm"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleSendMessage(user)}
                    className="px-3 py-1 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors text-sm"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedUsers.length === 0 && (
          <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-[#2C1A1D] mb-2">No Adventurers Found</h3>
            <p className="text-[#8B75AA]">
              Try adjusting your search criteria or check back later for new adventurers.
            </p>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <UserProfileModal
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          user={selectedUserProfile}
          quests={quests}
          guilds={guilds}
          currentUser={currentUser}
        />
      )}

      {/* Messaging Modal */}
      {messagingUser && currentUser && (
        <MessagingModal
          isOpen={!!messagingUser}
          onClose={() => setMessagingUser(null)}
          recipient={messagingUser}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </section>
  )
}
