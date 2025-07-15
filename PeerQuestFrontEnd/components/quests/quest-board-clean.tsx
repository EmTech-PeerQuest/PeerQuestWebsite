"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Edit } from "lucide-react"
import type { Quest } from "@/lib/types"
import { QuestAPI, QuestCategory, QuestFilters } from "@/lib/api/quests"
import TavernQuestCard from "./tavern-quest-card"
import QuestForm from "./quest-form"
import QuestDetailsModal from "./quest-details-modal"
import { ApplicationsModal } from "@/components/modals/applications-modal"

interface QuestBoardProps {
  currentUser: any
  refreshTrigger?: number
}

export function QuestBoard({
  currentUser,
  refreshTrigger,
}: QuestBoardProps) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [categories, setCategories] = useState<QuestCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [showQuestDetails, setShowQuestDetails] = useState(false)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedQuestForApplications, setSelectedQuestForApplications] = useState<Quest | null>(null)
  
  const [filters, setFilters] = useState<QuestFilters>({
    search: "",
    category: "",
    difficulty: "",
    status: "",
  })

  // Load initial data
  useEffect(() => {
    loadQuestsAndCategories()
  }, [])

  // Reload quests when filters change
  useEffect(() => {
    if (!loading) {
      loadQuests()
    }
  }, [filters])

  // Refresh quests when triggered from navbar (without remounting)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadQuests()
    }
  }, [refreshTrigger])

  const loadQuestsAndCategories = async () => {
    setLoading(true)
    try {
      const [questsData, categoriesData] = await Promise.all([
        QuestAPI.getQuests(filters),
        QuestAPI.getCategories()
      ])
      
      // Handle both response formats: array directly or wrapped in results/value
      const questsArray = Array.isArray(questsData) 
        ? questsData 
        : (questsData.results || questsData.value || [])
      
      // Apply consistent client-side sorting regardless of backend order
      const sortedQuests = [...questsArray].sort((a: Quest, b: Quest) => {
        // Normalize status values
        const aStatus = (a.status || '').toString().toLowerCase().trim()
        const bStatus = (b.status || '').toString().toLowerCase().trim()
        
        // Status priority mapping - LOWER number = HIGHER priority
        const statusPriority: Record<string, number> = {
          'open': 1,           // Highest priority
          'in-progress': 2,    // Second priority  
          'in_progress': 2,    // Handle underscore variant
          'completed': 3,      // Third priority
          'cancelled': 4,      // Fourth priority
          'canceled': 4        // Handle alternate spelling
        }
        
        const aPriority = statusPriority[aStatus] || 999
        const bPriority = statusPriority[bStatus] || 999
        
        // Primary sort: Status priority (open first)
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        
        // Secondary sort: Deadline (furthest deadline first within same status)
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0
        
        // Quests with deadlines come before those without
        if (aDate && !bDate) return -1
        if (!aDate && bDate) return 1
        if (!aDate && !bDate) return 0
        
        // Sort by furthest deadline first (longest time remaining)
        return bDate - aDate
      })
      
      console.log('✅ Quest Board Sorted Order:', sortedQuests.map((q, i) => 
        `${i+1}. ${q.title} (${q.status}) - ${q.due_date || 'No deadline'}`
      ))
      
      setQuests(sortedQuests)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to load quests and categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuests = async () => {
    try {
      const questsData = await QuestAPI.getQuests(filters)
      console.log('📋 Loaded quests:', questsData.results || questsData)
      
      // Handle both response formats: array directly or wrapped in results/value
      const questsArray = Array.isArray(questsData) 
        ? questsData 
        : (questsData.results || questsData.value || [])
      
      // Apply consistent client-side sorting regardless of backend order
      const sortedQuests = [...questsArray].sort((a: Quest, b: Quest) => {
        // Normalize status values
        const aStatus = (a.status || '').toString().toLowerCase().trim()
        const bStatus = (b.status || '').toString().toLowerCase().trim()
        
        // Status priority mapping - LOWER number = HIGHER priority
        const statusPriority: Record<string, number> = {
          'open': 1,           // Highest priority
          'in-progress': 2,    // Second priority  
          'in_progress': 2,    // Handle underscore variant
          'completed': 3,      // Third priority
          'cancelled': 4,      // Fourth priority
          'canceled': 4        // Handle alternate spelling
        }
        
        const aPriority = statusPriority[aStatus] || 999
        const bPriority = statusPriority[bStatus] || 999
        
        // Primary sort: Status priority (open first)
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        
        // Secondary sort: Deadline (furthest deadline first within same status)
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0
        
        // Quests with deadlines come before those without
        if (aDate && !bDate) return -1
        if (!aDate && bDate) return 1
        if (!aDate && !bDate) return 0
        
        // Sort by furthest deadline first (longest time remaining)
        return bDate - aDate
      })
      
      console.log('✅ Filtered Quest Board Order:', sortedQuests.map((q, i) => 
        `${i+1}. ${q.title} (${q.status}) - ${q.due_date || 'No deadline'}`
      ))
      
      setQuests([...sortedQuests])
    } catch (error) {
      console.error('Failed to load quests:', error)
    }
  }

  // Specialized function for updating quest data while preserving modal state
  const handleQuestUpdate = async () => {
    try {
      // Update the quest list
      const questsData = await QuestAPI.getQuests(filters)
      
      // Handle both response formats: array directly or wrapped in results/value
      const updatedQuests = Array.isArray(questsData) 
        ? questsData 
        : (questsData.results || questsData.value || [])
      
      setQuests(updatedQuests)
      
      // If a quest is currently selected in the modal, update it with fresh data
      if (selectedQuest) {
        const updatedSelectedQuest = updatedQuests.find((q: Quest) => q.id === selectedQuest.id)
        if (updatedSelectedQuest) {
          setSelectedQuest(updatedSelectedQuest)
        }
      }
    } catch (error) {
      console.error('Failed to update quests:', error)
    }
  }

  const handleLeaveQuest = async (quest: Quest) => {
    try {
      await QuestAPI.leaveQuest(quest.slug)
      await loadQuests() // Refresh to show updated participant count
    } catch (error) {
      console.error('Failed to leave quest:', error)
      throw error
    }
  }

  const handleQuestFormSuccess = async (quest: Quest) => {
    setEditingQuest(null)
    setShowQuestForm(false)
    await loadQuests()
  }

  const handleEditQuest = async (quest: Quest) => {
    try {
      // Fetch full quest details to get complete description
      console.log('📝 Fetching full quest details for editing:', quest.slug)
      const fullQuest = await QuestAPI.getQuest(quest.slug)
      console.log('📝 Full quest data for editing:', fullQuest)
      setEditingQuest(fullQuest)
      setShowQuestForm(true)
    } catch (error) {
      console.error('Failed to fetch quest details for editing:', error)
      // Fallback to using the quest from the list (with potentially truncated description)
      setEditingQuest(quest)
      setShowQuestForm(true)
    }
  }

  const handleOpenQuestDetails = async (quest: Quest) => {
    try {
      // Fetch full quest details to get complete description
      console.log('👁️ Fetching full quest details for viewing:', quest.slug)
      const fullQuest = await QuestAPI.getQuest(quest.slug)
      console.log('👁️ Full quest data for viewing:', fullQuest)
      setSelectedQuest(fullQuest)
      setShowQuestDetails(true)
    } catch (error) {
      console.error('Failed to fetch quest details for viewing:', error)
      // Fallback to using the quest from the list (with potentially truncated description)
      setSelectedQuest(quest)
      setShowQuestDetails(true)
    }
  }

  const handleCloseQuestDetails = () => {
    setSelectedQuest(null)
    setShowQuestDetails(false)
  }

  const handleViewApplications = (quest: Quest) => {
    console.log('Viewing applications for quest:', quest.title)
    setSelectedQuestForApplications(quest)
    setShowApplicationsModal(true)
  }

  const handleFilterChange = (key: keyof QuestFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "ALL" || value === "" ? undefined : value
    }))
  }

  // Fantasy Tier System
  const getTierColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "initiate":
        return "bg-green-200 text-green-900 border-green-300";
      case "adventurer":
        return "bg-amber-200 text-amber-900 border-amber-300";
      case "champion":
        return "bg-red-200 text-red-900 border-red-300";
      case "mythic":
        return "bg-violet-200 text-violet-900 border-violet-300";
      default:
        return "bg-gray-300 text-gray-700 border-gray-400";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F0E6] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-center">
            <div className="max-w-5xl w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#2C1A1D] font-serif">Quest Board</h2>
                  <p className="mt-2 font-medium text-[#8B75AA]">
                    Discover opportunities to showcase your skills and collaborate
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {currentUser && (
                    <button
                      onClick={() => {
                        setEditingQuest(null)
                        setShowQuestForm(true)
                      }}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Post a Quest
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

      {/* Search and Filters */}
      <div className="flex justify-center">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-5xl w-full">
          <div className="space-y-4">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search quests by title or description..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div className="flex flex-col">
              <select
                value={filters.category || ""}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-sm text-gray-900"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex flex-col">
              <select
                value={filters.difficulty || ""}
                onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-sm text-gray-900"
                aria-label="Filter by difficulty"
              >
                <option value="">All Difficulties</option>
                <option value="initiate">Initiate Tier</option>
                <option value="adventurer">Adventurer Tier</option>
                <option value="champion">Champion Tier</option>
                <option value="mythic">Mythic Tier</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-sm text-gray-900"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Quest Grid */}
      {quests.length > 0 ? (
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-5xl w-full">
            {quests.map(quest => (
              <TavernQuestCard
                key={quest.id}
                quest={quest}
                currentUser={currentUser}
                onViewDetails={handleOpenQuestDetails}
                onLeaveQuest={handleLeaveQuest}
                onEditQuest={handleEditQuest}
                onViewApplications={handleViewApplications}
                showActions={true}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No quests found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
          {currentUser && (              <button
                onClick={() => {
                  setEditingQuest(null)
                  setShowQuestForm(true)
                }}
                className="text-white px-6 py-3 rounded-lg transition-colors font-medium bg-purple-600 hover:bg-purple-700"
              >
              Create the First Quest
            </button>
          )}
        </div>
      )}

      {/* Quest Form Modal */}
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

      {/* Quest Details Modal */}
      <QuestDetailsModal
        isOpen={showQuestDetails}
        onClose={handleCloseQuestDetails}
        quest={selectedQuest}
        currentUser={currentUser}
        isAuthenticated={!!currentUser}
        setQuests={setQuests}
        showToast={(message: string, type?: string) => {
          console.log(`Toast: ${message} (${type})`)
        }}
        setAuthModalOpen={(open: boolean) => {
          console.log('Auth modal:', open)
        }}
        openEditQuestModal={handleEditQuest}
        onQuestUpdate={handleQuestUpdate}
      />

      {/* Applications Modal */}
      <ApplicationsModal
        isOpen={showApplicationsModal}
        onClose={() => {
          setShowApplicationsModal(false)
          setSelectedQuestForApplications(null)
        }}
        currentUser={currentUser}
        questId={selectedQuestForApplications?.id}
        onApplicationProcessed={loadQuests}
      />
        </div>
      </div>
    </div>
  )
}