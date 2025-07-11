"use client"

import { useState, useEffect } from "react"
import { Search, Users, Shield, DollarSign, Activity, BarChart3, UserPlus, CheckCircle, XCircle } from "lucide-react"
import type { Guild, User, GuildJoinRequest, GuildMembership } from "@/lib/types"
import { GuildAuditLog } from '@/components/admin/guild-audit-log'
import { GuildPayouts } from '@/components/guilds/guild-payouts'
import { GuildRolesConfig } from '@/components/guilds/guild-roles-config'
import { guildApi } from '@/lib/api/guilds'

interface EnhancedGuildManagementProps {
  guilds: Guild[]
  guildApplications: GuildJoinRequest[]
  currentUser: User
  selectedGuild?: Guild | null
  showToast: (message: string, type?: string) => void
  onViewGuild: (guild: Guild) => void
  onEditGuild: (guild: Guild) => void
  onDeleteGuild: (guildId: string) => void
  onApproveApplication: (applicationId: string) => void
  onRejectApplication: (applicationId: string) => void
  onManageMembers: (guild: Guild) => void
  onBack?: () => void
  onDataChanged?: () => Promise<void> | void
}

export function EnhancedGuildManagement({
  guilds,
  guildApplications,
  currentUser,
  selectedGuild: propSelectedGuild,
  showToast,
  onViewGuild,
  onEditGuild,
  onDeleteGuild,
  onApproveApplication,
  onRejectApplication,
  onManageMembers,
  onBack,
  onDataChanged,
}: EnhancedGuildManagementProps) {
  // Early return if user is not authenticated
  if (!currentUser) {
    return (
      <section className="bg-[#F4F0E6] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-[#2C1A1D] mb-4">Authentication Required</h2>
            <p className="text-[#8B75AA] mb-6">Please log in to access guild management features.</p>
            <button 
              onClick={() => onBack && onBack()}
              className="px-6 py-3 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </section>
    )
  }

  const [activeTab, setActiveTab] = useState<"owned" | "member" | "applications">("owned")
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(propSelectedGuild || null)
  const [managementView, setManagementView] = useState<
    "overview" | "members" | "requests" | "roles" | "audit" | "payouts"
  >("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("All")
  const [guildMembers, setGuildMembers] = useState<GuildMembership[]>([])
  const [joinRequests, setJoinRequests] = useState<GuildJoinRequest[]>([])
  const [processedRequests, setProcessedRequests] = useState<GuildJoinRequest[]>([])
  const [userMemberGuilds, setUserMemberGuilds] = useState<Guild[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [loadingUserGuilds, setLoadingUserGuilds] = useState(false)
  const [requestsTab, setRequestsTab] = useState<"pending" | "processed">("pending")

  // Fetch guild data when selectedGuild changes
  useEffect(() => {
    if (selectedGuild) {
      fetchGuildData()
    }
  }, [selectedGuild])

  // Fetch user's member guilds when component loads or guilds data changes
  useEffect(() => {
    if (guilds.length > 0) {
      fetchUserMemberGuilds()
    }
  }, [currentUser, guilds])

  const fetchUserMemberGuilds = async () => {
    setLoadingUserGuilds(true)
    try {
      const memberGuilds: Guild[] = []
      
      // Check each guild to see if user is a member
      const membershipChecks = guilds.map(async (guild) => {
        try {
          const members = await guildApi.getGuildMembers(guild.guild_id)
          const isMember = members.some(membership => 
            String(membership.user.id) === String(currentUser.id) && 
            membership.status === 'approved' && 
            membership.is_active &&
            membership.role !== 'owner' // Exclude owned guilds
          )
          if (isMember) {
            memberGuilds.push(guild)
          }
        } catch (error) {
          console.error(`Failed to check membership for guild ${guild.guild_id}:`, error)
        }
      })
      
      await Promise.all(membershipChecks)
      setUserMemberGuilds(memberGuilds)
    } catch (error) {
      console.error('Failed to fetch user member guilds:', error)
    } finally {
      setLoadingUserGuilds(false)
    }
  }

  const fetchGuildData = async () => {
    if (!selectedGuild) return

    // Fetch members
    setLoadingMembers(true)
    try {
      const members = await guildApi.getGuildMembers(selectedGuild.guild_id)
      setGuildMembers(members)
    } catch (error) {
      console.error('Failed to fetch guild members:', error)
    } finally {
      setLoadingMembers(false)
    }

    // Fetch join requests (only if owner)
    const isOwner = String(selectedGuild.owner?.id) === String(currentUser.id) || 
                   selectedGuild.poster?.username === currentUser.username
    if (isOwner) {
      setLoadingRequests(true)
      try {
        // Fetch both pending and processed requests
        const [pendingRequests, processedRequestsData] = await Promise.all([
          guildApi.getGuildJoinRequests(selectedGuild.guild_id, 'pending'),
          guildApi.getGuildJoinRequests(selectedGuild.guild_id, 'processed')
        ]);
        
        setJoinRequests(pendingRequests)
        setProcessedRequests(processedRequestsData)
      } catch (error) {
        console.error('Failed to fetch join requests:', error)
      } finally {
        setLoadingRequests(false)
      }
    }
  }

  const handleProcessJoinRequest = async (requestId: number, action: 'approve' | 'reject') => {
    if (!selectedGuild) return

    try {
      await guildApi.processJoinRequest(selectedGuild.guild_id, requestId, action)
      showToast(`Join request ${action}d successfully!`, "success")
      
      // Refresh all guild data
      await fetchGuildData()
      
      // If approved, refresh user's member guilds to update the Member Guilds tab
      if (action === 'approve') {
        await fetchUserMemberGuilds()
      }
      
      // Notify parent component to refresh its data
      if (onDataChanged) {
        await onDataChanged()
      }
      
      // Switch to processed tab to show the result
      setRequestsTab("processed")
    } catch (error) {
      console.error(`Failed to ${action} join request:`, error)
      showToast(`Failed to ${action} join request. Please try again.`, "error")
    }
  }

  // Get guilds where the current user is the owner
  const ownedGuilds = guilds.filter((guild) => 
    String(guild.owner?.id) === String(currentUser.id) || 
    guild.poster?.username === currentUser.username
  )
  
  // Use the real member guilds data from API
  const memberGuilds = userMemberGuilds

  const relevantApplications = guildApplications.filter((app) => {
    const guild = guilds.find((g) => (g.id || g.guild_id)?.toString() === app.guild.guild_id?.toString())
    return guild && (String(guild.owner?.id) === String(currentUser.id) || guild.poster?.username === currentUser.username)
  })

  // Mock member data for demonstration
  const mockMembers = [
    {
      id: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      role: "Owner",
      joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      level: 25,
      xp: 12500,
    },
    {
      id: 2,
      username: "QuestMaster",
      avatar: "Q",
      role: "Admin",
      joinDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      level: 18,
      xp: 8900,
    },
    {
      id: 3,
      username: "MysticBrewer",
      avatar: "M",
      role: "Member",
      joinDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      level: 12,
      xp: 5600,
    },
    {
      id: 4,
      username: "ShadowHunter",
      avatar: "S",
      role: "Member",
      joinDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      level: 15,
      xp: 7200,
    },
    {
      id: 5,
      username: "DragonSlayer",
      avatar: "D",
      role: "Member",
      joinDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      level: 8,
      xp: 3400,
    },
  ]

  const calculateGuildLevel = (guild: Guild) => {
    // Calculate guild level based on total member XP and activities
    const totalMemberXP = mockMembers.reduce((sum, member) => sum + member.xp, 0)
    const memberCount = guild.members || guild.member_count || 0
    const guildLevel = Math.floor(totalMemberXP / 1000) + memberCount
    return Math.min(guildLevel, 100) // Cap at level 100
  }

  const getGuildXPProgress = (guild: Guild) => {
    const currentLevel = calculateGuildLevel(guild)
    const xpForCurrentLevel = currentLevel * 1000
    const xpForNextLevel = (currentLevel + 1) * 1000
    const currentXP = mockMembers.reduce((sum, member) => sum + member.xp, 0)
    const progress = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
    return Math.max(0, Math.min(100, progress))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "text-yellow-400"
      case "Admin":
        return "text-red-400"
      case "Member":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-yellow-500"
      case "Admin":
        return "bg-red-500"
      case "Member":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  if (selectedGuild) {
    const isOwner = selectedGuild.owner?.id === currentUser.id || 
                   selectedGuild.poster?.username === currentUser.username

    return (
      <section className="bg-[#F4F0E6] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => onBack ? onBack() : setSelectedGuild(null)} 
              className="text-[#8B75AA] hover:text-[#7A6699] font-medium"
            >
              ← Back to Guild Management
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#CDAA7D] rounded-lg flex items-center justify-center text-xl">
                {selectedGuild.custom_emblem && typeof selectedGuild.custom_emblem === 'string' && selectedGuild.custom_emblem.startsWith('http') ? (
                  <img src={selectedGuild.custom_emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-lg" />
                ) : selectedGuild.preset_emblem && typeof selectedGuild.preset_emblem === 'string' && selectedGuild.preset_emblem.startsWith('http') ? (
                  <img src={selectedGuild.preset_emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-lg" />
                ) : selectedGuild.emblem && typeof selectedGuild.emblem === 'string' && selectedGuild.emblem.startsWith('http') ? (
                  <img src={selectedGuild.emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  selectedGuild.preset_emblem || selectedGuild.custom_emblem || selectedGuild.emblem || "🏆"
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2C1A1D]">{selectedGuild.name}</h2>
                <p className="text-[#8B75AA]">Level {calculateGuildLevel(selectedGuild)} Guild</p>
              </div>
            </div>
          </div>

          {/* Guild Level Progress */}
          <div className="bg-white border border-[#CDAA7D] rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#2C1A1D]">
                Guild Level {calculateGuildLevel(selectedGuild)}
              </span>
              <span className="text-sm text-[#8B75AA]">
                {getGuildXPProgress(selectedGuild).toFixed(1)}% to next level
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#8B75AA] h-2 rounded-full transition-all duration-300"
                style={{ width: `${getGuildXPProgress(selectedGuild)}%` }}
              ></div>
            </div>
          </div>

          {/* Management Navigation */}
          <div className="bg-white border border-[#CDAA7D] rounded-lg mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setManagementView("overview")}
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                  managementView === "overview"
                    ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                    : "text-[#2C1A1D] hover:text-[#8B75AA]"
                }`}
              >
                <BarChart3 size={18} />
                Overview
              </button>
              <button
                onClick={() => setManagementView("members")}
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                  managementView === "members"
                    ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                    : "text-[#2C1A1D] hover:text-[#8B75AA]"
                }`}
              >
                <Users size={18} />
                Members
              </button>
              {isOwner && (
                <button
                  onClick={() => setManagementView("requests")}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                    managementView === "requests"
                      ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                      : "text-[#2C1A1D] hover:text-[#8B75AA]"
                  }`}
                >
                  <UserPlus size={18} />
                  Requests
                  {relevantApplications.filter((app) => app.is_approved === null).length > 0 && (
                    <span className="bg-[#8B75AA] text-white text-xs rounded-full px-2 py-1">
                      {relevantApplications.filter((app) => app.is_approved === null).length}
                    </span>
                  )}
                </button>
              )}

              {isOwner && (
                <button
                  onClick={() => setManagementView("roles")}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                    managementView === "roles"
                      ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                      : "text-[#2C1A1D] hover:text-[#8B75AA]"
                  }`}
                >
                  <Shield size={18} />
                  Roles
                </button>
              )}

              <button
                onClick={() => setManagementView("audit")}
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                  managementView === "audit"
                    ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                    : "text-[#2C1A1D] hover:text-[#8B75AA]"
                }`}
              >
                <Activity size={18} />
                Audit Log
              </button>
              {isOwner && (
                <button
                  onClick={() => setManagementView("payouts")}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                    managementView === "payouts"
                      ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                      : "text-[#2C1A1D] hover:text-[#8B75AA]"
                  }`}
                >
                  <DollarSign size={18} />
                  Payouts
                </button>
              )}
            </div>

            <div className="p-6">
              {managementView === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#2C1A1D]">Total Members</h3>
                      <Users size={18} className="text-[#8B75AA]" />
                    </div>
                    <div className="text-3xl font-bold text-[#2C1A1D]">{selectedGuild.members}</div>
                  </div>
                  <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#2C1A1D]">Guild Funds</h3>
                      <DollarSign size={18} className="text-[#8B75AA]" />
                    </div>
                    <div className="text-3xl font-bold text-[#2C1A1D]">{selectedGuild.funds || 0}</div>
                  </div>
                  <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#2C1A1D]">Guild Level</h3>
                      <BarChart3 size={18} className="text-[#8B75AA]" />
                    </div>
                    <div className="text-3xl font-bold text-[#2C1A1D]">{calculateGuildLevel(selectedGuild)}</div>
                  </div>
                  <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#2C1A1D]">Pending Requests</h3>
                      <UserPlus size={18} className="text-[#8B75AA]" />
                    </div>
                    <div className="text-3xl font-bold text-[#2C1A1D]">
                      {relevantApplications.filter((app) => app.is_approved === null).length || 0}
                    </div>
                  </div>
                </div>
              )}

              {managementView === "members" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#2C1A1D]">Members</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search Members"
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="bg-white border border-[#CDAA7D] rounded px-3 py-2 pl-10 text-[#2C1A1D] placeholder-gray-400 focus:outline-none focus:border-[#8B75AA]"
                        />
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                      </div>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-white border border-[#CDAA7D] rounded px-3 py-2 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                      >
                        <option value="All">All</option>
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full bg-white border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-3 px-4 text-left font-medium text-[#2C1A1D]">Member</th>
                          <th className="py-3 px-4 text-left font-medium text-[#2C1A1D]">Role</th>
                          <th className="py-3 px-4 text-left font-medium text-[#2C1A1D]">Level</th>
                          <th className="py-3 px-4 text-left font-medium text-[#2C1A1D]">XP</th>
                          <th className="py-3 px-4 text-left font-medium text-[#2C1A1D]">Joined</th>
                          <th className="py-3 px-4 text-left font-medium text-[#2C1A1D]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockMembers
                          .filter(
                            (member) =>
                              (selectedRole === "All" || member.role === selectedRole) &&
                              member.username?.toLowerCase().includes(memberSearchQuery.toLowerCase()),
                          )
                          .map((member) => (
                            <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold">
                                    {member.avatar}
                                  </div>
                                  <span className="font-medium text-[#2C1A1D]">{member.username}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold text-white ${getRoleBadgeColor(member.role)}`}
                                >
                                  {member.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[#2C1A1D]">{member.level}</td>
                              <td className="py-3 px-4 text-[#2C1A1D]">{member.xp.toLocaleString()}</td>
                              <td className="py-3 px-4 text-[#2C1A1D]">
                                {member.joinDate?.toLocaleDateString() || "N/A"}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {member.role !== "Owner" && (
                                    <>
                                      <button className="text-blue-600 hover:text-blue-800 text-sm">Edit Role</button>
                                      <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {managementView === "requests" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#2C1A1D]">Join Requests</h3>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setRequestsTab("pending")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          requestsTab === "pending"
                            ? "bg-white text-[#8B75AA] shadow-sm"
                            : "text-gray-600 hover:text-[#8B75AA]"
                        }`}
                      >
                        Pending ({joinRequests.length})
                      </button>
                      <button
                        onClick={() => setRequestsTab("processed")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          requestsTab === "processed"
                            ? "bg-white text-[#8B75AA] shadow-sm"
                            : "text-gray-600 hover:text-[#8B75AA]"
                        }`}
                      >
                        Processed ({processedRequests.length})
                      </button>
                    </div>
                  </div>
                  
                  {loadingRequests ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA] mx-auto"></div>
                      <p className="text-[#8B75AA] mt-2">Loading join requests...</p>
                    </div>
                  ) : requestsTab === "pending" ? (
                    <div className="space-y-4">
                      {joinRequests.length > 0 ? (
                        joinRequests.map((request) => (
                          <div key={request.id} className="bg-white border border-[#CDAA7D] rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {request.user.avatar || request.user.username?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-[#2C1A1D] text-lg mb-1">
                                    {request.user.username || `User ${request.user.id}`}
                                  </h4>
                                  <p className="text-sm text-[#8B75AA] mb-3">
                                    📅 Submitted on {new Date(request.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {request.message && (
                                    <div className="bg-[#F4F0E6] rounded-lg p-3 mb-4">
                                      <p className="text-sm font-medium text-[#2C1A1D] mb-1">Reason for joining:</p>
                                      <p className="text-[#2C1A1D] italic">"{request.message}"</p>
                                    </div>
                                  )}
                                  {request.user.level && (
                                    <p className="text-sm text-[#8B75AA]">
                                      ⭐ Level {request.user.level} | 🏆 {request.user.xp || request.user.experience_points || 0} XP
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-3 ml-4">
                                <button
                                  onClick={() => handleProcessJoinRequest(request.id, 'approve')}
                                  className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
                                >
                                  <CheckCircle size={18} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleProcessJoinRequest(request.id, 'reject')}
                                  className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium shadow-sm"
                                >
                                  <XCircle size={18} />
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-white rounded-lg border border-[#CDAA7D]">
                          <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                          <h4 className="text-lg font-medium text-[#2C1A1D] mb-2">No Pending Requests</h4>
                          <p className="text-gray-500">There are no pending join requests for this guild.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {processedRequests.length > 0 ? (
                        processedRequests.map((request) => (
                          <div key={request.id} className="bg-white border border-[#CDAA7D] rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {request.user.avatar || request.user.username?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-[#2C1A1D] text-lg mb-1">
                                    {request.user.username || `User ${request.user.id}`}
                                  </h4>
                                  <div className="flex items-center gap-4 mb-3">
                                    <p className="text-sm text-[#8B75AA]">
                                      📅 Submitted: {new Date(request.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    {request.processed_at && (
                                      <p className="text-sm text-[#8B75AA]">
                                        ⚡ Processed: {new Date(request.processed_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    )}
                                  </div>
                                  {request.message && (
                                    <div className="bg-[#F4F0E6] rounded-lg p-3 mb-4">
                                      <p className="text-sm font-medium text-[#2C1A1D] mb-1">Reason for joining:</p>
                                      <p className="text-[#2C1A1D] italic">"{request.message}"</p>
                                    </div>
                                  )}
                                  {request.processed_by && (
                                    <p className="text-sm text-[#8B75AA]">
                                      👤 Processed by: {request.processed_by.username || `User ${request.processed_by.id}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                  request.is_approved 
                                    ? "bg-green-100 text-green-800 border border-green-200" 
                                    : "bg-red-100 text-red-800 border border-red-200"
                                }`}>
                                  {request.is_approved ? "✓ Approved" : "✗ Declined"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-white rounded-lg border border-[#CDAA7D]">
                          <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                          <h4 className="text-lg font-medium text-[#2C1A1D] mb-2">No Processed Requests</h4>
                          <p className="text-gray-500">No join requests have been processed yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {managementView === "roles" && (
                <GuildRolesConfig guild={selectedGuild} currentUser={currentUser} showToast={showToast} />
              )}

              {managementView === "audit" && <GuildAuditLog guild={selectedGuild} currentUser={currentUser} />}

              {managementView === "payouts" && (
                <GuildPayouts guild={selectedGuild} currentUser={currentUser} showToast={showToast} />
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Rest of the original component for guild list view
  return (
    <section className="bg-[#F4F0E6] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#2C1A1D] font-serif mb-6">Guild Management</h2>

        {/* Tabs */}
        <div className="flex border-b border-[#CDAA7D] mb-6 overflow-x-auto">
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

        {/* Guild Cards */}
        {activeTab === "member" && loadingUserGuilds ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA] mx-auto"></div>
            <p className="text-[#8B75AA] mt-2">Loading member guilds...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === "owned" ? ownedGuilds : memberGuilds).length > 0 ? (
              (activeTab === "owned" ? ownedGuilds : memberGuilds).map((guild) => (
                <div
                  key={guild.guild_id || guild.id}
                  className="bg-white border border-[#CDAA7D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="bg-[#CDAA7D] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl">
                        {guild.custom_emblem && typeof guild.custom_emblem === 'string' && guild.custom_emblem.startsWith('http') ? (
                          <img src={guild.custom_emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-lg" />
                        ) : guild.preset_emblem && typeof guild.preset_emblem === 'string' && guild.preset_emblem.startsWith('http') ? (
                          <img src={guild.preset_emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-lg" />
                        ) : guild.emblem && typeof guild.emblem === 'string' && guild.emblem.startsWith('http') ? (
                          <img src={guild.emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          guild.preset_emblem || guild.custom_emblem || guild.emblem || "🏆"
                        )}
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
                          <span className="text-sm font-medium text-[#2C1A1D]">{guild.member_count || guild.members || 0}</span>
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
                      <button
                        onClick={() => setSelectedGuild(guild)}
                        className="flex-1 px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors text-sm font-medium"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => onViewGuild(guild)}
                        className="px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
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
        )}
      </div>
    </section>
  )
}
