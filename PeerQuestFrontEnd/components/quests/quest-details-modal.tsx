"use client"

import { useState, useEffect } from "react"
import QuestSubmitWorkModal from "./quest-submit-work-modal"
import { X, CircleDollarSign, Star, Clock, Palette, Code, PenTool, Users, CheckCircle, Trash2, AlertCircle } from "lucide-react"
import type { Quest, User, Application } from "@/lib/types"
import { formatTimeRemaining, getDifficultyClass } from "@/lib/utils"
import { QuestAPI } from "@/lib/api/quests"
import { getMyApplications, getApplicationAttempts, type ApplicationAttemptInfo } from "@/lib/api/applications"
import { useGoldBalance } from "@/context/GoldBalanceContext"

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
  const [attemptInfo, setAttemptInfo] = useState<ApplicationAttemptInfo | null>(null)
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false)
  const [latestSubmissionStatus, setLatestSubmissionStatus] = useState<string | null>(null)
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null)
  const [isLoadingSubmissionStatus, setIsLoadingSubmissionStatus] = useState(false)
  
  // Add gold balance refresh capability
  const { refreshBalance } = useGoldBalance()

  // Check if user has already applied for this quest (only pending applications)
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

  // Check if user has been kicked
  const hasBeenKicked = quest ? userApplications.some(app => 
    app.quest.id === quest.id && app.status === 'kicked'
  ) : false

  // Check if quest is available for new applications
  const questNotAvailable = quest ? (quest.status === 'in-progress' || quest.status === 'completed') : false

  // Find the participant record for the current user (need this early for useEffect dependencies)
  const myParticipant = quest?.participants_detail?.find(
    (p) => p.user.id === parseInt(currentUser?.id || '0')
  );

  // Check if user is already a participant (either through participants_detail or approved application)
  // BUT exclude kicked users - they should no longer be considered participants
  const isAlreadyParticipant = !hasBeenKicked && (
    (quest?.participants_detail?.some((p) => p.user.id === parseInt(currentUser?.id || '0')) || false) || 
    hasApprovedApplication
  )

  // Only allow submit if user is a participant (either in participants_detail or has approved application) 
  // and the quest is in-progress AND user hasn't been kicked
  const canSubmitWork = (!!myParticipant || hasApprovedApplication) && 
    (quest?.status === "in-progress" || quest?.status === "in_progress") && 
    !hasBeenKicked;

  // Detailed debug logging for submit button troubleshooting
  if (isAuthenticated && currentUser && quest) {
    console.log('🔍 Quest Details Modal - Submit Button Debug:', {
      questTitle: quest.title,
      questStatus: quest.status,
      questStatusType: typeof quest.status,
      currentUserId: currentUser.id,
      myParticipant: myParticipant ? { id: myParticipant.id, userId: myParticipant.user?.id } : null,
      hasApprovedApplication,
      hasBeenKicked,
      isAlreadyParticipant,
      canSubmitWork,
      latestSubmissionStatus,
      submitButtonWillShow: canSubmitWork && (latestSubmissionStatus !== 'approved'),
      userApplications: userApplications.filter(app => app.quest.id === quest.id),
      statusCheck: {
        isInProgress: quest?.status === "in-progress",
        isInProgressAlt: quest?.status === "in_progress", 
        actualStatus: quest?.status,
        statusOptions: ["open", "in-progress", "in_progress", "completed"]
      }
    });
  }

  // Load user applications when modal opens and user is authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated && currentUser) {
      loadUserApplications()
      loadAttemptInfo()
    }
  }, [isOpen, isAuthenticated, currentUser, quest?.id])

  // Clear submission status when quest changes to prevent stale data
  useEffect(() => {
    setLatestSubmissionStatus(null)
    setSubmissionFeedback(null)
    setIsLoadingSubmissionStatus(false)
  }, [quest?.id])

  // Load submission status when participant info is available
  useEffect(() => {
    if (isOpen && isAuthenticated && currentUser && quest && isAlreadyParticipant && !isLoadingSubmissionStatus) {
      loadLatestSubmissionStatus()
    } else if (!isAlreadyParticipant) {
      // Clear status if user is not a participant
      setLatestSubmissionStatus(null)
      setSubmissionFeedback(null)
      setIsLoadingSubmissionStatus(false)
    }
  }, [isOpen, isAuthenticated, currentUser, myParticipant, quest?.id, isAlreadyParticipant])

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

  // Load application attempt information
  const loadAttemptInfo = async () => {
    if (!quest || !isAuthenticated) return
    
    setIsLoadingAttempts(true)
    try {
      const info = await getApplicationAttempts(quest.id)
      setAttemptInfo(info)
      console.log('📊 Quest Details Modal - Attempt info loaded:', info)
    } catch (error) {
      console.error('Failed to load attempt info:', error)
      // Don't show error to user, just fail silently
      setAttemptInfo(null)
    } finally {
      setIsLoadingAttempts(false)
    }
  }

  const loadLatestSubmissionStatus = async () => {
    if (!quest || !isAuthenticated || !currentUser || isLoadingSubmissionStatus) return
    
    // Only load for participants (either myParticipant or approved application)
    if (!isAlreadyParticipant) return
    
    setIsLoadingSubmissionStatus(true)
    try {
      const submissions = await QuestAPI.getQuestSubmissions(quest.slug)
      // Filter to only submissions from the current user for this specific quest
      const mySubmissions = submissions.filter(sub => 
        sub.participant_username === currentUser?.username
      )
      
      if (mySubmissions.length > 0) {
        // Get the latest submission (should be first since they're sorted by most recent)
        const latest = mySubmissions[0]
        setLatestSubmissionStatus(latest.status)
        setSubmissionFeedback(latest.feedback)
      } else {
        // Clear status if no submissions found for this user in this quest
        setLatestSubmissionStatus(null)
        setSubmissionFeedback(null)
      }
    } catch (error) {
      console.error('Failed to load submission status:', error)
      // Clear status on error
      setLatestSubmissionStatus(null)
      setSubmissionFeedback(null)
    } finally {
      setIsLoadingSubmissionStatus(false)
    }
  }

  if (!isOpen || !quest) return null

  const isQuestOwner = currentUser && quest.creator && (
    quest.creator.id === parseInt(currentUser.id) || 
    quest.creator.id.toString() === currentUser.id ||
    quest.creator.username === currentUser.username
  )

  // Debug logging for quest details
  console.log('👁️ Quest Details Modal - Quest data:', {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    descriptionLength: quest.description?.length || 0,
    creatorId: quest.creator?.id,
    creatorUsername: quest.creator?.username,
    currentUserId: currentUser?.id,
    currentUserUsername: currentUser?.username,
    isQuestOwner: isQuestOwner
  })

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
      showToast("Please login to apply for quests", "error")
      setAuthModalOpen(true)
      return
    }

    if (!currentUser) return

    // Safety check: Prevent quest owners from applying to their own quest
    if (isQuestOwner) {
      showToast("You cannot apply to your own quest", "error")
      return
    }

    try {
      console.log('🎯 Quest Details Modal - Applying for quest:', {
        questId: questId,
        questTitle: quest?.title,
        currentUser: currentUser.username
      })
      
      // Import the applications API
      const { createApplication } = await import("@/lib/api/applications")
      
      // Create application with a default message
      await createApplication(questId)
      
      console.log('✅ Quest Details Modal - Application submitted successfully')
      showToast("Application submitted successfully!")
      // Refresh applications and attempt info to update button state
      await loadUserApplications()
      await loadAttemptInfo()
      
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
      
      // Don't automatically close modal - let user see the updated state and close manually
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
      showToast("Quest editing coming soon", "info")
    }
  }

  const handleDeleteQuest = async () => {
    if (!quest || !currentUser) return

    try {
      setIsDeleting(true)
      console.log('🗑️ Deleting quest:', quest.id)
      
      const result = await QuestAPI.deleteQuest(quest.slug)
      console.log('✅ Quest deleted successfully')
      // Show backend message and refund info if available
      if (result && result.amount_refunded) {
        showToast(result.message || `Quest deleted successfully. ${result.amount_refunded} gold (quest reward only) has been refunded to your account. Commission fee is non-refundable.`, "success")
      } else {
        showToast("Quest deleted successfully")
      }
      // Refresh the gold balance after successful deletion
      console.log('🔄 Refreshing gold balance after quest deletion...')
      refreshBalance()
      // Remove the quest from the list
      setQuests(prevQuests => prevQuests.filter(q => q.id !== quest.id))
      
      // Close both modals
      setShowDeleteConfirmation(false)
      onClose()
      
      // Refresh quest data if callback is provided
      if (onQuestUpdate) {
        await onQuestUpdate()
      }
    } catch (error) {
      console.error('❌ Failed to delete quest:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete quest. Please try again."
      showToast(errorMessage, "error")
    } finally {
      setIsDeleting(false)
    }
  }

  // Check application eligibility based on new rules
  const getApplicationEligibility = () => {
    if (!quest || !currentUser) return { canApply: false, reason: "Not authenticated" }
    
    // First check: Quest owner cannot apply to their own quest
    if (isQuestOwner) return { canApply: false, reason: "Cannot apply to your own quest" }
    
    if (!isAuthenticated) return { canApply: false, reason: "Please log in to apply for quests" }
    
    if (questNotAvailable) {
      return { 
        canApply: false, 
        reason: quest.status === 'in-progress' ? "Quest In Progress" : "Quest Completed" 
      }
    }
    
    if (hasAlreadyApplied) {
      return { canApply: false, reason: "Application Pending" }
    }
    
    if (hasApprovedApplication || isAlreadyParticipant) {
      return { canApply: false, reason: "Already Participating" }
    }
    
    // Use attempt info from the API if available
    if (attemptInfo) {
      if (!attemptInfo.can_apply) {
        // Create a detailed reason with attempt count
        if (attemptInfo.max_attempts !== null) {
          return { 
            canApply: false, 
            reason: `Max attempts reached (${attemptInfo.attempt_count}/${attemptInfo.max_attempts})` 
          }
        } else {
          return { canApply: false, reason: attemptInfo.reason }
        }
      }
      
      // If they can apply, show attempt count if they have previous attempts
      if (attemptInfo.attempt_count > 0) {
        const attemptsText = attemptInfo.max_attempts 
          ? ` (${attemptInfo.attempt_count}/${attemptInfo.max_attempts})`
          : ` (${attemptInfo.attempt_count} attempts)`
        
        if (attemptInfo.last_application_status === 'kicked') {
          return { canApply: true, reason: `Re-apply${attemptsText}` }
        } else if (attemptInfo.last_application_status === 'rejected') {
          const remaining = attemptInfo.max_attempts ? attemptInfo.max_attempts - attemptInfo.attempt_count : 'unlimited'
          return { canApply: true, reason: `Try again${attemptsText}, ${remaining} remaining` }
        }
      }
    }
    
    // Fallback to old logic if attemptInfo not available
    if (hasBeenKicked) {
      return { canApply: true, reason: "Can re-apply after being kicked" }
    }
    
    if (hasRejectedApplication) {
      return { canApply: true, reason: "Can re-apply after rejection" }
    }
    
    return { canApply: true, reason: "Can apply" }
  }
  
  const applicationEligibility = getApplicationEligibility()

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
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close quest details modal"
              title="Close"
            >
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
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <CircleDollarSign size={16} className="text-white" />
                </div>
                {(quest.gold_reward || 0) > 0 ? (
                  <span className="font-bold text-amber-600">{quest.gold_reward} Gold</span>
                ) : (
                  <span className="font-bold text-gray-400">No gold reward</span>
                )}
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
              <p className="text-[#2C1A1D] leading-relaxed whitespace-pre-wrap">{quest.description}</p>
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

            {/* Unified Application Status Notification (for non-owners) */}
            {!isQuestOwner && isAuthenticated && (
              <>
                {/* Active Participation or Pending Application */}
                {(isAlreadyParticipant || hasApprovedApplication || hasAlreadyApplied) && (
                  <div className={`p-4 rounded-lg ${
                    isAlreadyParticipant || hasApprovedApplication
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isAlreadyParticipant || hasApprovedApplication ? (
                        <>
                          <CheckCircle size={20} className="text-green-700" />
                          <h4 className="text-lg font-bold text-green-800">Quest Participant</h4>
                        </>
                      ) : (
                        <>
                          <Clock size={20} className="text-amber-700" />
                          <h4 className="text-lg font-bold text-amber-800">Application Pending</h4>
                        </>
                      )}
                    </div>
                    
                    <p className={isAlreadyParticipant || hasApprovedApplication ? 'text-green-700' : 'text-amber-700'}>
                      {isAlreadyParticipant || hasApprovedApplication
                        ? hasApprovedApplication 
                          ? "Your application has been approved! You are now participating in this quest."
                          : "You are currently participating in this quest."
                        : "Your application is currently under review by the quest creator."
                      }
                    </p>

                    {/* Show attempt info for pending applications */}
                    {hasAlreadyApplied && !isAlreadyParticipant && !hasApprovedApplication && attemptInfo && attemptInfo.attempt_count > 0 && (
                      <div className="mt-2 text-sm text-amber-600 bg-amber-100 rounded px-2 py-1">
                        {attemptInfo.max_attempts ? (
                          <>Attempt <span className="font-bold">{attemptInfo.attempt_count}/{attemptInfo.max_attempts}</span></>
                        ) : (
                          <>Application #{attemptInfo.attempt_count}</>
                        )}
                      </div>
                    )}
                    
                    {/* Submission Status Display for active participants */}
                    {(isAlreadyParticipant || hasApprovedApplication) && (latestSubmissionStatus || isLoadingSubmissionStatus) && (
                      <div className="mt-3">
                        {isLoadingSubmissionStatus ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              <span className="font-semibold text-gray-700">Updating Status...</span>
                            </div>
                            <p className="text-gray-600 text-sm">Refreshing your submission status...</p>
                          </div>
                        ) : (
                          <>
                            {latestSubmissionStatus === 'pending' && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock size={16} className="text-blue-600" />
                                  <span className="font-semibold text-blue-800">Submission Status</span>
                                </div>
                                <p className="text-blue-700 text-sm">Your work is under review by the quest creator.</p>
                              </div>
                            )}
                            
                            {latestSubmissionStatus === 'needs_revision' && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertCircle size={16} className="text-amber-600" />
                                  <span className="font-semibold text-amber-800">Revision Required</span>
                                </div>
                                <p className="text-amber-700 text-sm">Your submission needs revision. Please submit updated work.</p>
                                {submissionFeedback && (
                                  <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                                    <strong>Feedback:</strong> {submissionFeedback}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {latestSubmissionStatus === 'approved' && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle size={16} className="text-amber-600" />
                                  <span className="font-semibold text-amber-800">Work Approved</span>
                                </div>
                                <p className="text-amber-700 text-sm">Congratulations! Your work has been approved.</p>
                                {submissionFeedback && (
                                  <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                                    <strong>Feedback:</strong> {submissionFeedback}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Submit Completed Work Button for active participants */}
                    {canSubmitWork && (latestSubmissionStatus !== 'approved') && (
                      <button
                        className="mt-4 px-5 py-2 bg-gradient-to-r from-purple-500 to-amber-500 text-white rounded-lg font-semibold shadow hover:from-purple-600 hover:to-amber-600 transition-colors"
                        onClick={() => setShowSubmitWorkModal(true)}
                      >
                        {latestSubmissionStatus === 'needs_revision' ? 'Submit Revised Work' : 'Submit Completed Work'}
                      </button>
                    )}
                  </div>
                )}

                {/* Application History & Previous Status (for users who can reapply) */}
                {!hasAlreadyApplied && !isAlreadyParticipant && !hasApprovedApplication && attemptInfo && attemptInfo.attempt_count > 0 && (
                  <div className={`p-4 rounded-lg ${
                    hasBeenKicked 
                      ? 'bg-orange-50 border border-orange-200'
                      : hasRejectedApplication
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {hasBeenKicked ? (
                        <>
                          <AlertCircle size={20} className="text-orange-700" />
                          <h4 className="text-lg font-bold text-orange-800">Previously Removed</h4>
                        </>
                      ) : hasRejectedApplication ? (
                        <>
                          <X size={20} className="text-red-700" />
                          <h4 className="text-lg font-bold text-red-800">Application Not Accepted</h4>
                        </>
                      ) : (
                        <>
                          <Clock size={20} className="text-gray-700" />
                          <h4 className="text-lg font-bold text-gray-800">Application History</h4>
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {/* Main status message */}
                      <p className={
                        hasBeenKicked 
                          ? 'text-orange-700'
                          : hasRejectedApplication
                          ? 'text-red-700'
                          : 'text-gray-700'
                      }>
                        {hasBeenKicked 
                          ? "You were previously removed from this quest, but you can re-apply if you wish to participate again."
                          : hasRejectedApplication
                          ? attemptInfo.can_apply 
                            ? "Your previous application was not accepted, but you can apply again if the quest is still open."
                            : "Your previous application was not accepted and you have reached the maximum number of attempts."
                          : "You have previously applied for this quest."
                        }
                      </p>
                      
                      {/* Attempt information with visual emphasis on key details */}
                      <div className={`text-sm rounded px-3 py-2 ${
                        hasBeenKicked 
                          ? 'text-orange-600 bg-orange-100'
                          : hasRejectedApplication
                          ? 'text-red-700 bg-red-100'
                          : 'text-gray-600 bg-gray-100'
                      }`}>
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span>Applications made:</span>
                          <span className="font-bold text-lg">{attemptInfo.attempt_count}</span>
                          {attemptInfo.max_attempts && (
                            <>
                              <span>of</span>
                              <span className="font-bold text-lg">{attemptInfo.max_attempts}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1">
                          {attemptInfo.max_attempts ? (
                            attemptInfo.can_apply ? (
                              <span className="text-green-700 font-medium">
                                ✓ {attemptInfo.max_attempts - attemptInfo.attempt_count} attempts remaining
                              </span>
                            ) : (
                              <span className="text-red-800 font-medium">✗ No attempts remaining</span>
                            )
                          ) : (
                            <span className="text-green-700 font-medium">✓ Unlimited attempts available</span>
                          )}
                        </div>
                        
                        {attemptInfo.last_application_status && (
                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                            <span className="text-xs opacity-75">
                              Last status: <span className="font-medium capitalize">{attemptInfo.last_application_status}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
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
                <button
                  onClick={handleManageQuest}
                  className="px-6 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors font-medium shadow-md"
                >
                  Edit Quest
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={quest.status === 'in-progress' || quest.status === 'completed'}
                  className={`px-6 py-2 rounded-lg font-medium shadow-md flex items-center gap-2 transition-colors ${
                    quest.status === 'in-progress' || quest.status === 'completed'
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={
                    quest.status === 'in-progress' 
                      ? 'Cannot delete a quest that is in progress'
                      : quest.status === 'completed'
                      ? 'Cannot delete a completed quest'
                      : 'Delete this quest'
                  }
                >
                  <Trash2 size={16} />
                  Delete Quest
                </button>
              </div>
            ) : isAuthenticated ? (
              <button
                onClick={() => applyForQuest(quest.id)}
                className={`px-6 py-2 rounded-lg font-medium shadow-md transition-colors ${
                  !applicationEligibility.canApply || isLoadingApplications
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-[#8B75AA] text-white hover:bg-[#7A6699]'
                }`}
                disabled={!applicationEligibility.canApply || isLoadingApplications || isLoadingAttempts}
              >
                {isLoadingApplications || isLoadingAttempts
                  ? "Loading..."
                  : !applicationEligibility.canApply
                    ? applicationEligibility.reason
                    : attemptInfo && attemptInfo.attempt_count > 0
                      ? attemptInfo.last_application_status === 'kicked'
                        ? "Re-apply to Quest"
                        : "Apply Again"
                      : "Apply for Quest"}
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors font-medium shadow-md"
              >
                Login to Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quest Submit Work Modal */}
      {showSubmitWorkModal && canSubmitWork && (
        <QuestSubmitWorkModal
          isOpen={showSubmitWorkModal}
          onClose={() => setShowSubmitWorkModal(false)}
          onSuccess={() => {
            setShowSubmitWorkModal(false);
            showToast("Work submitted successfully!", "success");
            // Just refresh submission status - don't call onQuestUpdate to avoid double refresh
            loadLatestSubmissionStatus();
          }}
          questParticipantId={myParticipant?.id}
          applicationId={hasApprovedApplication && !myParticipant ? 
            userApplications.find(app => app.quest.id === quest?.id && app.status === 'approved')?.id : 
            undefined
          }
          questTitle={quest?.title}
          questSlug={quest?.slug}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div
            className="bg-white rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-6 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Delete Quest</h3>
                  <p className="text-white/80">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete the quest <strong>"{quest?.title}"</strong>?
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <div className="text-orange-800 text-sm">
                      <p className="font-semibold mb-1">This will permanently:</p>
                      <ul className="list-disc list-inside space-y-1 text-orange-700">
                        <li>Delete the quest and all its data</li>
                        <li>Remove all applications for this quest</li>
                        <li>Notify all applicants and participants</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQuest}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Quest
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
