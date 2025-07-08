"use client"

import React, { useMemo } from "react"
import { MoreVertical } from "lucide-react"
import { User, Conversation, UserStatus } from "@/lib/types"
import { useRouter } from "next/navigation"

type Props = {
  conversation: Conversation
  getOtherParticipant: (conversation: Conversation) => User | null
  onlineUsers: Map<string, UserStatus>
  onToggleInfo: () => void
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
}

const ConversationHeader: React.FC<Props> = ({
  conversation,
  getOtherParticipant,
  onlineUsers,
  onToggleInfo,
  renderAvatar,
}) => {
  const router = useRouter()

  const other = useMemo(
    () => conversation && !conversation.is_group ? getOtherParticipant(conversation) : null,
    [conversation, getOtherParticipant]
  )

  const displayName = useMemo(() => {
    if (!conversation) return "Select a conversation"
    if (conversation.is_group && conversation.name) return conversation.name
    return other?.username || "Unknown User"
  }, [conversation, other])

  const displayAvatarUser = useMemo(() => {
    if (!conversation) return null
    if (conversation.is_group) {
      return {
        id: "group_avatar",
        username: displayName,
        avatar: "/group-placeholder.png",
      } as User
    }
    return other
  }, [conversation, other, displayName])

  const getPresence = (user: User | null): "online" | "idle" | "offline" => {
    if (conversation?.is_group) return "offline"
    return user ? onlineUsers.get(String(user.id)) ?? "offline" : "offline"
  }

  const presence = getPresence(other)
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
        <div className="py-3 px-4 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white animate-fadeIn">
          <h2 className="font-semibold text-lg">Select a Conversation</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full border-b animate-slideUp">
      <div
        className="py-3 px-4 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white"
        role="banner"
        aria-label="Conversation Header"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {displayAvatarUser && (
              <div
                onClick={() => router.push(`/profile/${displayAvatarUser.id}`)}
                className="cursor-pointer hover:scale-105 transition-transform duration-200"
                title={`Go to ${displayAvatarUser.username}'s profile`}
              >
                {renderAvatar(displayAvatarUser, "md")}
              </div>
            )}

            <div className="min-w-0">
              <p
                className="font-semibold text-sm truncate transition-colors duration-150"
                title={displayName}
              >
                {displayName}
              </p>

              {!conversation.is_group && other && (
                <div className="flex items-center text-xs text-white/80 space-x-2 mt-0.5">
                  <span className="flex items-center gap-1" title={`User is ${presence}`}>
                    <span className={`w-2 h-2 rounded-full ${presenceColor}`} />
                    <span>{presenceLabel}</span>
                  </span>
                  {other.level && (
                    <span title={`Level ${other.level}`} className="text-xs opacity-80">
                      • Level {other.level}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onToggleInfo}
            aria-label="Toggle conversation info"
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
            type="button"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConversationHeader
