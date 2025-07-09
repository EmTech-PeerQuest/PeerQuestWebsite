"use client"

import { useState, useEffect } from "react"
import { X, Users, Crown, MessageCircle, Settings, DollarSign, Star, ChevronDown } from "lucide-react"
import type { Guild, User, GuildMembership } from "@/lib/types"
import { guildApi } from "@/lib/api/guilds"

interface GuildOverviewModalProps {
  isOpen: boolean
  onClose: () => void
  guild: Guild
  currentUser: User | null
  onJoinGuild: (guildId: number, message: string) => void
  onOpenChat: (guildId: number) => void
  onOpenSettings?: (guildId: number) => void
  onManageGuild?: (guild: Guild) => void
  showToast: (message: string, type?: string) => void
  isOwnedGuild?: boolean // Add prop to specify if this is an owned guild
}

export function GuildOverviewModal({
  isOpen,
  onClose,
  guild,
  currentUser,
  onJoinGuild,
  onOpenChat,
  onOpenSettings,
  onManageGuild,
  showToast,
  isOwnedGuild = false,
}: GuildOverviewModalProps) {
  const [activeTab, setActiveTab] = useState<"about" | "members" | "chat">("about")
  const [joinMessage, setJoinMessage] = useState("")
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [guildMembers, setGuildMembers] = useState<GuildMembership[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  if (!isOpen) return null

  // Use the isOwnedGuild prop to determine management capabilities, 
  // fallback to checking guild ownership for backwards compatibility
  const isOwner = isOwnedGuild || (currentUser && (
    String(guild.owner?.id) === String(currentUser.id) || 
    guild.poster?.username === currentUser.username
  ))
  const isAdmin = false // For now, we'll focus on ownership
  const isMember = currentUser && guildMembers.some(membership => 
    String(membership.user.id) === String(currentUser.id) && 
    membership.status === 'approved' && 
    membership.is_active
  )
  const canManage = isOwner

  // Fetch guild members when modal opens
  useEffect(() => {
    if (isOpen && guild.guild_id) {
      fetchGuildMembers()
    }
  }, [isOpen, guild.guild_id])

  const fetchGuildMembers = async () => {
    setLoadingMembers(true)
    try {
      const members = await guildApi.getGuildMembers(guild.guild_id)
      setGuildMembers(members)
    } catch (error) {
      console.error('Failed to fetch guild members:', error)
      showToast('Failed to load guild members', 'error')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleJoinClick = async () => {
    if (!currentUser) {
      showToast("Please log in to join guilds", "error")
      return
    }

    if (guild.require_approval) {
      setShowJoinForm(true)
    } else {
      const guildId = (guild.id || guild.guild_id) as number
      if (guildId) {
        try {
          await onJoinGuild(guildId, "")
          // Refresh guild members to update membership status
          await fetchGuildMembers()
          onClose()
        } catch (error) {
          console.error('Failed to join guild:', error)
          showToast('Failed to join guild. Please try again.', 'error')
        }
      }
    }
  }

  const handleJoinSubmit = async () => {
    if (joinMessage.trim()) {
      const guildId = (guild.id || guild.guild_id) as number
      if (guildId) {
        try {
          await onJoinGuild(guildId, joinMessage)
          setShowJoinForm(false)
          setJoinMessage("")
          // Refresh guild members to update membership status
          await fetchGuildMembers()
          onClose()
        } catch (error) {
          console.error('Failed to join guild:', error)
          showToast('Failed to join guild. Please try again.', 'error')
        }
      }
    }
  }

  const tabs = [
    { id: "about", label: "About" },
    { id: "members", label: `Members (${guildMembers.length})` },
    ...(isMember ? [{ id: "chat", label: "Chat" }] : []),
  ]

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-[#F4F0E6] rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Compact Header */}
        <div className="bg-[#2C1A1D] text-white p-3 sm:p-4 relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🔍 X button clicked - closing modal')
              onClose()
            }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-white hover:text-gray-300 transition-colors z-10"
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
                  {guild.member_count || guild.members || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Crown size={12} />
                  {guild.owner?.username || guild.poster?.username || "Guild Master"}
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
                onClick={() => {
                  const guildId = (guild.id || guild.guild_id) as number
                  if (guildId) onOpenChat(guildId)
                }}
                className="px-3 py-1.5 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm hover:bg-[#B8956A] transition-colors flex items-center gap-1"
              >
                <MessageCircle size={14} />
                Chat
              </button>
            )}
            {canManage && (onOpenSettings || onManageGuild) && (
              <button
                onClick={() => {
                  if (onManageGuild) {
                    onManageGuild(guild)
                    onClose()
                  } else if (onOpenSettings && guild.id) {
                    onOpenSettings(guild.id as number)
                  }
                }}
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
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {activeTab === "about" && (
            <div className="space-y-4">
              {/* Guild Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Specialization</h4>
                  <p className="text-purple-600 font-medium">{guild.specialization || "Alchemy"}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Category</h4>
                  <p className="text-purple-600 font-medium">{guild.category || "Alchemists"}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Guild Funds</h4>
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} className="text-yellow-500" />
                    <span className="text-green-600 font-semibold">{guild.funds || 1250} Gold</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Join Requirements</h4>
                  <p className="text-purple-600 font-medium">
                    {guild.require_approval ? "Manual Approval" : "Open to All"}
                  </p>
                </div>
              </div>

              {/* Guild Announcement */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500 text-lg">📢</span>
                  <h4 className="font-semibold text-gray-800">Guild Announcement</h4>
                </div>
                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {guild.welcome_message || "Welcome to the Mystic Brewers Guild! We're currently working on a new health potion recipe. Check out our latest guild quest!"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    by {guild.owner?.username || "MysticBrewer"} • {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Social Links */}
              {(guild.social_links && guild.social_links.length > 0) && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Social Links</h4>
                  <div className="space-y-2">
                    {guild.social_links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                        <span className="text-blue-500 text-sm">🔗</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-xs font-medium uppercase">
                              {link.platform_name}
                            </span>
                          </div>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm truncate block"
                          >
                            {link.url}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-3">
              {loadingMembers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA] mx-auto"></div>
                  <p className="text-[#8B75AA] mt-2">Loading members...</p>
                </div>
              ) : guildMembers.length > 0 ? (
                guildMembers
                  .filter(membership => membership.status === 'approved' && membership.is_active)
                  .map((membership) => (
                    <div key={membership.id} className="flex items-center gap-3 p-3 bg-white border border-[#CDAA7D] rounded">
                      <div className="w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {membership.user.avatar || membership.user.username?.[0]?.toUpperCase() || "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2C1A1D] text-sm truncate">
                          {membership.user.username || `User ${membership.user.id}`}
                        </p>
                        <p className="text-xs text-[#8B75AA]">
                          {membership.role === 'owner' ? 'Guild Master' : 
                           membership.role === 'admin' ? 'Administrator' : 'Member'}
                        </p>
                      </div>
                      {membership.role === 'owner' && (
                        <Crown size={16} className="text-yellow-500 flex-shrink-0" />
                      )}
                      {membership.role === 'admin' && (
                        <Star size={16} className="text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-[#8B75AA]">No members found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && isMember && (
            <div className="text-center py-8">
              <MessageCircle size={48} className="mx-auto mb-4 text-[#CDAA7D]" />
              <p className="text-[#8B75AA] mb-4">Guild chat will open in a separate window</p>
              <button
                onClick={() => {
                  const guildId = (guild.id || guild.guild_id) as number
                  if (guildId) onOpenChat(guildId)
                }}
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
