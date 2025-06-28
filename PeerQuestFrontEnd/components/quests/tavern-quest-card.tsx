"use client"

import { useState } from "react"
import { Clock, Star, Users, User, Calendar, CheckCircle, AlertCircle, Eye, Edit } from "lucide-react"
import { Quest } from "@/lib/types"
import { formatTimeRemaining } from "@/lib/utils"

interface TavernQuestCardProps {
  quest: Quest
  currentUser?: any
  onViewDetails: (quest: Quest) => void
  onJoinQuest?: (quest: Quest) => void
  onLeaveQuest?: (quest: Quest) => void
  onEditQuest?: (quest: Quest) => void
  onViewApplications?: (quest: Quest) => void
  showActions?: boolean
}

export function TavernQuestCard({
  quest,
  currentUser,
  onViewDetails,
  onJoinQuest,
  onLeaveQuest,
  onEditQuest,
  onViewApplications,
  showActions = true
}: TavernQuestCardProps) {
  const [isLoading, setIsLoading] = useState(false)

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (categoryName: string) => {
    // Generate a consistent color based on category name
    const colors = [
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-cyan-100 text-cyan-800 border-cyan-200",
    ]
    const hash = categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const isCreator = currentUser && quest.creator.id === currentUser.id
  const isParticipant = quest.participants_detail?.some(p => p.user.id === currentUser?.id) || false
  const canJoin = quest.can_accept_participants && !isCreator && !isParticipant && quest.status === 'open'
  const applicationCount = quest.participants_detail?.length || 0

  const handleJoinQuest = async () => {
    if (!onJoinQuest) return
    
    setIsLoading(true)
    try {
      await onJoinQuest(quest)
    } catch (error) {
      console.error('Failed to join quest:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveQuest = async () => {
    if (!onLeaveQuest) return
    
    setIsLoading(true)
    try {
      await onLeaveQuest(quest)
    } catch (error) {
      console.error('Failed to leave quest:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDeadline = (dueDate: string) => {
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day"
    if (diffDays > 1) return `${diffDays} days`
    if (diffDays === 0) return "Today"
    return "Overdue"
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header Section with Brown Background */}
      <div className="bg-gradient-to-br from-[#CDAA7D] to-[#B8956D] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12">
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg leading-tight flex-1 mr-3 font-serif group-hover:text-[#F4F0E6] transition-colors mb-2">
              {quest.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                🎨 {quest.category.name.toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Right side badges */}
          <div className="ml-3 flex flex-col gap-2 items-end">
            {/* Difficulty Badge - Top Right */}
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">
              {quest.difficulty.toUpperCase()}
            </span>
            
            {/* Status Badge - Below Difficulty */}
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {quest.status.replace('-', '-').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* White Body Section */}
      <div className="p-4">

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
          {quest.description}
        </p>

        {/* Reward Section */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center gap-8">
            {/* Gold Placeholder - Disabled */}
            <div className="flex items-center gap-2 opacity-40 pointer-events-none select-none">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-500">Coming Soon</div>
                <div className="text-xs font-medium text-gray-400 uppercase">GOLD</div>
              </div>
            </div>
            
            {/* XP Reward */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900">{quest.xp_reward}</div>
                <div className="text-xs font-medium text-purple-700 uppercase">XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quest Details */}
        <div className="space-y-3 mb-4">
          {/* Deadline */}
          {quest.due_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-[#8B75AA]" />
              <span className="text-sm">
                <span className="font-medium text-[#8B75AA]">Deadline:</span> <span className="text-[#8B75AA] font-bold">{formatDeadline(quest.due_date)}</span>
              </span>
            </div>
          )}
          
          {/* Posted by */}
          <div className="flex items-center gap-2 text-gray-600">
            {(quest.creator as any).avatar ? (
              <img 
                src={(quest.creator as any).avatar} 
                alt={quest.creator.username}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {quest.creator.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm">
              <span className="font-medium">Posted by</span> {quest.creator.username}
            </span>
          </div>
          
          {/* Applications */}
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm">
              <span className="font-medium">{applicationCount} Application{applicationCount !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(quest)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded hover:bg-amber-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            
            {isCreator && onViewApplications && (
              <button
                onClick={() => onViewApplications(quest)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
              >
                <Users className="w-4 h-4" />
                Apps
              </button>
            )}
            
            {isCreator && onEditQuest && (
              <button
                onClick={() => onEditQuest(quest)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            
            {canJoin && onJoinQuest && (
              <button
                onClick={handleJoinQuest}
                disabled={isLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Joining...' : 'Apply'}
              </button>
            )}
            
            {isParticipant && onLeaveQuest && quest.status !== 'completed' && (
              <button
                onClick={handleLeaveQuest}
                disabled={isLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Leaving...' : 'Leave'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TavernQuestCard
