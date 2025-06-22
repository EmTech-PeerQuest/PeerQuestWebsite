"use client"

import { useState } from "react"
import type { User, Quest, Guild } from "@/lib/types"
import { Users, FileText, Flag, Home, X } from "lucide-react"
import { ReportDetailsModal } from "@/components/modals/report-details-modal"

interface AdminPanelProps {
  currentUser: User | null
  users: User[]
  quests: Quest[]
  guilds: Guild[]
  setUsers: (users: User[]) => void
  setQuests: (quests: Quest[]) => void
  setGuilds: (guilds: Guild[]) => void
  showToast: (message: string, type?: string) => void
}

export function AdminPanel({
  currentUser,
  users,
  quests,
  guilds,
  setUsers,
  setQuests,
  setGuilds,
  showToast,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "quests" | "guilds" | "reports">("overview")
  const [showBanConfirm, setShowBanConfirm] = useState<number | null>(null)
  const [banReason, setBanReason] = useState("")
  const [customBanReason, setCustomBanReason] = useState("")
  const [showDeleteQuestConfirm, setShowDeleteQuestConfirm] = useState<number | null>(null)
  const [deleteQuestReason, setDeleteQuestReason] = useState("")
  const [customDeleteQuestReason, setCustomDeleteQuestReason] = useState("")
  const [showDeleteGuildConfirm, setShowDeleteGuildConfirm] = useState<number | null>(null)
  const [deleteGuildReason, setDeleteGuildReason] = useState("")
  const [customDeleteGuildReason, setCustomDeleteGuildReason] = useState("")
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null)
  const [selectedQuestDetails, setSelectedQuestDetails] = useState<Quest | null>(null)
  const [selectedGuildDetails, setSelectedGuildDetails] = useState<Guild | null>(null)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [resolvedReports, setResolvedReports] = useState<number[]>([])

  // Count active and banned users
  const activeUsers = users.filter((user) => !user.isBanned).length
  const bannedUsers = users.filter((user) => user.isBanned).length

  // Count open, completed quests
  const openQuests = quests.filter((quest) => quest.status === "open").length
  const completedQuests = quests.filter((quest) => quest.status === "completed").length

  // Mock reports data
  const reports = [
    {
      id: 1,
      type: "user",
      reportedId: users[2]?.id || 3,
      reason: "Inappropriate behavior",
      status: "pending",
      reportedBy: users[0]?.id || 1,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description: "User was posting inappropriate content in guild chat and harassing other members.",
      evidence: ["Screenshot of chat messages", "Multiple user reports"],
    },
    {
      id: 2,
      type: "quest",
      reportedId: quests[0]?.id || 1,
      reason: "Misleading information",
      status: "pending",
      reportedBy: users[1]?.id || 2,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      description: "Quest description doesn't match the actual requirements and seems to be a scam.",
      evidence: ["Quest posting details", "User complaint"],
    },
  ]

  const handleBanUser = (userId: number) => {
    const finalReason = banReason === "custom" ? customBanReason : banReason
    setUsers(users.map((user) => (user.id === userId ? { ...user, banned: true, banReason: finalReason } : user)))
    showToast(`User has been banned. Reason: ${finalReason}`, "success")
    setShowBanConfirm(null)
    setBanReason("")
    setCustomBanReason("")
  }

  const handleUnbanUser = (userId: number) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, banned: false } : user)))
    showToast(`User has been unbanned.`, "success")
  }

  const handleDeleteQuest = (questId: number) => {
    const finalReason = deleteQuestReason === "custom" ? customDeleteQuestReason : deleteQuestReason
    setQuests(quests.filter((quest) => quest.id !== questId))
    showToast(`Quest has been deleted. Reason: ${finalReason}`, "success")
    setShowDeleteQuestConfirm(null)
    setDeleteQuestReason("")
    setCustomDeleteQuestReason("")
  }

  const handleDeleteGuild = (guildId: number) => {
    const finalReason = deleteGuildReason === "custom" ? customDeleteGuildReason : deleteGuildReason
    setGuilds(guilds.filter((guild) => guild.id !== guildId))
    showToast(`Guild has been deleted. Reason: ${finalReason}`, "success")
    setShowDeleteGuildConfirm(null)
    setDeleteGuildReason("")
    setCustomDeleteGuildReason("")
  }

  const handleResolveReport = (reportId: number, action: string, notes: string) => {
    setResolvedReports((prev) => [...prev, reportId])
    showToast(`Report resolved with action: ${action}`, "success")
  }

  const handleViewReport = (report: any) => {
    setSelectedReport(report)
  }

  if (!currentUser || !currentUser.roles || !currentUser.roles.includes("admin")) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#2C1A1D] mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">You do not have permission to access the admin panel.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#F4F0E6] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-[#8B75AA] rounded-t-lg p-6">
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          <p className="text-[#F4F0E6] opacity-80">Manage users, quests, guilds, and reports</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                  : "text-gray-500 hover:text-[#8B75AA]"
              }`}
            >
              <Home size={18} className="mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "users"
                  ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                  : "text-gray-500 hover:text-[#8B75AA]"
              }`}
            >
              <Users size={18} className="mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("quests")}
              className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "quests"
                  ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                  : "text-gray-500 hover:text-[#8B75AA]"
              }`}
            >
              <FileText size={18} className="mr-2" />
              Quests
            </button>
            <button
              onClick={() => setActiveTab("guilds")}
              className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "guilds"
                  ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                  : "text-gray-500 hover:text-[#8B75AA]"
              }`}
            >
              <Users size={18} className="mr-2" />
              Guilds
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "reports"
                  ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                  : "text-gray-500 hover:text-[#8B75AA]"
              }`}
            >
              <Flag size={18} className="mr-2" />
              Reports
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">2</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-lg p-6">
          {activeTab === "overview" && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Total Users */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Users</h3>
                    <Users size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{users.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium">{activeUsers} active</span> •{" "}
                    <span className="text-red-500">{bannedUsers} banned</span>
                  </div>
                </div>

                {/* Total Quests */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Quests</h3>
                    <FileText size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{quests.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium">{openQuests} open</span> •{" "}
                    <span className="text-green-500">{completedQuests} completed</span>
                  </div>
                </div>

                {/* Total Guilds */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Guilds</h3>
                    <Users size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{guilds.length}</div>
                </div>

                {/* Pending Reports */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Pending Reports</h3>
                    <Flag size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{reports.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <button onClick={() => setActiveTab("reports")} className="text-[#8B75AA] hover:underline">
                      View reports
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div
                  className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab("users")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#2C1A1D]">Manage Users</h3>
                    <Users size={24} className="text-[#8B75AA]" />
                  </div>
                  <p className="text-[#8B75AA] text-sm">View and manage user accounts, roles, and permissions</p>
                </div>

                <div
                  className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab("quests")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#2C1A1D]">Manage Quests</h3>
                    <FileText size={24} className="text-[#8B75AA]" />
                  </div>
                  <p className="text-[#8B75AA] text-sm">Monitor and moderate quest postings and activities</p>
                </div>

                <div
                  className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab("guilds")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#2C1A1D]">Manage Guilds</h3>
                    <Users size={24} className="text-[#8B75AA]" />
                  </div>
                  <p className="text-[#8B75AA] text-sm">Oversee guild activities and manage guild settings</p>
                </div>

                <div
                  className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveTab("reports")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#2C1A1D]">Manage Reports</h3>
                    <Flag size={24} className="text-[#8B75AA]" />
                  </div>
                  <p className="text-[#8B75AA] text-sm">Review and resolve user reports and violations</p>
                  {reports.length > 0 && (
                    <span className="inline-block mt-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {reports.length} pending
                    </span>
                  )}
                </div>

                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#2C1A1D]">Recent Users</h3>
                    <Users size={24} className="text-[#8B75AA]" />
                  </div>
                  <p className="text-[#8B75AA] text-sm">View recently registered users and their activity</p>
                </div>

                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#2C1A1D]">Recent Reports</h3>
                    <Flag size={24} className="text-[#8B75AA]" />
                  </div>
                  <p className="text-[#8B75AA] text-sm">Latest reports requiring admin attention</p>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Manage Users</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">User</th>
                        <th className="py-2 px-4 border-b text-left">Email</th>
                        <th className="py-2 px-4 border-b text-left">Role</th>
                        <th className="py-2 px-4 border-b text-left">Status</th>
                        <th className="py-2 px-4 border-b text-left">Joined</th>
                        <th className="py-2 px-4 border-b text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-[#8B75AA] flex items-center justify-center text-white font-medium">
                                {user.avatar || user.username?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <span className="ml-2 font-medium">{user.username}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b">{user.email}</td>
                          <td className="py-2 px-4 border-b">
                            {user.roles?.includes("admin") ? (
                              <span className="bg-[#8B75AA] text-white text-xs px-2 py-1 rounded">Admin</span>
                            ) : (
                              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">User</span>
                            )}
                          </td>
                          <td className="py-2 px-4 border-b">
                            {user.isBanned ? (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Banned</span>
                            ) : (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                            )}
                          </td>
                          <td className="py-2 px-4 border-b">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedUserDetails(user)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </button>
                              {user.isBanned ? (
                                <button
                                  onClick={() => handleUnbanUser(Number(user.id))}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  onClick={() => setShowBanConfirm(Number(user.id))}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Ban
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Quests Tab */}
          {activeTab === "quests" && (
            <div>
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Manage Quests</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">Title</th>
                        <th className="py-2 px-4 border-b text-left">Posted By</th>
                        <th className="py-2 px-4 border-b text-left">Category</th>
                        <th className="py-2 px-4 border-b text-left">Status</th>
                        <th className="py-2 px-4 border-b text-left">Created</th>
                        <th className="py-2 px-4 border-b text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quests.map((quest) => (
                        <tr key={quest.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b font-medium">{quest.title}</td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-[#8B75AA] flex items-center justify-center text-white text-xs">
                                {quest.poster?.avatar}
                              </div>
                              <span className="ml-2">{quest.poster?.username}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b">
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                              {quest.category}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b">
                            {quest.status === "open" && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Open</span>
                            )}
                            {quest.status === "in-progress" && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                In Progress
                              </span>
                            )}
                            {quest.status === "completed" && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Completed</span>
                            )}
                          </td>
                          <td className="py-2 px-4 border-b">
                            {quest.createdAt ? new Date(quest.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedQuestDetails(quest)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setShowDeleteQuestConfirm(Number(quest.id))}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Guilds Tab */}
          {activeTab === "guilds" && (
            <div>
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Manage Guilds</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">Guild</th>
                        <th className="py-2 px-4 border-b text-left">Owner</th>
                        <th className="py-2 px-4 border-b text-left">Members</th>
                        <th className="py-2 px-4 border-b text-left">Specialization</th>
                        <th className="py-2 px-4 border-b text-left">Created</th>
                        <th className="py-2 px-4 border-b text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guilds.map((guild) => (
                        <tr key={guild.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{guild.emblem}</span>
                              <span className="font-medium">{guild.poster?.username}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-[#8B75AA] flex items-center justify-center text-white text-xs">
                                {guild.poster?.avatar}
                              </div>
                              <span className="ml-2">{guild.poster?.username}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b">{guild.members}</td>
                          <td className="py-2 px-4 border-b">
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                              {guild.specialization}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b">
                            {guild.createdAt ? new Date(guild.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedGuildDetails(guild)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setShowDeleteGuildConfirm(Number(guild.id))}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div>
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Manage Reports</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">Type</th>
                        <th className="py-2 px-4 border-b text-left">Reported By</th>
                        <th className="py-2 px-4 border-b text-left">Reason</th>
                        <th className="py-2 px-4 border-b text-left">Status</th>
                        <th className="py-2 px-4 border-b text-left">Date</th>
                        <th className="py-2 px-4 border-b text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                report.type === "user" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {report.type === "user" ? "User Report" : "Quest Report"}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-[#8B75AA] flex items-center justify-center text-white text-xs">
                                {users.find((u) => u.id === report.reportedBy)?.avatar || "U"}
                              </div>
                              <span className="ml-2">
                                {users.find((u) => u.id === report.reportedBy)?.username || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b">{report.reason}</td>
                          <td className="py-2 px-4 border-b">
                            {resolvedReports.includes(Number(report.id)) ? (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Completed</span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                            )}
                          </td>
                          <td className="py-2 px-4 border-b">
                            {report.createdAt ? report.createdAt.toLocaleDateString() : "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewReport(report)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </button>
                              {!resolvedReports.includes(Number(report.id)) && (
                                <button
                                  onClick={() =>
                                    handleResolveReport(report.id, "quick_resolve", "Resolved via quick action")
                                  }
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All existing modals remain the same... */}
      {/* Ban Confirmation Modal */}
      {showBanConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Confirm Ban</h3>
            <p className="text-[#2C1A1D] mb-4">Are you sure you want to ban this user?</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Reason for ban:</label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full border border-[#CDAA7D] rounded px-3 py-2 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] mb-2"
              >
                <option value="">Select a reason...</option>
                <option value="Inappropriate behavior">Inappropriate behavior</option>
                <option value="Spam or harassment">Spam or harassment</option>
                <option value="Violation of terms">Violation of terms</option>
                <option value="Fraudulent activity">Fraudulent activity</option>
                <option value="custom">Custom reason</option>
              </select>

              {banReason === "custom" && (
                <textarea
                  value={customBanReason}
                  onChange={(e) => setCustomBanReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  className="w-full border border-[#CDAA7D] rounded px-3 py-2 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] h-20 resize-none"
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBanConfirm(null)
                  setBanReason("")
                  setCustomBanReason("")
                }}
                className="px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors"
              >
                No
              </button>
              <button
                onClick={() => handleBanUser(showBanConfirm)}
                disabled={!banReason || (banReason === "custom" && !customBanReason.trim())}
                className={`px-4 py-2 rounded transition-colors ${
                  banReason && (banReason !== "custom" || customBanReason.trim())
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Yes, Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetailsModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          report={selectedReport}
          users={users}
          onResolve={handleResolveReport}
          showToast={showToast}
        />
      )}

      {/* User Details Modal */}
      {selectedUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2C1A1D]">User Details</h3>
              <button onClick={() => setSelectedUserDetails(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-[#8B75AA] rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedUserDetails.avatar}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#2C1A1D]">{selectedUserDetails.username}</h4>
                    <p className="text-[#8B75AA]">{selectedUserDetails.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Level</label>
                    <p className="text-[#2C1A1D]">{selectedUserDetails.level}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">XP</label>
                    <p className="text-[#2C1A1D]">{selectedUserDetails.xp}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gold</label>
                    <p className="text-[#2C1A1D]">{selectedUserDetails.gold}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Joined</label>
                    <p className="text-[#2C1A1D]">
                      {selectedUserDetails.createdAt
                        ? new Date(selectedUserDetails.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-[#2C1A1D] mb-3">Activity Stats</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Completed Quests</label>
                    <p className="text-[#2C1A1D]">{selectedUserDetails.completedQuests}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Quests</label>
                    <p className="text-[#2C1A1D]">{selectedUserDetails.createdQuests}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Joined Guilds</label>
                    <p className="text-[#2C1A1D]">{selectedUserDetails.joinedGuilds}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Guilds</label>
                    <p className="text-[#2C1A1D]">{selectedUserDetails.createdGuilds}</p>
                  </div>
                </div>

                {selectedUserDetails.bio && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Bio</label>
                    <p className="text-[#2C1A1D] text-sm">{selectedUserDetails.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quest Details Modal */}
      {selectedQuestDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2C1A1D]">Quest Details</h3>
              <button onClick={() => setSelectedQuestDetails(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-bold text-[#2C1A1D] mb-4">{selectedQuestDetails.title}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-[#2C1A1D]">{selectedQuestDetails.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-[#2C1A1D]">{selectedQuestDetails.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reward</label>
                    <p className="text-[#2C1A1D]">{selectedQuestDetails.reward} Gold</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-[#2C1A1D]">
                      {selectedQuestDetails.createdAt
                        ? new Date(selectedQuestDetails.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-[#2C1A1D] mb-3">Posted By</h5>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold">
                    {selectedQuestDetails.poster?.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1A1D]">{selectedQuestDetails.poster?.username}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-[#2C1A1D] text-sm mt-1">{selectedQuestDetails.description}</p>
                </div>

                {selectedQuestDetails.requirements && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Requirements</label>
                    <ul className="text-[#2C1A1D] text-sm mt-1 list-disc list-inside">
                      {selectedQuestDetails.requirements.map((req: string, index: number) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guild Details Modal */}
      {selectedGuildDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2C1A1D]">Guild Details</h3>
              <button onClick={() => setSelectedGuildDetails(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-[#CDAA7D] rounded-lg flex items-center justify-center text-2xl">
                    {selectedGuildDetails.emblem}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#2C1A1D]">
                      {selectedGuildDetails.poster?.username || selectedGuildDetails.poster?.name || "Unknown"}
                    </h4>
                    <p className="text-[#8B75AA]">{selectedGuildDetails.specialization}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Members</label>
                    <p className="text-[#2C1A1D]">{selectedGuildDetails.members}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Funds</label>
                    <p className="text-[#2C1A1D]">{selectedGuildDetails.funds || 0} Gold</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-[#2C1A1D]">
                      {selectedGuildDetails.createdAt
                        ? new Date(selectedGuildDetails.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-[#2C1A1D] mb-3">Owner</h5>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold">
                    {selectedGuildDetails.poster?.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1A1D]">{selectedGuildDetails.poster?.username}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-[#2C1A1D] text-sm mt-1">{selectedGuildDetails.description}</p>
                </div>

                {selectedGuildDetails.requirements && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Requirements</label>
                    <ul className="text-[#2C1A1D] text-sm mt-1 list-disc list-inside">
                      {selectedGuildDetails.requirements.map((req: string, index: number) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Quest Confirmation Modal */}
      {showDeleteQuestConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Confirm Quest Deletion</h3>
            <p className="text-[#2C1A1D] mb-4">Are you sure you want to delete this quest?</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Reason for deletion:</label>
              <select
                value={deleteQuestReason}
                onChange={(e) => setDeleteQuestReason(e.target.value)}
                className="w-full border border-[#CDAA7D] rounded px-3 py-2 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] mb-2"
              >
                <option value="">Select a reason...</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Misleading information">Misleading information</option>
                <option value="Spam or duplicate">Spam or duplicate</option>
                <option value="Violation of guidelines">Violation of guidelines</option>
                <option value="custom">Custom reason</option>
              </select>

              {deleteQuestReason === "custom" && (
                <textarea
                  value={customDeleteQuestReason}
                  onChange={(e) => setCustomDeleteQuestReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  className="w-full border border-[#CDAA7D] rounded px-3 py-2 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] h-20 resize-none"
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteQuestConfirm(null)
                  setDeleteQuestReason("")
                  setCustomDeleteQuestReason("")
                }}
                className="px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteQuest(showDeleteQuestConfirm)}
                disabled={!deleteQuestReason || (deleteQuestReason === "custom" && !customDeleteQuestReason.trim())}
                className={`px-4 py-2 rounded transition-colors ${
                  deleteQuestReason && (deleteQuestReason !== "custom" || customDeleteQuestReason.trim())
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Delete Quest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Guild Confirmation Modal */}
      {showDeleteGuildConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Confirm Guild Deletion</h3>
            <p className="text-[#2C1A1D] mb-4">Are you sure you want to delete this guild?</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Reason for deletion:</label>
              <select
                value={deleteGuildReason}
                onChange={(e) => setDeleteGuildReason(e.target.value)}
                className="w-full border border-[#CDAA7D] rounded px-3 py-2 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] mb-2"
              >
                <option value="">Select a reason...</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Inactive or abandoned">Inactive or abandoned</option>
                <option value="Violation of guidelines">Violation of guidelines</option>
                <option value="Fraudulent activity">Fraudulent activity</option>
                <option value="custom">Custom reason</option>
              </select>

              {deleteGuildReason === "custom" && (
                <textarea
                  value={customDeleteGuildReason}
                  onChange={(e) => setCustomDeleteGuildReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  className="w-full border border-[#CDAA7D] rounded px-3 py-2 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] h-20 resize-none"
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteGuildConfirm(null)
                  setDeleteGuildReason("")
                  setCustomDeleteGuildReason("")
                }}
                className="px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteGuild(showDeleteGuildConfirm)}
                disabled={!deleteGuildReason || (deleteGuildReason === "custom" && !customDeleteGuildReason.trim())}
                className={`px-4 py-2 rounded transition-colors ${
                  deleteGuildReason && (deleteGuildReason !== "custom" || customDeleteGuildReason.trim())
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Delete Guild
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
