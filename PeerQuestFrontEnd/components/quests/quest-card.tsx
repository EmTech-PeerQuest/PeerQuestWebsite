"use client"

import { useState } from "react"
import { Clock, Star, Users, User, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { Quest } from "@/lib/types"
import { formatTimeRemaining } from "@/lib/utils"

interface QuestCardProps {
  quest: Quest
  currentUser?: any
  onViewDetails: (quest: Quest) => void
  onLeaveQuest?: (quest: Quest) => void
  onEditQuest?: (quest: Quest) => void
  onViewApplications?: (quest: Quest) => void
  showActions?: boolean
}

export function QuestCard({
  quest,
  currentUser,
  onViewDetails,
  onLeaveQuest,
  onEditQuest,
  onViewApplications,
  showActions = true
}: QuestCardProps) {
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
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isCreator = currentUser && quest.creator.id === currentUser.id
  const isParticipant = quest.participants_detail?.some(p => p.user.id === currentUser?.id) || false

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onViewDetails(quest)}
            >
              {quest.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">by {quest.creator.username}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">{quest.category.name}</span>
            </div>
          </div>
          
          {/* Status and Difficulty Badges */}
          <div className="flex flex-col gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quest.status)}`}>
              {quest.status.replace('-', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quest.difficulty)}`}>
              {quest.difficulty.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {quest.description}
        </p>

        {/* Quest Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{quest.xp_reward} XP</span>
            </div>
            
            {quest.gold_reward && quest.gold_reward > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-amber-500">🪙</span>
                <span className="text-amber-600 font-medium">{quest.gold_reward} gold</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{quest.participant_count} participant{quest.participant_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {quest.due_date && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Due {formatTimeRemaining(new Date(quest.due_date))}</span>
            </div>
          )}
        </div>

        {/* Progress for participants */}
        {isParticipant && quest.participants_detail && (
          <div className="mb-4">
            {quest.participants_detail
              .filter(p => p.user.id === currentUser?.id)
              .map(participant => (
                <div key={participant.id} className="flex items-center gap-2">
                  {participant.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    Status: {participant.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(quest)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              View Details
            </button>
            
            {isCreator && onViewApplications && (
              <button
                onClick={() => onViewApplications(quest)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Apps
              </button>
            )}
            
            {isCreator && onEditQuest && (
              <button
                onClick={() => onEditQuest(quest)}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 border border-transparent rounded-md hover:bg-amber-600 transition-colors"
              >
                Edit
              </button>
            )}
            

            
            {isParticipant && onLeaveQuest && quest.status !== 'completed' && (
              <button
                onClick={handleLeaveQuest}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Leaving...' : 'Leave Quest'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestCard
