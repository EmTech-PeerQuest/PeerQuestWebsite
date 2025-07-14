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
  // Dynamic API base URL (env or runtime)
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("")

  useEffect(() => {
    let base = ""
    if (typeof window !== "undefined") {
      base = (window as any).API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ""
    } else {
      base = process.env.NEXT_PUBLIC_API_BASE_URL || ""
    }
    setApiBaseUrl(base || "http://localhost:8000/api")
  }, [])

  // Dynamic, robust member guilds loading
  useEffect(() => {
    if (currentUser && activeTab === "member") {
      fetchMemberGuilds()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab, apiBaseUrl])

  const fetchMemberGuilds = async () => {
    if (!currentUser) return
    setLoadingMemberGuilds(true)
    try {
      // Use dynamic API base URL
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const url = `${apiBaseUrl}/guilds/my/`
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`Failed to load member guilds: ${res.status}`)
      const data = await res.json()
      setMemberGuildsData(Array.isArray(data) ? data : data.results || [])
    } catch (error: any) {
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

  // Dynamic: Filter guilds for owned guilds only
  const ownedGuilds = guilds.filter((guild) => {
    const isOwner = String(guild.owner?.id) === String(currentUser.id) ||
      guild.poster?.username === currentUser.username
    return isOwner
  })

  // Dynamic: Use API data for member guilds instead of filtering the main guild list
  const currentGuilds = activeTab === "owned" ? ownedGuilds : memberGuildsData

  // Dynamic: Calculate guild level based on member count and activity
  const calculateGuildLevel = (guild: Guild) => {
    const memberCount = guild.member_count || guild.members || 0
    const baseLevel = Math.floor(memberCount / 5) + 1
    return Math.min(baseLevel, 100)
  }

  // Dynamic: Calculate XP progress
  const getGuildXPProgress = (guild: Guild) => {
    const memberCount = guild.member_count || guild.members || 0
    const progressInLevel = (memberCount % 5) * 20
    return Math.min(progressInLevel, 100)
  }

  // Dynamic, robust UI rendering
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
              className="ml-4 px-4 py-2 bg-[#8B75AA] text-white rounded font-medium"
              onClick={handleRefreshMemberGuilds}
              disabled={loadingMemberGuilds}
            >
              {loadingMemberGuilds ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>

        {/* Loading state for member guilds */}
        {activeTab === "member" && loadingMemberGuilds && (
          <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
            <span className="text-[#8B75AA]">Loading your member guilds...</span>
          </div>
        )}

        {/* Guild Cards */}
        {!loadingMemberGuilds && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentGuilds.map((guild) => (
              <div key={guild.guild_id || guild.id} className="bg-white border border-[#CDAA7D] rounded-lg p-6 flex flex-col gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{guild.emblem || "🛡️"}</span>
                  <div>
                    <h3 className="text-xl font-bold text-[#2C1A1D]">{guild.name}</h3>
                    <div className="text-sm text-gray-500">Level {calculateGuildLevel(guild)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="inline-block mr-1" />
                  {guild.member_count || guild.members || 1} members
                  <DollarSign size={16} className="inline-block ml-4 mr-1" />
                  {guild.funds || 0} gold
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-[#8B75AA] text-white rounded text-sm"
                    onClick={() => onViewGuild(guild)}
                  >
                    <Eye size={16} /> View
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm"
                    onClick={() => onManageGuild(guild)}
                  >
                    <Settings size={16} /> Manage
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-[#F4F0E6] text-[#8B75AA] border border-[#8B75AA] rounded text-sm"
                    onClick={() => onEditGuild(guild)}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 border border-red-300 rounded text-sm"
                    onClick={() => {
                      const id = typeof guild.guild_id === 'string' ? guild.guild_id : (typeof guild.id === 'string' ? guild.id : guild.id?.toString?.() || '')
                      if (id) onDeleteGuild(id)
                    }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded mt-2">
                  <div
                    className="h-2 bg-[#8B75AA] rounded"
                    style={{ width: `${getGuildXPProgress(guild)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingMemberGuilds && currentGuilds.length === 0 && (
          <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
            <Shield size={48} className="mx-auto mb-4 text-[#CDAA7D]" />
            <p className="text-[#8B75AA]">No guilds found in this category.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default SimpleGuildManagement