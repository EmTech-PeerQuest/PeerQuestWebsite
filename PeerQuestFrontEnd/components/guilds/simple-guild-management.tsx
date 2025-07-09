"use client"

import { useState, useEffect } from "react"
import { Users, DollarSign, Shield, Settings, Eye, Edit, Trash2 } from "lucide-react"
import type { Guild, User } from "@/lib/types"
import { guildApi } from "@/lib/api/guilds"

interface SimpleGuildManagementProps {
  guilds: Guild[]
  currentUser: User | null
  showToast: (message: string, type?: string) => void
  onViewGuild: (guild: Guild) => void // For viewing guild details (overview modal)
  onManageGuild: (guild: Guild) => void // For managing guild (detailed management)
  onEditGuild: (guild: Guild) => void
  onDeleteGuild: (guildId: string) => void
  onRefreshMemberGuilds?: () => void // Optional callback to refresh member guilds
}

export function SimpleGuildManagement({
  guilds,
  currentUser,
  showToast,
  onViewGuild,
  onManageGuild,
  onEditGuild,
  onDeleteGuild,
  onRefreshMemberGuilds,
}: SimpleGuildManagementProps) {
  const [activeTab, setActiveTab] = useState<"owned" | "member">("owned")
  const [memberGuildsData, setMemberGuildsData] = useState<Guild[]>([])
  const [loadingMemberGuilds, setLoadingMemberGuilds] = useState(false)

  // Fetch user's member guilds when component mounts or user changes
  useEffect(() => {
    if (currentUser && activeTab === "member") {
      fetchMemberGuilds()
    }
  }, [currentUser, activeTab])

  const fetchMemberGuilds = async () => {
    if (!currentUser) return
    
    setLoadingMemberGuilds(true)
    try {
      const myGuilds = await guildApi.getMyGuilds()
      console.log('Fetched member guilds:', myGuilds)
      setMemberGuildsData(myGuilds)
    } catch (error) {
      console.error('Error fetching member guilds:', error)
      showToast('Failed to load member guilds', 'error')
      setMemberGuildsData([])
    } finally {
      setLoadingMemberGuilds(false)
    }
  }

  // Add a manual refresh button for member guilds
  const handleRefreshMemberGuilds = () => {
    fetchMemberGuilds()
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8B75AA] mb-4">Please log in to manage your guilds</p>
        </div>
      </div>
    )
  }

  // Filter guilds for owned guilds only
  const ownedGuilds = guilds.filter((guild) => {
    const isOwner = guild.owner?.id === currentUser.id || 
                   guild.poster?.username === currentUser.username
    return isOwner
  })

  // Use API data for member guilds instead of filtering the main guild list
  const currentGuilds = activeTab === "owned" ? ownedGuilds : memberGuildsData

  const calculateGuildLevel = (guild: Guild) => {
    // Simple level calculation based on member count
    return Math.floor((guild.member_count || guild.members || 0) / 10) + 1
  }

  const getGuildXPProgress = (guild: Guild) => {
    // Simple progress calculation
    const memberCount = guild.member_count || guild.members || 0
    const progressInLevel = (memberCount % 10) * 10
    return Math.min(progressInLevel, 100)
  }

  return (
    <section className="bg-[#F4F0E6] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#2C1A1D] font-serif mb-6">Guild Management</h2>

        {/* Tabs */}
        <div className="flex border-b border-[#CDAA7D] mb-6 overflow-x-auto items-center justify-between">
          <div className="flex">
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === "owned"
                  ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                  : "text-[#2C1A1D] hover:text-[#8B75AA]"
              }`}
              onClick={() => setActiveTab("owned")}
            >
              Owned Guilds
            </button>
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === "member"
                  ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                  : "text-[#2C1A1D] hover:text-[#8B75AA]"
              }`}
              onClick={() => setActiveTab("member")}
            >
              Member Guilds
            </button>
          </div>
          {activeTab === "member" && (
            <button
              onClick={handleRefreshMemberGuilds}
              disabled={loadingMemberGuilds}
              className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loadingMemberGuilds ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>

        {/* Loading state for member guilds */}
        {activeTab === "member" && loadingMemberGuilds && (
          <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
            <p className="text-[#8B75AA]">Loading member guilds...</p>
          </div>
        )}

        {/* Guild Cards */}
        {!loadingMemberGuilds && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentGuilds.map((guild) => (
              <div
                key={guild.guild_id || guild.id}
                className="bg-white border border-[#CDAA7D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-[#CDAA7D] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl">
                      {guild.preset_emblem || guild.emblem || "🏆"}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C1A1D]">{guild.name}</h3>
                      <p className="text-sm text-[#2C1A1D]/70">Level {calculateGuildLevel(guild)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users size={16} className="text-[#8B75AA]" />
                        <span className="text-sm font-medium text-[#2C1A1D]">
                          {guild.member_count || guild.members || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-[#8B75AA]" />
                        <span className="text-sm font-medium text-[#2C1A1D]">{guild.funds || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guild Level Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-[#2C1A1D]">Level {calculateGuildLevel(guild)}</span>
                      <span className="text-xs text-[#8B75AA]">{getGuildXPProgress(guild).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-[#8B75AA] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${getGuildXPProgress(guild)}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-sm text-[#2C1A1D] mb-4 line-clamp-2">{guild.description}</p>

                  <div className="flex gap-2">
                    {activeTab === "owned" ? (
                      <>
                        <button
                          onClick={() => onManageGuild(guild)}
                          className="flex-1 px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <Settings size={14} />
                          Manage
                        </button>
                        <button
                          onClick={() => onViewGuild(guild)}
                          className="px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors text-sm font-medium"
                        >
                          <Eye size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onViewGuild(guild)}
                        className="flex-1 px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingMemberGuilds && currentGuilds.length === 0 && (
          <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
            <Shield size={48} className="mx-auto mb-4 text-[#CDAA7D]" />
            <h3 className="text-xl font-bold text-[#2C1A1D] mb-2">No Guilds Found</h3>
            <p className="text-[#8B75AA]">
              {activeTab === "owned"
                ? "You don't own any guilds yet. Create a new guild to get started!"
                : "You're not a member of any guilds yet. Join a guild from the Guild Hall!"}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default SimpleGuildManagement