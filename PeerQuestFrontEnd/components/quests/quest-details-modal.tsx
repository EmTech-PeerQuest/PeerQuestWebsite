"use client"

import { useState, useEffect } from "react"
import { X, CircleDollarSign, Star, Clock, Palette, Code, PenTool, Users, CheckCircle } from "lucide-react"
import type { Quest, User, Application } from "@/lib/types"
import { formatTimeRemaining, getDifficultyClass } from "@/lib/utils"
import { QuestAPI } from "@/lib/api/quests"
import { getMyApplications } from "@/lib/api/applications"

interface QuestDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  quest: Quest | null
  currentUser: User | null
  isAuthenticated: boolean
  setQuests: (quests: Quest[] | ((prev: Quest[]) => Quest[])) => void
  showToast: (message: string, type?: string) => void
  setAuthModalOpen: (open: boolean) => void
  openEditQuestModal?: (quest: Quest) => void
  onQuestUpdate?: () => Promise<void>
}

export function QuestDetailsModal({
  isOpen,
  onClose,
  quest,
  currentUser,
  isAuthenticated,
  setQuests,
  showToast,
  setAuthModalOpen,
  openEditQuestModal,
  onQuestUpdate,
}: QuestDetailsModalProps) {
  const [userApplications, setUserApplications] = useState<Application[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)

  // Check if user has already applied for this quest
  const hasAlreadyApplied = quest ? userApplications.some(app => 
    app.quest.id === quest.id && app.status === 'pending'
  ) : false

  // Check if user has an approved application
  const hasApprovedApplication = quest ? userApplications.some(app => 
    app.quest.id === quest.id && app.status === 'approved'
  ) : false

  // Check if user has a rejected application
  const hasRejectedApplication = quest ? userApplications.some(app => 
    app.quest.id === quest.id && app.status === 'rejected'
  ) : false

  // Check if user is already a participant (either through participants_detail or approved application)
  const isAlreadyParticipant = (quest?.participants_detail?.some((p) => p.user.id === currentUser?.id) || false) || hasApprovedApplication

  // Load user applications when modal opens and user is authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated && currentUser) {
      loadUserApplications()
    }
  }, [isOpen, isAuthenticated, currentUser])

  const loadUserApplications = async () => {
    try {
      setIsLoadingApplications(true)
      const applications = await getMyApplications()
      setUserApplications(applications)
    } catch (error) {
      console.error('Failed to load user applications:', error)
    } finally {
      setIsLoadingApplications(false)
    }
  }

  if (!isOpen || !quest) return null

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "design":
        return <Palette size={16} />
      case "development":
        return <Code size={16} />
      case "writing":
        return <PenTool size={16} />
      default:
        return <Palette size={16} />
    }
  }

  const applyForQuest = async (questId: number) => {
    if (!isAuthenticated) {
      showToast("Please log in to apply for quests", "error")
      setAuthModalOpen(true)
      return
    }

    if (!currentUser) return

    try {
      console.log('🎯 Quest Details Modal - Applying for quest:', {
        questId: questId,
        questTitle: quest?.title,
        currentUser: currentUser.username
      })
      
      // Import the applications API
      const { createApplication } = await import("@/lib/api/applications")
      
      // Create application with a default message
      await createApplication(questId, "I'm interested in working on this quest.")
      
      console.log('✅ Quest Details Modal - Application submitted successfully')
      showToast("Application submitted successfully!")
      // Refresh applications to update button state
      await loadUserApplications()
      
      // Refresh quest data to update applications_count
      if (onQuestUpdate) {
        // If parent provides a refresh callback, use it to reload fresh data
        await onQuestUpdate()
      } else {
        // Fallback: Update the quest's applications_count locally
        setQuests(prevQuests => 
          prevQuests.map(q => 
            q.id === quest.id 
              ? { ...q, applications_count: (q.applications_count || 0) + 1 }
              : q
          )
        )
      }
      
      onClose()
    } catch (error) {
      console.error('❌ Quest Details Modal - Failed to apply for quest:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to apply for quest. Please try again."
      showToast(errorMessage, "error")
    }
  }

  const handleManageQuest = () => {
    if (openEditQuestModal) {
      openEditQuestModal(quest)
      onClose()
    } else {
      showToast("Quest editing coming soon!", "info")
    }
  }

  const isQuestOwner = currentUser && quest.creator && quest.creator.id === currentUser.id

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-serif mb-2">Quest Details</h2>
              <p className="text-white/80">Complete quest information and requirements</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Title and Difficulty */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#2C1A1D] font-serif flex-1">{quest.title}</h3>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-bold self-start ${getDifficultyClass(quest.difficulty)}`}
              >
                {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
              </span>
            </div>

            {/* Quest Meta Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F4F0E6] rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {getCategoryIcon(quest.category.name.toLowerCase())}
                <span className="font-medium text-[#2C1A1D]">
                  {quest.category.name.charAt(0).toUpperCase() + quest.category.name.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-40 pointer-events-none select-none">
                <CircleDollarSign size={16} className="text-gray-400" />
                <span className="font-bold text-gray-500">Coming Soon</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center">
                  <Star size={16} className="text-white" />
                </div>
                <span className="font-bold text-[#8B75AA]">{quest.xp_reward} XP</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-[#8B75AA]" />
                <span className="font-medium text-[#8B75AA]">{quest.due_date ? new Date(quest.due_date).toLocaleDateString() : 'No deadline'}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-lg font-bold mb-3 text-[#2C1A1D] font-serif">Description</h4>
              <p className="text-[#2C1A1D] leading-relaxed">{quest.description}</p>
            </div>

            {/* Requirements */}
            {quest.requirements && Array.isArray(quest.requirements) && quest.requirements.length > 0 && (
              <div>
                <h4 className="text-lg font-bold mb-3 text-[#2C1A1D] font-serif">Requirements</h4>
                <ul className="space-y-2">
                  {quest.requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-[#8B75AA] rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-[#2C1A1D]">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quest Poster */}
            <div className="bg-gradient-to-r from-[#CDAA7D]/10 to-[#8B75AA]/10 p-4 rounded-lg">
              <h4 className="text-lg font-bold mb-3 text-[#2C1A1D] font-serif">Quest Giver</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {quest.creator.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-[#2C1A1D] text-lg">{quest.creator.username}</div>
                  <div className="text-sm text-[#8B75AA]">Quest Giver</div>
                </div>
              </div>
            </div>

            {/* Application Status (for non-owners) */}
            {!isQuestOwner && isAuthenticated && (isAlreadyParticipant || hasApprovedApplication) && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-green-700" />
                  <h4 className="text-lg font-bold text-green-800">Quest Participant</h4>
                </div>
                <p className="text-green-700">
                  {hasApprovedApplication 
                    ? "Your application has been approved! You are now participating in this quest."
                    : "You are currently participating in this quest."
                  }
                </p>
              </div>
            )}

            {!isQuestOwner && isAuthenticated && hasAlreadyApplied && !isAlreadyParticipant && !hasApprovedApplication && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} className="text-amber-700" />
                  <h4 className="text-lg font-bold text-amber-800">Your Application</h4>
                </div>
                <p className="text-amber-700">
                  You have already applied for this quest. Your application is currently pending review.
                </p>
              </div>
            )}

            {!isQuestOwner && isAuthenticated && hasRejectedApplication && !isAlreadyParticipant && !hasAlreadyApplied && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <X size={20} className="text-red-700" />
                  <h4 className="text-lg font-bold text-red-800">Application Status</h4>
                </div>
                <p className="text-red-700">
                  Your application for this quest was not accepted. You can apply again if the quest is still open.
                </p>
              </div>
            )}

            {/* Applications Count (for quest owner) */}
            {isQuestOwner && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-blue-700" />
                  <h4 className="text-lg font-bold text-blue-800">Applications</h4>
                </div>
                <p className="text-blue-700">
                  {quest.applications_count} {quest.applications_count === 1 ? "person has" : "people have"} applied for
                  this quest.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#CDAA7D]/20 p-6 bg-[#F4F0E6]/30">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-[#CDAA7D] rounded-lg text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors font-medium"
            >
              Close
            </button>

            {isQuestOwner ? (
              <div className="flex gap-3">
                <div className="px-4 py-2 bg-[#8B75AA]/10 text-[#8B75AA] rounded-lg font-medium flex items-center">
                  Your Quest
                </div>
                <button
                  onClick={handleManageQuest}
                  className="px-6 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors font-medium shadow-md"
                >
                  Edit Quest
                </button>
              </div>
            ) : (
              <button
                onClick={() => applyForQuest(quest.id)}
                className={`px-6 py-2 rounded-lg font-medium shadow-md transition-colors ${
                  !isAuthenticated || isAlreadyParticipant || hasAlreadyApplied || isLoadingApplications
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-[#8B75AA] text-white hover:bg-[#7A6699]'
                }`}
                disabled={!isAuthenticated || isAlreadyParticipant || hasAlreadyApplied || isLoadingApplications}
              >
                {!isAuthenticated
                  ? "Login to Apply"
                  : isAlreadyParticipant
                    ? "Already Participating"
                    : hasAlreadyApplied
                      ? "Application Pending"
                      : isLoadingApplications
                        ? "Loading..."
                        : hasRejectedApplication
                          ? "Apply Again"
                          : "Apply for Quest"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
