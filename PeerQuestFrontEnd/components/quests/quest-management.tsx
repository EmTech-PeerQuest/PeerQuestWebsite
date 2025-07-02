"use client"

import type React from "react"
import { useState } from "react"
import {
  Search,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  CircleDollarSign,
  Calendar,
  User,
  Eye,
  AlertCircle,
} from "lucide-react"
import type { Quest, User as UserType } from "@/lib/types"
import { EditQuestModal } from '@/components/guilds/edit-quest-modal'

interface QuestManagementProps {
  quests: Quest[]
  currentUser: UserType
  onQuestStatusChange: (questId: number, newStatus: string) => void
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>
  showToast: (message: string, type?: string) => void
}

export function QuestManagement({
  quests,
  currentUser,
  onQuestStatusChange,
  setQuests,
  showToast,
}: QuestManagementProps) {
  const [activeTab, setActiveTab] = useState<"created" | "applied">("created")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"createdAt" | "deadline" | "reward">("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [expandedQuestId, setExpandedQuestId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)

  // Filter quests based on active tab and search query
  const filteredQuests = quests
    .filter((quest) => {
      if (activeTab === "created") {
        return quest.poster.id === currentUser.id
      } else {
        return quest.applicants && quest.applicants.some((app) => app.userId === currentUser.id)
      }
    })
    .filter((quest) => {
      if (!searchQuery) return true
      return (
        quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })

  // Sort quests
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    let aValue, bValue

    if (sortField === "createdAt") {
      aValue = new Date(a.createdAt).getTime()
      bValue = new Date(b.createdAt).getTime()
    } else if (sortField === "deadline") {
      aValue = new Date(a.deadline).getTime()
      bValue = new Date(b.deadline).getTime()
    } else {
      aValue = a.reward
      bValue = b.reward
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue
  })

  const toggleSort = (field: "createdAt" | "deadline" | "reward") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleDeleteQuest = (questId: number) => {
    setQuests((prevQuests) => prevQuests.filter((q) => q.id !== questId))
    setShowDeleteConfirm(null)
    showToast("Quest deleted successfully", "success")
  }

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest)
  }

  const handleSaveQuest = (updatedQuest: Quest) => {
    setQuests((prevQuests) => prevQuests.map((q) => (q.id === updatedQuest.id ? updatedQuest : q)))
    setEditingQuest(null)
  }

  const handleApproveApplicant = (questId: number, applicantId: number) => {
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.id === questId) {
          return {
            ...q,
            status: "in-progress",
            applicants: q.applicants.map((app) => {
              if (app.userId === applicantId) {
                return { ...app, status: "accepted" }
              } else {
                return { ...app, status: "rejected" }
              }
            }),
            assignedTo: applicantId,
          }
        }
        return q
      }),
    )
    showToast("Applicant approved and quest status updated", "success")
  }

  const handleRejectApplicant = (questId: number, applicantId: number) => {
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.id === questId) {
          return {
            ...q,
            applicants: q.applicants.map((app) => {
              if (app.userId === applicantId) {
                return { ...app, status: "rejected" }
              }
              return app
            }),
          }
        }
        return q
      }),
    )
    showToast("Applicant rejected", "success")
  }

  const handleCompleteQuest = (questId: number) => {
    onQuestStatusChange(questId, "completed")
    showToast("Quest marked as completed", "success")
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getApplicantStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <section className="bg-gradient-to-br from-[#F4F0E6] to-[#F8F5F0] min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-[#2C1A1D] font-serif mb-2">Quest Management</h2>
          <p className="text-[#8B75AA] text-lg">Manage your quests and track applications</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex">
            <button
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                activeTab === "created" ? "bg-[#8B75AA] text-white" : "text-[#2C1A1D] hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("created")}
            >
              <div className="flex items-center justify-center gap-2">
                <Edit size={20} />
                <span>Created Quests</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                  {quests.filter((q) => q.poster.id === currentUser.id).length}
                </span>
              </div>
            </button>
            <button
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                activeTab === "applied" ? "bg-[#8B75AA] text-white" : "text-[#2C1A1D] hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("applied")}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={20} />
                <span>Applied Quests</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                  {quests.filter((q) => q.applicants?.some((app) => app.userId === currentUser.id)).length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search quests by title or description..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl bg-gray-50 text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  sortField === "createdAt"
                    ? "bg-[#8B75AA] text-white border-[#8B75AA]"
                    : "bg-white text-[#2C1A1D] border-gray-300 hover:border-[#8B75AA]"
                }`}
                onClick={() => toggleSort("createdAt")}
              >
                <Calendar size={16} />
                <span>Date</span>
                {sortField === "createdAt" &&
                  (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  sortField === "deadline"
                    ? "bg-[#8B75AA] text-white border-[#8B75AA]"
                    : "bg-white text-[#2C1A1D] border-gray-300 hover:border-[#8B75AA]"
                }`}
                onClick={() => toggleSort("deadline")}
              >
                <Clock size={16} />
                <span>Deadline</span>
                {sortField === "deadline" &&
                  (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  sortField === "reward"
                    ? "bg-[#8B75AA] text-white border-[#8B75AA]"
                    : "bg-white text-[#2C1A1D] border-gray-300 hover:border-[#8B75AA]"
                }`}
                onClick={() => toggleSort("reward")}
              >
                <CircleDollarSign size={16} />
                <span>Reward</span>
                {sortField === "reward" &&
                  (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </button>
            </div>
          </div>
        </div>

        {/* Quests List */}
        {sortedQuests && sortedQuests.length > 0 ? (
          <div className="space-y-6">
            {sortedQuests.map((quest) => (
              <div
                key={quest.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Quest Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-[#2C1A1D] font-serif">{quest.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(quest.status)}`}
                        >
                          {quest.status.charAt(0).toUpperCase() + quest.status.slice(1)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold border ${getDifficultyColor(quest.difficulty)}`}
                        >
                          {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                        </span>
                      </div>

                      {/* Quest Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign size={18} className="text-[#CDAA7D]" />
                          <div>
                            <p className="text-xs text-gray-500">Reward</p>
                            <p className="font-bold text-[#2C1A1D]">{quest.reward} Gold</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star size={18} className="text-[#8B75AA]" />
                          <div>
                            <p className="text-xs text-gray-500">XP</p>
                            <p className="font-bold text-[#8B75AA]">{quest.xp} XP</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="font-medium text-gray-700">{quest.createdAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={18} className="text-red-500" />
                          <div>
                            <p className="text-xs text-gray-500">Deadline</p>
                            <p className="font-medium text-gray-700">{quest.deadline.toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      {activeTab === "created" && (
                        <>
                          <button
                            onClick={() => handleEditQuest(quest)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors"
                          >
                            <Edit size={16} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(quest.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                          >
                            <Trash size={16} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setExpandedQuestId(expandedQuestId === quest.id ? null : quest.id)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:border-[#8B75AA] transition-colors"
                      >
                        <Eye size={16} />
                        <span className="hidden sm:inline">
                          {expandedQuestId === quest.id ? "Hide Details" : "View Details"}
                        </span>
                        {expandedQuestId === quest.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedQuestId === quest.id && (
                  <div className="p-6 bg-gray-50">
                    {/* Description */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-[#2C1A1D] mb-3 font-serif">Quest Description</h4>
                      <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl border">
                        {quest.description}
                      </p>
                    </div>

                    {/* For Created Quests - Show Applicants */}
                    {activeTab === "created" && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-[#2C1A1D] font-serif">
                            Applicants ({quest.applicants?.length || 0})
                          </h4>
                          {quest.status === "in-progress" && (
                            <button
                              onClick={() => handleCompleteQuest(quest.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle size={16} />
                              <span>Mark as Completed</span>
                            </button>
                          )}
                        </div>

                        {quest.applicants && quest.applicants.length > 0 ? (
                          <div className="grid gap-4">
                            {quest.applicants.map((applicant) => (
                              <div
                                key={applicant.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-12 h-12 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {applicant.avatar}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h5 className="font-bold text-[#2C1A1D] text-lg">{applicant.username}</h5>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-bold border ${getApplicantStatusColor(applicant.status)}`}
                                      >
                                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                      Applied {applicant.appliedAt.toLocaleDateString()}
                                    </p>
                                    {applicant.message && (
                                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        "{applicant.message}"
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {applicant.status === "pending" && quest.status === "open" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleApproveApplicant(quest.id, applicant.userId)}
                                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                                    >
                                      <CheckCircle size={16} />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectApplicant(quest.id, applicant.userId)}
                                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                    >
                                      <XCircle size={16} />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No applicants yet. Share your quest to attract adventurers!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* For Applied Quests - Show Application Status */}
                    {activeTab === "applied" && (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border">
                          <h4 className="text-lg font-bold text-[#2C1A1D] mb-3 font-serif">Quest Giver</h4>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold">
                              {quest.poster.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-[#2C1A1D]">{quest.poster.username}</p>
                              <p className="text-sm text-[#8B75AA]">Quest Giver</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border">
                          <h4 className="text-lg font-bold text-[#2C1A1D] mb-3 font-serif">Your Application Status</h4>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-2 rounded-xl text-sm font-bold border ${getApplicantStatusColor(
                                quest.applicants.find((app) => app.userId === currentUser.id)?.status || "pending",
                              )}`}
                            >
                              {(quest.applicants.find((app) => app.userId === currentUser.id)?.status || "pending")
                                .charAt(0)
                                .toUpperCase() +
                                (
                                  quest.applicants.find((app) => app.userId === currentUser.id)?.status || "pending"
                                ).slice(1)}
                            </span>
                            <p className="text-gray-600">
                              Applied on{" "}
                              {quest.applicants
                                .find((app) => app.userId === currentUser.id)
                                ?.appliedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {quest.status === "in-progress" &&
                          quest.applicants.find((app) => app.userId === currentUser.id)?.status === "accepted" && (
                            <button
                              onClick={() => {
                                showToast("Work submitted successfully", "success")
                              }}
                              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors font-semibold"
                            >
                              <CheckCircle size={20} />
                              <span>Submit Completed Work</span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle size={64} className="mx-auto mb-6 text-gray-300" />
            <h3 className="text-2xl font-bold text-[#2C1A1D] mb-3 font-serif">No Quests Found</h3>
            <p className="text-gray-600 text-lg mb-6">
              {activeTab === "created"
                ? "You haven't created any quests yet. Start by posting your first quest!"
                : "You haven't applied to any quests yet. Browse the Quest Board to find exciting opportunities!"}
            </p>
            <button className="px-6 py-3 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors font-semibold">
              {activeTab === "created" ? "Create Your First Quest" : "Browse Quest Board"}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-[#2C1A1D] font-serif">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this quest? This action cannot be undone and all applications will be
              lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-[#2C1A1D] hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteQuest(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                Delete Quest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quest Modal */}
      {editingQuest && (
        <EditQuestModal
          isOpen={!!editingQuest}
          onClose={() => setEditingQuest(null)}
          quest={editingQuest}
          onSave={handleSaveQuest}
          showToast={showToast}
        />
      )}
    </section>
  )
}
