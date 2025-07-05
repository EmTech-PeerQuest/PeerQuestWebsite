"use client"

import { useState } from "react"
import { Clock, Star, Users, User, Calendar, CheckCircle, AlertCircle, Eye, Edit } from "lucide-react"
import { Quest } from "@/lib/types"
import { formatTimeRemaining } from "@/lib/utils"

interface TavernQuestCardProps {
  quest: Quest
  currentUser?: any
  onViewDetails: (quest: Quest) => void
  onLeaveQuest?: (quest: Quest) => void
  onEditQuest?: (quest: Quest) => void
  onViewApplications?: (quest: Quest) => void
  showActions?: boolean
}

export function TavernQuestCard({
  quest,
  currentUser,
  onViewDetails,
  onLeaveQuest,
  onEditQuest,
  onViewApplications,
  showActions = true
}: TavernQuestCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Function to truncate description (fallback if backend doesn't truncate)
  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    
    // Find the last space before the max length to avoid cutting words
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    // If we found a space and it's not too far from the end, cut there
    if (lastSpace > maxLength * 0.8) {
      return text.substring(0, lastSpace).trim() + "..."
    }
    
    // Otherwise, just cut at the character limit
    return truncated.trim() + "..."
  }

  // Fantasy Tier System
  const getTierInfo = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
      case "initiate":
        return { label: "Initiate Tier", color: "bg-green-200 text-green-900 border-green-300", icon: "📜" };
      case "medium":
      case "adventurer":
        return { label: "Adventurer Tier", color: "bg-amber-200 text-amber-900 border-amber-300", icon: "🧭" };
      case "hard":
      case "champion":
        return { label: "Champion Tier", color: "bg-red-200 text-red-900 border-red-300", icon: "⚔️" };
      case "mythic":
        return { label: "Mythic Tier", color: "bg-violet-200 text-violet-900 border-violet-300", icon: "👑" };
      default:
        return { label: "Unknown Tier", color: "bg-gray-300 text-gray-700 border-gray-400", icon: "?" };
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
  const applicationCount = quest.applications_count || 0

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
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
      tabIndex={0}
      onClick={() => onViewDetails(quest)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onViewDetails(quest) }}
      role="button"
      aria-label={`View details for quest ${quest.title}`}
    >
      {/* Header Section with Brown Background */}
      <div className="bg-gradient-to-br from-[#CDAA7D] to-[#B8956D] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg leading-tight flex-1 mr-3 font-serif group-hover:text-[#F4F0E6] transition-colors mb-2">
              {quest.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                🎨 {quest.category.name.toUpperCase()}
              </span>
            </div>
          </div>
          {/* Right side badges */}
          <div className="ml-3 flex flex-col gap-2 items-end">
            {/* Tier Badge - Top Right */}
            {(() => {
              const tier = getTierInfo(quest.difficulty);
              return (
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${tier.color} flex items-center gap-1`}>
                  <span>{tier.icon}</span>
                  {tier.label}
                </span>
              );
            })()}
            {/* Status Badge - Below Difficulty */}
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {quest.status.replace('-', '-').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      {/* White Body Section */}
      <div className="p-4">
        {/* Reward Section */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center gap-8">
            {/* Gold Reward */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div>
                {quest.gold_reward && quest.gold_reward > 0 ? (
                  <div className="text-lg font-bold text-amber-700">{quest.gold_reward}</div>
                ) : (
                  <div className="text-lg font-bold text-gray-500">0</div>
                )}
                <div className="text-xs font-medium text-amber-700 uppercase">GOLD</div>
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
        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {truncateDescription(quest.description)}
          </p>
          {quest.description.length > 150 && (
            <p className="text-xs text-[#8B75AA] mt-1 italic">
              Click "View Details" to read the full description
            </p>
          )}
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
      </div>
    </div>
  );
}

export default TavernQuestCard
