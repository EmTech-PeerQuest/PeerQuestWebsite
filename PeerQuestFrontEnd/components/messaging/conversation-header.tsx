"use client"

import type React from "react"
import { useMemo } from "react"
import { MoreVertical, Users, Shield } from "lucide-react"
import type { User, Conversation, UserStatus } from "@/lib/types"
import { motion } from "framer-motion"
import type { JSX } from "react/jsx-runtime"

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
  const other = useMemo(
    () => (!conversation.is_group ? getOtherParticipant(conversation) : null),
    [conversation, getOtherParticipant],
  )

  const displayName = useMemo(() => {
    if (conversation.is_group && conversation.name) return conversation.name
    return other?.username || "Unknown User"
  }, [conversation, other])

  const displayAvatarUser = useMemo(() => {
    if (conversation.is_group) {
      return {
        id: "group_avatar",
        username: displayName,
        avatar: "/placeholder.svg?height=40&width=40",
      } as User
    }
    return other
  }, [conversation, other, displayName])

  const getPresence = (user: User | null): "online" | "idle" | "offline" => {
    if (conversation.is_group) return "offline"
    return user ? (onlineUsers.get(String(user.id)) ?? "offline") : "offline"
  }

  const presence = getPresence(other)
  const presenceLabel = presence.charAt(0).toUpperCase() + presence.slice(1)

  const presenceColor = useMemo(() => {
    const colors: Record<"online" | "idle" | "offline", string> = {
      online: "#10b981",
      idle: "#f59e0b",
      offline: "#6b7280",
    }
    return colors[presence]
  }, [presence])

  return (
    <motion.div
      className="absolute top-16 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-2 shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center h-full">
        <div className="flex items-center gap-4">
          {displayAvatarUser && (
            <motion.div
              className="cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`View ${displayAvatarUser.username}'s profile`}
            >
              {conversation.is_group ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Shield className="w-5 h-5" />
                </div>
              ) : (
                renderAvatar(displayAvatarUser, "md")
              )}
            </motion.div>
          )}

          <div className="min-w-0">
            <h2 className="font-semibold text-lg text-slate-900 truncate" title={displayName}>
              {displayName}
            </h2>

            {!conversation.is_group && other && (
              <div className="flex items-center text-sm text-slate-600 space-x-2 mt-1">
                <div className="flex items-center gap-2" title={`User is ${presence}`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: presenceColor }} />
                  <span>{presenceLabel}</span>
                </div>
                {other.level && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    Lv. {other.level}
                  </span>
                )}
              </div>
            )}

            {conversation.is_group && (
              <div className="flex items-center text-sm text-slate-600 mt-1">
                <Users className="w-4 h-4 mr-1" />
                <span>{conversation.participants.length} members</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onToggleInfo}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          aria-label="Toggle conversation info"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default ConversationHeader
