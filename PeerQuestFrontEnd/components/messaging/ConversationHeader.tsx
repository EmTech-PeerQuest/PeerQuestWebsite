"use client"

import React, { useMemo } from "react"
import { MoreVertical, AlertCircle } from "lucide-react"
import { User, Conversation } from "@/lib/types" // Use @/lib/types for consistent imports

type Props = {
  activeConversation: string | null
  conversations: Conversation[]
  getOtherParticipant: (conversation: Conversation) => User | null
  onlineUsers: Map<string, "online" | "idle" | "offline">
  wsConnected: boolean
  wsError?: string | null
  onToggleInfo: () => void
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
}

const ConversationHeader: React.FC<Props> = ({
  activeConversation,
  conversations,
  getOtherParticipant,
  onlineUsers,
  wsConnected,
  wsError,
  onToggleInfo,
  renderAvatar,
}) => {
  const conversation = useMemo(
    () => conversations.find((c) => String(c.id) === activeConversation),
    [activeConversation, conversations]
  )

  const other = useMemo(() => conversation && !conversation.is_group ? getOtherParticipant(conversation) : null, [
    conversation,
    getOtherParticipant
  ])

  // Determine the display name for the header
  const displayName = useMemo(() => {
    if (!conversation) return "Select a conversation"
    if (conversation.is_group && conversation.name) {
      return conversation.name
    }
    return other?.username || "Unknown User"
  }, [conversation, other])

  // Determine the avatar to display
  const displayAvatarUser = useMemo(() => {
    if (!conversation) return null
    if (conversation.is_group) {
      return {
        id: 'group_avatar', // Placeholder ID
        username: displayName,
        avatar: '/group-placeholder.png', // A path to a generic group avatar
      } as User // Cast as User if renderAvatar expects it fully
    }
    return other
  }, [conversation, other, displayName])

  // Function to safely get the presence status (only for non-group chats)
  const getPresence = (user: User | null): "online" | "idle" | "offline" => {
    if (conversation?.is_group) return "offline" // Groups don't have a single "other" presence
    return user ? onlineUsers.get(String(user.id)) ?? "offline" : "offline"
  }

  const presence = getPresence(other) // Use 'other' for 1-on-1
  const presenceLabel = presence.charAt(0).toUpperCase() + presence.slice(1)

  const presenceColor = useMemo(() => {
    const colors: Record<"online" | "idle" | "offline", string> = {
      online: "bg-green-400",
      idle: "bg-yellow-400",
      offline: "bg-gray-400",
    }
    return colors[presence]
  }, [presence])

  if (!conversation) {
    return (
      <div className="w-full border-b">
        <div className="py-3 px-4 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Select a Conversation</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full border-b">
      <div
        className="py-3 px-4 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white"
        role="banner"
        aria-label="Conversation Header"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {displayAvatarUser && renderAvatar(displayAvatarUser, "md")}
            <div>
              <p
                className="font-semibold text-sm truncate"
                title={displayName}
              >
                {displayName}
              </p>

              <div className="flex items-center space-x-1 text-xs text-white/80">
                {!conversation.is_group && other && (
                  <span className="flex items-center" title={`User is ${presence}`}>
                    <span
                      className={`w-2 h-2 rounded-full mr-1 ${presenceColor}`}
                    />
                    {presenceLabel}
                  </span>
                )}
                {other?.level && (
                  <span className="ml-2">• Level {other.level}</span>
                )}
                {wsConnected && <span className="ml-2">• Connected</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleInfo}
            aria-label="Toggle conversation info"
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {!wsConnected && wsError && (
        <div
          className="px-4 py-2 bg-yellow-50 border-t border-yellow-200"
          role="alert"
        >
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle size={16} />
            <span className="text-sm">{wsError}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationHeader
