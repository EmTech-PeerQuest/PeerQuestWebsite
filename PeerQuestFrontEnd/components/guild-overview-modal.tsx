"use client"

import { useState } from "react"
import { X, Users, Crown, MessageCircle, Settings, DollarSign, Star, ChevronDown } from "lucide-react"
import type { Guild, User } from "@/lib/types"

interface GuildOverviewModalProps {
  isOpen: boolean
  onClose: () => void
  guild: Guild
  currentUser: User | null
  onJoinGuild: (guildId: number, message: string) => void
  onOpenChat: (guildId: number) => void
  onOpenSettings?: (guildId: number) => void
  showToast: (message: string, type?: string) => void
}

export function GuildOverviewModal({
  isOpen,
  onClose,
  guild,
  currentUser,
  onJoinGuild,
  onOpenChat,
  onOpenSettings,
  showToast,
}: GuildOverviewModalProps) {
  const [activeTab, setActiveTab] = useState<"about" | "members" | "chat">("about")
  const [joinMessage, setJoinMessage] = useState("")
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  if (!isOpen) return null

  const isOwner = currentUser && guild.poster.id === currentUser.id
  const isAdmin = currentUser && guild.admins.includes(currentUser.id)
  const isMember = currentUser && guild.membersList.includes(currentUser.id)
  const canManage = isOwner || isAdmin

  const handleJoinClick = () => {
    if (!currentUser) {
      showToast("Please log in to join guilds", "error")
      return
    }

    if (guild.settings?.joinRequirements?.manualApproval) {
      setShowJoinForm(true)
    } else {
      onJoinGuild(guild.id, "")
      onClose()
    }
  }

  const handleJoinSubmit = () => {
    if (joinMessage.trim()) {
      onJoinGuild(guild.id, joinMessage)
      setShowJoinForm(false)
      setJoinMessage("")
      onClose()
    }
  }

  const tabs = [
    { id: "about", label: "About" },
    { id: "members", label: `Members (${guild.members})` },
    ...(isMember ? [{ id: "chat", label: "Chat" }] : []),
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="bg-[#2C1A1D] text-white p-3 sm:p-4 relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-white hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#CDAA7D] rounded-lg flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
              {guild.emblem}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold mb-1 truncate">{guild.name}</h2>
              <p className="text-gray-300 text-xs sm:text-sm line-clamp-2">{guild.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {guild.members}
                </span>
                <span className="flex items-center gap-1">
                  <Crown size={12} />
                  {guild.poster.username}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {!isMember && currentUser && (
              <button
                onClick={handleJoinClick}
                className="px-3 py-1.5 bg-[#8B75AA] text-white rounded text-sm hover:bg-[#7A6699] transition-colors"
              >
                Join Guild
              </button>
            )}
            {isMember && (
              <button
                onClick={() => onOpenChat(guild.id)}
                className="px-3 py-1.5 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm hover:bg-[#B8956A] transition-colors flex items-center gap-1"
              >
                <MessageCircle size={14} />
                Chat
              </button>
            )}
            {canManage && onOpenSettings && (
              <button
                onClick={() => onOpenSettings(guild.id)}
                className="px-3 py-1.5 border border-white text-white rounded text-sm hover:bg-white hover:text-[#2C1A1D] transition-colors flex items-center gap-1"
              >
                <Settings size={14} />
                Manage
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Dropdown */}
        <div className="sm:hidden border-b border-[#CDAA7D] bg-white">
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
                  className={`w-full px-4 py-2 text-left text-sm ${
                    activeTab === tab.id ? "bg-[#8B75AA] text-white" : "text-[#2C1A1D] hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex border-b border-[#CDAA7D] bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-[#8B75AA] border-b-2 border-[#8B75AA] bg-white"
                  : "text-[#2C1A1D] hover:text-[#8B75AA] hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {activeTab === "about" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border border-[#CDAA7D]">
                  <h4 className="font-medium text-[#2C1A1D] mb-1 text-sm">Specialization</h4>
                  <p className="text-[#8B75AA] text-sm">{guild.specialization}</p>
                </div>
                <div className="bg-white p-3 rounded border border-[#CDAA7D]">
                  <h4 className="font-medium text-[#2C1A1D] mb-1 text-sm">Category</h4>
                  <p className="text-[#8B75AA] text-sm">{guild.category}</p>
                </div>
                <div className="bg-white p-3 rounded border border-[#CDAA7D]">
                  <h4 className="font-medium text-[#2C1A1D] mb-1 text-sm">Guild Funds</h4>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-yellow-500" />
                    <span className="text-[#8B75AA] font-medium text-sm">{guild.funds || 0} Gold</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-[#CDAA7D]">
                  <h4 className="font-medium text-[#2C1A1D] mb-1 text-sm">Join Requirements</h4>
                  <p className="text-[#8B75AA] text-sm">
                    {guild.settings?.joinRequirements?.manualApproval ? "Manual Approval" : "Open to All"}
                  </p>
                </div>
              </div>

              {guild.shout && (
                <div className="bg-white p-3 rounded border border-[#CDAA7D]">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-yellow-400" />
                    <span className="font-medium text-sm">Guild Announcement</span>
                  </div>
                  <p className="text-gray-700 text-sm">{guild.shout.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    by {guild.shout.authorName} • {new Date(guild.shout.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {guild.socialLinks && guild.socialLinks.length > 0 && (
                <div>
                  <h3 className="font-medium text-[#2C1A1D] mb-2">Social Links</h3>
                  <div className="space-y-2">
                    {guild.socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 bg-white border border-[#CDAA7D] rounded hover:bg-gray-50 transition-colors text-sm truncate"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-3">
              {/* Owner */}
              <div className="flex items-center gap-3 p-3 bg-white border border-[#CDAA7D] rounded">
                <div className="w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {guild.poster.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2C1A1D] text-sm truncate">{guild.poster.username}</p>
                  <p className="text-xs text-[#8B75AA]">Guild Owner</p>
                </div>
                <Crown size={16} className="text-yellow-500 flex-shrink-0" />
              </div>

              {/* Admins */}
              {guild.admins
                .filter((adminId) => adminId !== guild.poster.id)
                .map((adminId) => (
                  <div key={adminId} className="flex items-center gap-3 p-3 bg-white border border-[#CDAA7D] rounded">
                    <div className="w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2C1A1D] text-sm">Admin {adminId}</p>
                      <p className="text-xs text-[#8B75AA]">Administrator</p>
                    </div>
                    <Star size={16} className="text-blue-500 flex-shrink-0" />
                  </div>
                ))}

              {/* Regular Members */}
              {guild.membersList
                .filter((memberId) => memberId !== guild.poster.id && !guild.admins.includes(memberId))
                .slice(0, 8)
                .map((memberId) => (
                  <div key={memberId} className="flex items-center gap-3 p-3 bg-white border border-[#CDAA7D] rounded">
                    <div className="w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      M
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2C1A1D] text-sm">Member {memberId}</p>
                      <p className="text-xs text-[#8B75AA]">Member</p>
                    </div>
                  </div>
                ))}

              {guild.membersList.length > 11 && (
                <p className="text-center text-[#8B75AA] py-2 text-sm">
                  and {guild.membersList.length - 11} more members...
                </p>
              )}
            </div>
          )}

          {activeTab === "chat" && isMember && (
            <div className="text-center py-8">
              <MessageCircle size={48} className="mx-auto mb-4 text-[#CDAA7D]" />
              <p className="text-[#8B75AA] mb-4">Guild chat will open in a separate window</p>
              <button
                onClick={() => onOpenChat(guild.id)}
                className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors"
              >
                Open Guild Chat
              </button>
            </div>
          )}
        </div>

        {/* Join Form Modal */}
        {showJoinForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-sm">
              <h3 className="text-lg font-bold text-[#2C1A1D] mb-3">Join Guild Application</h3>
              <p className="text-[#2C1A1D] mb-3 text-sm">
                This guild requires manual approval. Please tell us why you want to join:
              </p>
              <textarea
                className="w-full px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA] h-20 resize-none mb-4 text-sm"
                placeholder="I want to join because..."
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 px-3 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinSubmit}
                  className="flex-1 px-3 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors text-sm"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
