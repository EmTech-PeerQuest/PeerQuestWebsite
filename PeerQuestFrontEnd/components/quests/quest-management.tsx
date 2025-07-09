"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Users,
  Plus,
} from "lucide-react"
import type { Quest, User as UserType, Application } from "@/lib/types"
import { QuestAPI } from "@/lib/api/quests"
import { getApplicationsToMyQuests, getMyApplications, approveApplication, rejectApplication, kickParticipant } from "@/lib/api/applications"
import { QuestDetailsModal } from "./quest-details-modal"
import QuestSubmitWorkModal from "./quest-submit-work-modal"
import QuestForm from "./quest-form"
import { QuestManagementApplicationsModal } from "@/components/modals/quest-management-applications-modal"
import QuestSubmissionsModal from "@/components/modals/quest-submissions-modal"
import { useGoldBalance } from "@/context/GoldBalanceContext"

interface QuestManagementProps {
  currentUser: UserType
  onQuestStatusChange: (questId: number, newStatus: string) => void
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>
  showToast: (message: string, type?: string) => void
}

export function QuestManagement({
  currentUser,
  onQuestStatusChange,
  setQuests,
  showToast,
}: QuestManagementProps) {
  // State for quest submission modal
  const [showSubmitWorkModal, setShowSubmitWorkModal] = useState(false)
  const [submitWorkQuest, setSubmitWorkQuest] = useState<Quest | null>(null)
  const [activeTab, setActiveTab] = useState<"created" | "participating">("created")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"created_at" | "due_date" | "xp_reward">("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [expandedQuestId, setExpandedQuestId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [showQuestDetails, setShowQuestDetails] = useState(false)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [myQuests, setMyQuests] = useState<{ created: Quest[], participating: Quest[] }>({ created: [], participating: [] })
  const [loading, setLoading] = useState(true)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedQuestForApplications, setSelectedQuestForApplications] = useState<Quest | null>(null)
  const [questApplications, setQuestApplications] = useState<{ [questId: number]: Application[] }>({})
  const [loadingApplications, setLoadingApplications] = useState<{ [questId: number]: boolean }>({})
  const [processingApplications, setProcessingApplications] = useState<Set<number>>(new Set())
  const [removalTarget, setRemovalTarget] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  
  // Gold balance context for automatic updates
  const { refreshBalance } = useGoldBalance()
  
  /**
   * Handle kicking a participant from a quest
   * This function will:
   * 1. Update the participant's application status to "kicked"
   * 2. If the quest was "in-progress" and no approved participants remain, revert quest status to "open"
   * 3. Refresh quest data to ensure the kicked participant loses access
   * 4. Notify the quest maker of the status change
   */
  const handleRemoveApplicant = async (applicationId: number, questId: number) => {
    setProcessingApplications((prev: Set<number>) => new Set(prev).add(applicationId));
    try {
      let reason = removalReason;
      if (removalTarget !== applicationId) reason = "";
      
      // Find the quest to check its current status and get its slug
      const quest = [...myQuests.created, ...myQuests.participating].find(q => q.id === questId);
      if (!quest) {
        throw new Error('Quest not found');
      }
      
      // Store original status for comparison
      const originalStatus = quest.status;
      
      // Kick the participant (backend will handle quest status reversion automatically)
      await kickParticipant(applicationId, reason);
      
      // Clear cached applications for this quest to force reload
      setQuestApplications(prev => {
        const updated = { ...prev };
        delete updated[questId];
        return updated;
      });
      
      // Reload quest applications to get updated data with force refresh
      await loadQuestApplications(questId, true);
      
      setRemovalReason("");
      setRemovalTarget(null);
      await loadMyQuests(); // This will refresh all quest data including updated status
      showToast("Participant kicked successfully", "success");
    } catch (err) {
      console.error('Failed to kick participant:', err);
      showToast('Failed to kick participant', 'error');
    } finally {
      setProcessingApplications((prev: Set<number>) => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };
  const [userApplications, setUserApplications] = useState<Application[]>([])
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsQuest, setSubmissionsQuest] = useState<Quest | null>(null);

  // Load user's quests on component mount and when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadMyQuests()
    } else {
      setMyQuests({ created: [], participating: [] })
      setLoading(false)
    }
  }, [currentUser])

  const loadMyQuests = async () => {
    try {
      setLoading(true)
      
      // Load fresh quest data from API instead of relying on props
      const questResponse = await QuestAPI.getQuests()
      
      // Handle both response formats: array directly or wrapped in results/value
      const allQuests = Array.isArray(questResponse) 
        ? questResponse 
        : (questResponse.results || questResponse.value || [])

      // DEBUG: Log the quest data being processed
      console.log('🔍 Quest Management Debug - Raw quest data:', {
        totalQuests: allQuests.length,
        currentUserId: currentUser?.id,
        questTitles: allQuests.map(q => q.title)
      })
      
      // Safety check
      if (!currentUser?.id) {
        setMyQuests({ created: [], participating: [] })
        return
      }
      
      if (!allQuests || allQuests.length === 0) {
        setMyQuests({ created: [], participating: [] })
        return
      }
      
      // Load user's applications to determine participating quests
      let userApplications: Application[] = []
      try {
        const myApplications = await getMyApplications()
        userApplications = myApplications || []
        setUserApplications(userApplications) // Store for use in UI

        // DEBUG: Log applications data
        console.log('🔍 Quest Management Debug - User applications:', {
          totalApplications: userApplications.length,
          applicationQuestIds: userApplications.map(app => ({ id: app.quest.id, title: app.quest.title, status: app.status }))
        })
      } catch (error) {
        console.error('Failed to load user applications:', error)
        // Continue without applications data
      }
      
      // Filter quests based on user relationship
      const createdQuests = allQuests.filter((quest: Quest) => {
        return String(quest.creator?.id) === String(currentUser?.id)
      })
      
      const participatingQuests = allQuests.filter((quest: Quest) => {
        // Don't include quests created by the user
        if (String(quest.creator?.id) === String(currentUser?.id)) {
          return false
        }
        
        // Check if user is in participants_detail (traditional participants)
        const isInParticipants = quest.participants_detail && 
          quest.participants_detail.some((p: any) => String(p.user?.id) === String(currentUser?.id))
        
        // Check if user has an approved application for this quest
        const hasApprovedApplication = userApplications.some(app => 
          app.quest.id === quest.id && app.status === 'approved'
        )
        
        // Check if user has been kicked from this quest
        const hasBeenKicked = userApplications.some(app => 
          app.quest.id === quest.id && app.status === 'kicked'
        )

        // DEBUG: Log each quest evaluation
        if ((isInParticipants || hasApprovedApplication) && !hasBeenKicked) {
          console.log('🔍 Quest Management Debug - Quest included in participating:', {
            questId: quest.id,
            questTitle: quest.title,
            isInParticipants,
            hasApprovedApplication,
            hasBeenKicked,
            participantsCount: quest.participants_detail?.length || 0,
            participants: quest.participants_detail?.map(p => ({ userId: p.user?.id, username: p.user?.username }))
          })
        }
        
        // Include if user is participating AND has not been kicked OR has an active approved application
        // Note: Kicked users who re-apply and get approved should show up again
        return (isInParticipants || hasApprovedApplication) && !hasBeenKicked
      })

      // DEBUG: Log final results
      console.log('🔍 Quest Management Debug - Final quest filtering results:', {
        createdQuests: createdQuests.map(q => ({ id: q.id, title: q.title })),
        participatingQuests: participatingQuests.map(q => ({ id: q.id, title: q.title }))
      })
      
      setMyQuests({
        created: createdQuests,
        participating: participatingQuests
      });
      // If setQuests expects a flat array, pass all quests
      if (typeof setQuests === 'function') {
        setQuests([...createdQuests, ...participatingQuests]);
      }
    } catch (error) {
      console.error('Failed to load user quests:', error)
      showToast('Failed to load your quests', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load applications for a specific quest
  const loadQuestApplications = async (questId: number, forceRefresh = false) => {
    if (!forceRefresh && (loadingApplications[questId] || questApplications[questId])) {
      return // Already loading or loaded
    }

    setLoadingApplications((prev) => ({ ...prev, [questId]: true }))
    try {
      const allApplications = await getApplicationsToMyQuests()
      const questSpecificApplications = allApplications.filter(app => app.quest.id === questId)
      setQuestApplications((prev: { [questId: number]: Application[] }) => ({ ...prev, [questId]: questSpecificApplications }))
    } catch (error) {
      console.error('Failed to load applications for quest:', questId, error)
      showToast('Failed to load applications', 'error')
    } finally {
      setLoadingApplications((prev) => ({ ...prev, [questId]: false }))
    }
  }

  // Handle expanding quest details - load applications when expanded
  const handleExpandQuest = (questId: number) => {
    const newExpandedId = expandedQuestId === questId ? null : questId
    setExpandedQuestId(newExpandedId)
    
    // Load applications when expanding a created quest
    if (newExpandedId && activeTab === "created") {
      loadQuestApplications(newExpandedId)
    }
  }

  // Handle approving application
  const handleApproveApplication = async (applicationId: number, questId: number) => {
    setProcessingApplications((prev: Set<number>) => new Set(prev).add(applicationId))
    try {
      await approveApplication(applicationId)
      
      // Find the quest to check its current status
      const quest = myQuests.created.find(q => q.id === questId)
      
      // If quest is still "open", update it to "in-progress" since we now have an approved participant
      if (quest && quest.status === 'open') {
        try {
          await QuestAPI.updateQuestStatus(quest.slug, 'in-progress')
          console.log('✅ Quest status updated to in-progress after approving participant')
        } catch (statusError) {
          console.error('Failed to update quest status to in-progress:', statusError)
          // Don't fail the whole operation if status update fails
        }
      }
      
      // Reload applications to get updated status (application stays in log)
      await loadQuestApplications(questId, true)
      await loadMyQuests() // Refresh quest data
      showToast('Application approved successfully', 'success')
    } catch (error) {
      console.error('Failed to approve application:', error)
      showToast('Failed to approve application', 'error')
    } finally {
      setProcessingApplications((prev: Set<number>) => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  // Handle rejecting application
  const handleRejectApplication = async (applicationId: number, questId: number) => {
    setProcessingApplications((prev: Set<number>) => new Set(prev).add(applicationId))
    try {
      await rejectApplication(applicationId)
      // Reload applications to get updated status (application stays in log)
      await loadQuestApplications(questId, true)
      await loadMyQuests() // Refresh quest data
      showToast('Application rejected successfully', 'success')
    } catch (error) {
      console.error('Failed to reject application:', error)
      showToast('Failed to reject application', 'error')
    } finally {
      setProcessingApplications((prev: Set<number>) => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  // Get status styling for applications
  const getApplicationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "kicked":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get user's application for a specific quest
  const getUserApplicationForQuest = (questId: number): Application | undefined => {
    return userApplications.find((app: Application) => app.quest.id === questId)
  }

  // Get the appropriate quest list based on active tab
  const getQuestList = () => {
    if (activeTab === "created") {
      return myQuests.created
    } else {
      return myQuests.participating
    }
  }

  // Filter quests based on search query
  const filteredQuests = getQuestList()
    .filter((quest: Quest) => {
      if (!searchQuery) return true
      return (
        quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })

  // Sort quests
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    let aValue, bValue

    if (sortField === "created_at") {
      aValue = new Date(a.created_at).getTime()
      bValue = new Date(b.created_at).getTime()
    } else if (sortField === "due_date") {
      aValue = a.due_date ? new Date(a.due_date).getTime() : 0
      bValue = b.due_date ? new Date(b.due_date).getTime() : 0
    } else {
      aValue = a.xp_reward
      bValue = b.xp_reward
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue
  })

  const toggleSort = (field: "created_at" | "due_date" | "xp_reward") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleDeleteQuest = async (quest: Quest) => {
    try {
      const result = await QuestAPI.deleteQuest(quest.slug)
      await loadMyQuests() // Refresh the quest lists from API
      setShowDeleteConfirm(null)
      // Use backend refund info if available
      if (result && result.amount_refunded) {
        refreshBalance();
        showToast(result.message || `Quest deleted successfully. ${result.amount_refunded} gold (quest reward only) has been refunded to your account. Commission fee is non-refundable.`, "success")
      } else {
        showToast("Quest deleted successfully", "success")
      }
    } catch (error) {
      console.error('Failed to delete quest:', error)
      showToast('Failed to delete quest', 'error')
    }
  }

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest)
    setShowQuestForm(true)
  }

  const handleCreateQuest = () => {
    setEditingQuest(null)
    setShowQuestForm(true)
  }

  const handleQuestFormSuccess = async (quest?: Quest) => {
    setShowQuestForm(false)
    setEditingQuest(null)
    await loadMyQuests() // Refresh the quest lists from API
    
    // Refresh gold balance if quest was created/updated with gold reward
    if (quest && (quest.gold_reward || 0) > 0) {
      refreshBalance()
    }
    
    showToast(editingQuest ? "Quest updated successfully" : "Quest created successfully", "success")
  }

  const handleViewQuest = (quest: Quest) => {
    setSelectedQuest(quest)
    setShowQuestDetails(true)
  }

  const handleViewApplications = (quest: Quest) => {
    setSelectedQuestForApplications(quest)
    setShowApplicationsModal(true)
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      open: "bg-green-100 text-green-800",
      "in-progress": "bg-blue-100 text-blue-800", 
      completed: "bg-gray-100 text-gray-800"
    }
    
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    )
  }

  const getTierBadge = (difficulty: string) => {
    const tierMap: Record<string, { label: string; color: string; icon: string }> = {
      initiate: { label: "Initiate Tier", color: "bg-green-200 text-green-900", icon: "📜" },
      adventurer: { label: "Adventurer Tier", color: "bg-amber-200 text-amber-900", icon: "🧭" },
      champion: { label: "Champion Tier", color: "bg-red-200 text-red-900", icon: "⚔️" },
      mythic: { label: "Mythic Tier", color: "bg-violet-200 text-violet-900", icon: "👑" },
    };
    const tier = tierMap[difficulty.toLowerCase()] || { label: "Unknown Tier", color: "bg-gray-100 text-gray-800", icon: "?" };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold items-center gap-1 ${tier.color}`}>
        <span>{tier.icon}</span>
        {tier.label}
      </span>
    );
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
      case "initiate":
        return "bg-green-100 text-green-800 border-green-200"
      case "adventurer":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "champion":
        return "bg-red-100 text-red-800 border-red-200"
      case "mythic":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleCompleteQuest = async (questSlug: string) => {
    try {
      await QuestAPI.updateQuestStatus(questSlug, "completed");
      await loadMyQuests();
      showToast("Quest marked as completed", "success");
    } catch (error) {
      showToast("Failed to mark quest as completed", "error");
    }
  }

  const handleApproveSubmission = async (submissionId: number, feedback?: string) => {
    try {
      await QuestAPI.approveSubmission(submissionId, feedback);
      // Refresh submissions
      if (submissionsQuest) {
        const updatedSubmissions = await QuestAPI.getQuestSubmissions(submissionsQuest.slug);
        // Update state if needed
      }
      showToast("✅ Submission approved! Participant has completed the quest and received rewards.", "success");
    } catch (error) {
      showToast("❌ Failed to approve submission", "error");
    }
  }

  const handleMarkNeedsRevision = async (submissionId: number, feedback?: string) => {
    try {
      await QuestAPI.markSubmissionNeedsRevision(submissionId, feedback);
      // Refresh submissions
      if (submissionsQuest) {
        const updatedSubmissions = await QuestAPI.getQuestSubmissions(submissionsQuest.slug);
        // Update state if needed
      }
      showToast("📝 Submission marked as needing revision - participant can resubmit their work.", "success");
    } catch (error) {
      showToast("❌ Failed to mark submission as needing revision", "error");
    }
  }

  // Check if a quest can be deleted
  const canDeleteQuest = (quest: Quest) => {
    // Cannot delete if quest is in progress or completed
    if (quest.status === 'in-progress' || quest.status === 'completed') {
      return false
    }
    
    // Cannot delete if quest has participants
    if (quest.participants_detail && quest.participants_detail.length > 0) {
      return false
    }
    
    // Cannot delete if quest has applications (to preserve application history)
    if (quest.applications_count && quest.applications_count > 0) {
      return false
    }
    
    return true
  }

  // Get tooltip message for delete button
  const getDeleteTooltip = (quest: Quest) => {
    if (quest.status === 'in-progress') {
      return 'Cannot delete a quest that is in progress'
    }
    if (quest.status === 'completed') {
      return 'Cannot delete a completed quest'
    }
    if (quest.participants_detail && quest.participants_detail.length > 0) {
      return 'Cannot delete a quest with participants'
    }
    if (quest.applications_count && quest.applications_count > 0) {
      return 'Cannot delete a quest with applications (preserves application history)'
    }
    return 'Delete this quest'
  }

  if (!currentUser) {
    return (
      <section className="bg-gradient-to-br from-[#F4F0E6] to-[#F8F5F0] min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#8B75AA] rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-[#2C1A1D] mb-4 font-serif">Login Required</h3>
            <p className="text-gray-600 text-lg mb-8">
              Please log in to view and manage your quests.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-3 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors font-semibold"
            >
              Go to Login
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#8B75AA] border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-[#8B75AA] font-medium">Loading your quests...</span>
      </div>
    )
  }

  return (
    <section className="bg-gradient-to-br from-[#F4F0E6] to-[#F8F5F0] min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold text-[#2C1A1D] font-serif mb-2">Quest Management</h2>
              <p className="text-[#8B75AA] text-lg">Manage your quests and track applications</p>
            </div>
            <button
              onClick={handleCreateQuest}
              className="bg-[#8B75AA] hover:bg-[#7A6699] text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2 font-semibold"
            >
              <Plus size={20} />
              Create Quest
            </button>
          </div>
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
                  {myQuests.created.length}
                </span>
              </div>
            </button>
            <button
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                activeTab === "participating" ? "bg-[#8B75AA] text-white" : "text-[#2C1A1D] hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("participating")}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={20} />
                <span>Participating Quests</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                  {myQuests.participating.length}
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
                  sortField === "created_at"
                    ? "bg-[#8B75AA] text-white border-[#8B75AA]"
                    : "bg-white text-[#2C1A1D] border-gray-300 hover:border-[#8B75AA]"
                }`}
                onClick={() => toggleSort("created_at")}
              >
                <Calendar size={16} />
                <span>Date</span>
                {sortField === "created_at" &&
                  (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  sortField === "due_date"
                    ? "bg-[#8B75AA] text-white border-[#8B75AA]"
                    : "bg-white text-[#2C1A1D] border-gray-300 hover:border-[#8B75AA]"
                }`}
                onClick={() => toggleSort("due_date")}
              >
                <Clock size={16} />
                <span>Deadline</span>
                {sortField === "due_date" &&
                  (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  sortField === "xp_reward"
                    ? "bg-[#8B75AA] text-white border-[#8B75AA]"
                    : "bg-white text-[#2C1A1D] border-gray-300 hover:border-[#8B75AA]"
                }`}
                onClick={() => toggleSort("xp_reward")}
              >
                <Star size={16} />
                <span>XP Reward</span>
                {sortField === "xp_reward" &&
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
                          <Star size={18} className="text-[#8B75AA]" />
                          <div>
                            <p className="text-xs text-gray-500">XP Reward</p>
                            <p className="font-bold text-[#8B75AA]">{quest.xp_reward} XP</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CircleDollarSign size={18} className={(quest.gold_reward || 0) > 0 ? "text-yellow-600" : "text-gray-400"} />
                          <div>
                            <p className="text-xs text-gray-500">Gold Reward</p>
                            <p className={`font-bold ${(quest.gold_reward || 0) > 0 ? "text-yellow-600" : "text-gray-400"}`}>
                              {(quest.gold_reward || 0) > 0 ? `${quest.gold_reward} Gold` : "No reward"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="font-medium text-gray-700">{new Date(quest.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={18} className="text-red-500" />
                          <div>
                            <p className="text-xs text-gray-500">Deadline</p>
                            <p className="font-medium text-gray-700">
                              {quest.due_date ? new Date(quest.due_date).toLocaleDateString() : 'No deadline'}
                            </p>
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
                            disabled={
                              // Disable if quest has any approved applications (not kicked) or is not in 'open' status
                              quest.status !== 'open' ||
                              (questApplications[quest.id] && questApplications[quest.id].some(app => app.status === 'approved'))
                            }
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                              (quest.status !== 'open' ||
                                (questApplications[quest.id] && questApplications[quest.id].some(app => app.status === 'approved')))
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-[#8B75AA] text-white hover:bg-[#7A6699]'
                            }`}
                            title={
                              quest.status !== 'open'
                                ? `Cannot edit a quest that is ${quest.status}`
                                : (questApplications[quest.id] && questApplications[quest.id].some(app => app.status === 'approved'))
                                ? 'Cannot edit a quest with active participants (kick participants first)'
                                : 'Edit this quest'
                            }
                          >
                            <Edit size={16} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(quest.id)}
                            disabled={!canDeleteQuest(quest)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                              canDeleteQuest(quest)
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            }`}
                            title={getDeleteTooltip(quest)}
                          >
                            <Trash size={16} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleExpandQuest(quest.id)}
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

                    {/* For Created Quests - Show Applications */}
                    {activeTab === "created" && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-[#2C1A1D] font-serif">
                            Applications Log ({questApplications[quest.id]?.length || quest.applications_count || 0})
                          </h4>
                          {/* Show View Submitted Work button for in-progress and completed quests */}
                          {(quest.status === "in-progress" || quest.status === "completed") && (
                            <button
                              onClick={() => {
                                setSubmissionsQuest(quest);
                                setShowSubmissionsModal(true);
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors font-semibold"
                            >
                              <Eye size={20} />
                              <span>View Submitted Work</span>
                            </button>
                          )}
                        </div>

                        {loadingApplications[quest.id] ? (
                          <div className="bg-white p-6 rounded-xl border text-center">
                            <div className="w-6 h-6 border-2 border-[#8B75AA] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-[#8B75AA] font-medium">Loading applications...</p>
                          </div>
                        ) : questApplications[quest.id] && questApplications[quest.id].length > 0 ? (
                          <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                              <p className="text-blue-800 text-sm font-medium">
                                📝 Application Log: All applications are preserved for record keeping, regardless of their status.
                              </p>
                            </div>
                            {questApplications[quest.id].map((application) => (
                              <div
                                key={application.id}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                              >
                                {/* Application Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                      {application.applicant.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-[#2C1A1D] text-lg">{application.applicant.username}</h5>
                                      <p className="text-sm text-gray-600">{application.applicant.email}</p>
                                      <p className="text-xs text-gray-500">
                                        Applied on {new Date(application.applied_at).toLocaleDateString()}
                                        {application.reviewed_at && (
                                          <span className="ml-2">
                                            • {application.status === 'approved' ? 'Approved' : application.status === 'kicked' ? 'Kicked' : 'Rejected'} on {new Date(application.reviewed_at).toLocaleDateString()}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`px-3 py-1 rounded-full text-sm font-bold border ${getApplicationStatusColor(application.status)}`}

                                    >
                                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    </span>
                                  </div>
                                </div>

                                {/* Applicant Level */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Star size={16} className="text-[#8B75AA]" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Applicant Level: {application.applicant.level || 1}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons - Only show for pending applications */}
                                {application.status === 'pending' && quest.status === 'open' && (
                                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                      onClick={() => handleApproveApplication(application.id, quest.id)}
                                      disabled={processingApplications.has(application.id) || application.status !== 'pending'}
                                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                      {processingApplications.has(application.id) ? (
                                        <>

                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Processing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle size={16} />
                                          <span>Accept</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleRejectApplication(application.id, quest.id)}
                                      disabled={processingApplications.has(application.id) || application.status !== 'pending'}
                                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                      {processingApplications.has(application.id) ? (
                                        <>

                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Processing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle size={16} />
                                          <span>Reject</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}

                                {(application.status === 'approved' || application.status === 'pending') && (
                                  <div className="flex flex-col gap-2 items-center mt-2">
                                    {removalTarget === application.id ? (
                                      <div className="flex flex-col sm:flex-row gap-2 items-center w-full max-w-md">
                                        <input
                                          type="text"
                                          className="px-2 py-1 border rounded-lg text-sm flex-1 min-w-0"
                                          placeholder="Reason (optional)"
                                          value={removalReason}
                                          onChange={e => setRemovalReason(e.target.value)}
                                          autoFocus
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleRemoveApplicant(application.id, quest.id)}
                                            disabled={processingApplications.has(application.id)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-xs font-semibold disabled:opacity-50 transition-colors"
                                          >
                                            {processingApplications.has(application.id) ? 'Kicking...' : 'Confirm'}
                                          </button>
                                          <button
                                            onClick={() => { setRemovalTarget(null); setRemovalReason(""); }}
                                            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
                                          >Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2 items-center">
                                        {quest.status === 'in-progress' && (
                                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
                                            <p className="text-yellow-800 text-xs font-medium">
                                              ⚠️ Warning: Kicking this participant from an in-progress quest will revert the quest status back to "Open" if no other participants remain.
                                            </p>
                                          </div>
                                        )}
                                        <button
                                          onClick={() => { setRemovalTarget(application.id); setRemovalReason(""); }}
                                          disabled={processingApplications.has(application.id)}
                                          className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 text-sm font-semibold disabled:opacity-50 transition-colors min-w-[140px] mb-4"
                                          title={
                                            quest.status === 'in-progress' 
                                              ? "Kick participant (will revert quest to 'Open' if no participants remain)"
                                              : "Kick participant"
                                          }
                                        >
                                          Kick Participant
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Show review information for processed applications */}
                                {application.status !== 'pending' && (
                                  <div className="pt-4 border-t border-gray-100 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      {application.status === 'approved' ? (
                                        <CheckCircle size={16} className="text-green-600" />
                                      ) : application.status === 'kicked' ? (
                                        <AlertCircle size={16} className="text-orange-600" />
                                      ) : (
                                        <XCircle size={16} className="text-red-600" />
                                      )}
                                      <span>
                                        {application.status === 'approved' 
                                          ? 'Accepted' 
                                          : application.status === 'kicked'
                                            ? 'Kicked from quest'
                                            : 'Rejected'
                                        } {application.reviewed_at ? (
                                          <>

                                            on {new Date(application.reviewed_at).toLocaleDateString()}
                                            {application.reviewed_by && (
                                              <span> by {application.reviewed_by.username}</span>
                                            )}
                                          </>
                                        ) : (
                                          application.status === 'kicked' && 'by quest giver'
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* No applications message */}
                            {questApplications[quest.id].length === 0 && (
                              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No applications yet. Share your quest to attract adventurers!</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No applications yet. Share your quest to attract adventurers!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* For Participating Quests - Show Application Status */}
                    {activeTab === "participating" && (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border">
                          <h4 className="text-lg font-bold text-[#2C1A1D] mb-3 font-serif">Quest Giver</h4>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold">
                              {quest.creator?.username?.[0]?.toUpperCase() || 'Q'}
                            </div>
                            <div>
                              <p className="font-semibold text-[#2C1A1D]">{quest.creator?.username || 'Unknown'}</p>
                              <p className="text-sm text-[#8B75AA]">Quest Giver</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border">
                          <h4 className="text-lg font-bold text-[#2C1A1D] mb-3 font-serif">Your Participation Status</h4>
                          {(() => {
                            const userApp = getUserApplicationForQuest(quest.id)
                            if (userApp) {
                              // User has an application
                              return (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <span className={`px-3 py-2 rounded-xl text-sm font-bold border ${
                                      userApp.status === 'approved' 
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : userApp.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        : userApp.status === 'kicked'
                                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                                        : 'bg-red-100 text-red-800 border-red-200'
                                    }`}>
                                      {userApp.status === 'approved' ? 'Participating' : userApp.status.charAt(0).toUpperCase() + userApp.status.slice(1)}
                                    </span>
                                    <p className="text-gray-600">
                                      {userApp.status === 'approved' && userApp.reviewed_at
                                        ? `Approved on ${new Date(userApp.reviewed_at).toLocaleDateString()}`
                                        : userApp.status === 'kicked' && userApp.reviewed_at
                                        ? `Kicked on ${new Date(userApp.reviewed_at).toLocaleDateString()}`
                                        : `Applied on ${new Date(userApp.applied_at).toLocaleDateString()}`}
                                    </p>
                                  </div>
                                  {userApp.status === 'pending' && (
                                    <p className="text-sm text-gray-500">
                                      Your application is under review by the quest giver.
                                    </p>
                                  )}
                                  {userApp.status === 'rejected' && (
                                    <p className="text-sm text-red-600">
                                      Your application was not accepted for this quest.
                                    </p>
                                  )}
                                  {userApp.status === 'kicked' && (
                                    <p className="text-sm text-orange-600">
                                      You have been removed from this quest by the quest giver.
                                    </p>
                                  )}
                                </div>
                              )
                            } else {
                              // User is in participant list (direct participation)
                              return (
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-2 rounded-xl text-sm font-bold border bg-blue-100 text-blue-800 border-blue-200">
                                    Participating
                                  </span>
                                  <p className="text-gray-600">
                                    Added as participant
                                  </p>
                                </div>
                              )
                            }
                          })()}
                        </div>

                        {quest.status === "in-progress" && (() => {
                          // Find participant record for current user
                          const myParticipant = quest.participants_detail?.find(
                            (p: any) => String(p.user.id) === String(currentUser.id)
                          );
                          // Also allow if user has an approved application
                          const hasApprovedApp = userApplications.some(
                            (app) => app.quest.id === quest.id && app.status === "approved"
                          );
                          // Check if user has been kicked
                          const hasBeenKicked = userApplications.some(
                            (app) => app.quest.id === quest.id && app.status === "kicked"
                          );
                          // Only show submit buttons if user is participant AND not kicked
                          return (myParticipant || hasApprovedApp) && !hasBeenKicked ? (
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                              <button
                                onClick={() => {
                                  setSubmitWorkQuest(quest);
                                  setShowSubmitWorkModal(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors font-semibold"
                              >
                                <CheckCircle size={20} />
                                <span>Submit Completed Work</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSubmissionsQuest(quest);
                                  setShowSubmissionsModal(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors font-semibold"
                              >
                                <Eye size={20} />
                                <span>View Submitted Work</span>
                              </button>
                            </div>
                          ) : null;
                        })()}
      {/* Quest Submit Work Modal */}
      {showSubmitWorkModal && submitWorkQuest && (() => {
        // Find participant record for current user
        const myParticipant = submitWorkQuest.participants_detail?.find(
          (p: any) => String(p.user.id) === String(currentUser.id)
        );
        // Find approved application for this quest
        const myApprovedApp = userApplications.find(
          (app) => app.quest.id === submitWorkQuest.id && app.status === "approved"
        );
        // Check if user has been kicked
        const hasBeenKicked = userApplications.some(
          (app) => app.quest.id === submitWorkQuest.id && app.status === "kicked"
        );
        // Don't show modal if user doesn't have access or has been kicked
        if ((!myParticipant && !myApprovedApp) || hasBeenKicked) return null;
        return (
          <div>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 mb-4 flex items-center gap-2 justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span>Participants may submit up to 5 times per quest. Further submissions will be blocked.</span>
            </div>
            <QuestSubmitWorkModal
              isOpen={showSubmitWorkModal}
              onClose={() => setShowSubmitWorkModal(false)}
              onSuccess={async () => {
                setShowSubmitWorkModal(false);
                showToast("Work submitted successfully!", "success");
                await loadMyQuests();
              }}
              questParticipantId={myParticipant ? myParticipant.id : undefined}
              applicationId={myApprovedApp ? myApprovedApp.id : undefined}
              questTitle={submitWorkQuest.title}
              questSlug={submitWorkQuest.slug}
              showToast={showToast}
            />
          </div>
        );
      })()}
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
            {activeTab === "created" && (
              <button 
                onClick={handleCreateQuest}
                className="px-6 py-3 bg-[#8B75AA] text-white rounded-xl hover:bg-[#7A6699] transition-colors font-semibold"
              >
                Create Your First Quest
              </button>
            )}
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
                onClick={() => {
                  const quest = sortedQuests.find(q => q.id === showDeleteConfirm)
                  if (quest) handleDeleteQuest(quest)
                }}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                Delete Quest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quest Form Modal */}
      {showQuestForm && (
        <QuestForm
          quest={editingQuest}
          isOpen={showQuestForm}
          onClose={() => {
            setShowQuestForm(false)
            setEditingQuest(null)
          }}
          onSuccess={handleQuestFormSuccess}
          isEditing={!!editingQuest}
          currentUser={currentUser}
        />
      )}

      {/* Quest Details Modal */}
      {showQuestDetails && selectedQuest && (
        <QuestDetailsModal
          isOpen={showQuestDetails}
          onClose={() => setShowQuestDetails(false)}
          quest={selectedQuest}
          currentUser={currentUser}
          isAuthenticated={true}
          setQuests={setQuests}
          showToast={showToast}
          setAuthModalOpen={() => {}}
          openEditQuestModal={handleEditQuest}
          onQuestUpdate={loadMyQuests}
        />
      )}

      {/* Applications Modal */}
      {showApplicationsModal && (
        <QuestManagementApplicationsModal
          isOpen={showApplicationsModal}
          onClose={() => {
            setShowApplicationsModal(false)
            setSelectedQuestForApplications(null)
          }}
          currentUser={currentUser}
          questId={selectedQuestForApplications?.id}
          onApplicationProcessed={loadMyQuests}
        />
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && submissionsQuest && (
        <QuestSubmissionsModal
          isOpen={showSubmissionsModal}
          onClose={() => {
            setShowSubmissionsModal(false);
            setSubmissionsQuest(null);
          }}
          quest={submissionsQuest}
          currentUser={currentUser}
          showToast={showToast}
          // Only pass onMarkComplete if user is the quest creator (viewing created quests tab)
          onMarkComplete={activeTab === "created" ? async () => {
            await handleCompleteQuest(submissionsQuest.slug);
            setShowSubmissionsModal(false);
          } : undefined}
          onApproveSubmission={handleApproveSubmission}
          onMarkNeedsRevision={handleMarkNeedsRevision}
          canReviewSubmissions={submissionsQuest.status === "in-progress" && activeTab === "created"}
        />
      )}
    </section>
  )
}
