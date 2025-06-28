"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, RefreshCw } from "lucide-react"
import type { Quest } from "@/lib/types"
import { QuestAPI, QuestCategory, QuestFilters } from "@/lib/api/quests"
import TavernQuestCard from "./tavern-quest-card"
import QuestForm from "./quest-form"

interface QuestBoardProps {
  currentUser: any
  openQuestDetails: (quest: Quest) => void
}

export function QuestBoard({
  currentUser,
  openQuestDetails,
}: QuestBoardProps) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [categories, setCategories] = useState<QuestCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  
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

  const loadQuestsAndCategories = async () => {
    setLoading(true)
    try {
      const [questsData, categoriesData] = await Promise.all([
        QuestAPI.getQuests(filters),
        QuestAPI.getCategories()
      ])
      
      setQuests(questsData.results || questsData)
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
      setQuests(questsData.results || questsData)
    } catch (error) {
      console.error('Failed to load quests:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadQuests()
    } finally {
      setRefreshing(false)
    }
  }

  const handleJoinQuest = async (quest: Quest) => {
    try {
      await QuestAPI.joinQuest(quest.slug)
      await loadQuests() // Refresh to show updated participant count
    } catch (error) {
      console.error('Failed to join quest:', error)
      throw error
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

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest)
    setShowQuestForm(true)
  }

  const handleFilterChange = (key: keyof QuestFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "ALL" || value === "" ? undefined : value.toLowerCase()
    }))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-emerald-500 text-white"
      case "medium":
        return "bg-amber-500 text-white"
      case "hard":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quest Board</h1>
          <p className="text-gray-600 mt-1">
            Discover and join quests to earn XP and level up
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {currentUser && (
            <button
              onClick={() => {
                setEditingQuest(null)
                setShowQuestForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Quest
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search quests..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div>
            <select
              value={filters.difficulty || ""}
              onChange={(e) => handleFilterChange("difficulty", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quest Grid */}
      {quests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map(quest => (
            <TavernQuestCard
              key={quest.id}
              quest={quest}
              currentUser={currentUser}
              onViewDetails={openQuestDetails}
              onJoinQuest={handleJoinQuest}
              onLeaveQuest={handleLeaveQuest}
              onEditQuest={handleEditQuest}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No quests found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
          {currentUser && (
            <button
              onClick={() => {
                setEditingQuest(null)
                setShowQuestForm(true)
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
      />
    </div>
  )
}
