"use client"

import { X, ScrollText, Users, CheckCircle, XCircle, Clock, Star, CircleDollarSign, Calendar } from "lucide-react"
import type { Quest, User as UserType } from "@/lib/types"
import { getDifficultyClass } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useClickSound } from "@/hooks/use-click-sound"
import { useAudioContext } from "@/context/audio-context"

interface ApplicationsModalProps {
  isOpen: boolean
  onClose: () => void
  quests: Quest[]
  currentUser: UserType | null
  setQuests: (quests: Quest[] | ((prev: Quest[]) => Quest[])) => void
}

export function ApplicationsModal({ isOpen, onClose, quests, currentUser, setQuests }: ApplicationsModalProps) {
  if (!isOpen || !currentUser) return null

  const { soundEnabled, volume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume })

  const myApplications = quests.filter((quest) => quest.applicants.some((app) => app.userId === currentUser.id))
  const myQuests = quests.filter((quest) => quest.poster.id === currentUser.id && quest.applicants.length > 0)

  const handleApproveApplicant = (questId: number, applicantId: number) => {
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.id === questId) {
          return {
            ...q,
            status: "in_progress" as const,
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
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-2">Quest Applications</h2>
              <p className="text-white/90">Manage your quest applications and review incoming requests</p>
            </div>
            <Button 
              onClick={onClose} 
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white hover:text-white"
              soundType="modal"
            >
              <X size={24} />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* My Applications */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#8B75AA]/10 rounded-xl">
                  <ScrollText className="w-6 h-6 text-[#8B75AA]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#2C1A1D] font-serif">My Applications</h3>
                  <p className="text-[#8B75AA]">Quests you've applied for</p>
                </div>
              </div>

              {myApplications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <ScrollText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No Applications Yet</h4>
                  <p className="text-gray-500">
                    You haven't applied for any quests yet. Browse the Quest Board to find opportunities!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((quest) => {
                    const myApplication = quest.applicants.find((app) => app.userId === currentUser.id)
                    return (
                      <div
                        key={quest.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                      >
                        {/* Quest Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-[#2C1A1D] mb-2 font-serif">{quest.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyClass(quest.difficulty)}`}
                              >
                                {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(myApplication?.status || "pending")}`}
                              >
                                {(myApplication?.status || "pending").charAt(0).toUpperCase() +
                                  (myApplication?.status || "pending").slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quest Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
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
                              <p className="text-xs text-gray-500">Applied</p>
                              <p className="font-medium text-gray-700">
                                {myApplication?.appliedAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-red-500" />
                            <div>
                              <p className="text-xs text-gray-500">Deadline</p>
                              <p className="font-medium text-gray-700">{new Date(quest.deadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Quest Description */}
                        <p className="text-gray-600 mb-4 line-clamp-2">{quest.description}</p>

                        {/* Quest Poster */}
                        <div className="flex items-center gap-3 p-3 bg-[#F4F0E6] rounded-xl">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold">
                            {quest.poster.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2C1A1D]">{quest.poster.username}</p>
                            <p className="text-sm text-[#8B75AA]">Quest Giver</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Applications to My Quests */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#CDAA7D]/10 rounded-xl">
                  <Users className="w-6 h-6 text-[#CDAA7D]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#2C1A1D] font-serif">Incoming Applications</h3>
                  <p className="text-[#8B75AA]">Applications to your quests</p>
                </div>
              </div>

              {myQuests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No Applications Yet</h4>
                  <p className="text-gray-500">
                    No one has applied to your quests yet. Make sure your quests are attractive and well-described!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {myQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                    >
                      {/* Quest Header */}
                      <div className="mb-6">
                        <h4 className="text-xl font-bold text-[#2C1A1D] mb-2 font-serif">{quest.title}</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyClass(quest.difficulty)}`}
                          >
                            {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                            {quest.applicants.length} {quest.applicants.length === 1 ? "Applicant" : "Applicants"}
                          </span>
                        </div>
                      </div>

                      {/* Applicants */}
                      <div className="space-y-4">
                        {quest.applicants.map((applicant) => (
                          <div
                            key={applicant.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {applicant.avatar}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h5 className="font-bold text-[#2C1A1D] text-lg">{applicant.username}</h5>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(applicant.status)}`}
                                  >
                                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">
                                  Applied {applicant.appliedAt.toLocaleDateString()}
                                </p>
                                {applicant.message && (
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                                    "{applicant.message}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {applicant.status === "pending" && quest.status === "open" && (
                              <div className="flex gap-2 sm:flex-col lg:flex-row">
                                <Button
                                  onClick={() => handleApproveApplicant(quest.id, applicant.userId)}
                                  variant="default"
                                  size="sm"
                                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                                  soundType="success"
                                >
                                  <CheckCircle size={16} />
                                  <span className="hidden sm:inline">Accept</span>
                                </Button>
                                <Button
                                  onClick={() => handleRejectApplicant(quest.id, applicant.userId)}
                                  variant="destructive"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  soundType="error"
                                >
                                  <XCircle size={16} />
                                  <span className="hidden sm:inline">Reject</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
