"use client"

import { useState } from "react"
import { Search, Users, Shield, DollarSign, Activity, BarChart3, UserPlus, CheckCircle, XCircle } from "lucide-react"
import type { Guild, User, GuildApplication } from "@/lib/types"
import { GuildAuditLog } from '@/components/admin/guild-audit-log'
import { GuildPayouts } from '@/components/guilds/guild-payouts'
import { GuildRolesConfig } from '@/components/guilds/guild-roles-config'

interface EnhancedGuildManagementProps {
  guilds: Guild[]
  guildApplications: GuildApplication[]
  currentUser: User
  showToast: (message: string, type?: string) => void
  onViewGuild: (guild: Guild) => void
  onEditGuild: (guild: Guild) => void
  onDeleteGuild: (guildId: string) => void
  onApproveApplication: (applicationId: string) => void
  onRejectApplication: (applicationId: string) => void
  onManageMembers: (guild: Guild) => void
}

export function EnhancedGuildManagement({
  guilds,
  guildApplications,
  currentUser,
  showToast,
  onViewGuild,
  onEditGuild,
  onDeleteGuild,
  onApproveApplication,
  onRejectApplication,
  onManageMembers,
}: EnhancedGuildManagementProps) {
  const [activeTab, setActiveTab] = useState<"owned" | "member" | "applications">("owned")
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null)
  const [managementView, setManagementView] = useState<
    "overview" | "members" | "requests" | "roles" | "audit" | "payouts"
  >("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("All")

  // Get guilds where the current user is an admin
  const ownedGuilds = guilds.filter((guild) => guild.admins && guild.admins.includes(currentUser.id))
  const memberGuilds = guilds.filter(
    (guild) =>
      guild.membersList &&
      guild.membersList.includes(currentUser.id) &&
      (!guild.admins || !guild.admins.includes(currentUser.id)),
  )

  const relevantApplications = guildApplications.filter((app) => {
    const guild = guilds.find((g) => g.id.toString() === app.guildId)
    return guild && guild.admins && guild.admins.includes(currentUser.id)
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
    const guildLevel = Math.floor(totalMemberXP / 1000) + guild.members
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
    const isOwner = selectedGuild.admins && selectedGuild.admins.includes(currentUser.id)

    return (
      <section className="bg-[#F4F0E6] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSelectedGuild(null)} className="text-[#8B75AA] hover:text-[#7A6699] font-medium">
              ← Back to Guild Management
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#CDAA7D] rounded-lg flex items-center justify-center text-xl">
                {selectedGuild.emblem}
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
                  {selectedGuild.applications?.filter((app) => app.status === "pending").length > 0 && (
                    <span className="bg-[#8B75AA] text-white text-xs rounded-full px-2 py-1">
                      {selectedGuild.applications.filter((app) => app.status === "pending").length}
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
                      {selectedGuild.applications?.filter((app) => app.status === "pending").length || 0}
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
                              member.username.toLowerCase().includes(memberSearchQuery.toLowerCase()),
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
                  <h3 className="text-xl font-bold text-[#2C1A1D] mb-6">Join Requests</h3>
                  <div className="space-y-4">
                    {selectedGuild.applications
                      ?.filter((app) => app.status === "pending")
                      .map((application) => (
                        <div key={application.id} className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold">
                                {application.avatar}
                              </div>
                              <div>
                                <h4 className="font-bold text-[#2C1A1D]">{application.username}</h4>
                                <p className="text-sm text-[#8B75AA] mb-2">
                                  Applied {application.appliedAt.toLocaleDateString()}
                                </p>
                                <p className="text-[#2C1A1D]">{application.message}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onApproveApplication(application.id.toString())}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                              >
                                <CheckCircle size={16} />
                                Accept
                              </button>
                              <button
                                onClick={() => onRejectApplication(application.id.toString())}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2"
                              >
                                <XCircle size={16} />
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      )) || (
                      <div className="text-center py-8">
                        <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No pending join requests</p>
                      </div>
                    )}
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === "owned" ? ownedGuilds : memberGuilds).map((guild) => (
            <div
              key={guild.id}
              className="bg-white border border-[#CDAA7D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="bg-[#CDAA7D] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl">
                    {guild.emblem}
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
                      <span className="text-sm font-medium text-[#2C1A1D]">{guild.members}</span>
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
          ))}
        </div>

        {(activeTab === "owned" ? ownedGuilds : memberGuilds).length === 0 && (
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
