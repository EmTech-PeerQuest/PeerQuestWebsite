"use client"

import type React from "react"
import type { User, Conversation, UserStatus } from "@/lib/types"
import { X, Users, Calendar, Shield } from "lucide-react"
import { motion } from "framer-motion"
import type { JSX } from "react/jsx-runtime"

interface ConversationInfoPanelProps {
  conversation: Conversation
  participants: User[]
  onlineUsers: Map<string, UserStatus>
  renderAvatar: (user: User, size: "sm" | "md" | "lg") => JSX.Element
  onClose: () => void
  currentUser: User | null
}

const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  conversation,
  participants,
  onlineUsers,
  renderAvatar,
  onClose,
  currentUser,
}) => {
  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <div className="loading-spinner mx-auto mb-2"></div>
        <p className="text-sm" style={{ color: "var(--tavern-purple)" }}>
          Loading...
        </p>
      </div>
    )
  }

  const handleParticipantClick = (participant: User) => {
    console.log(`View profile of ${participant.username}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent, participant: User) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleParticipantClick(participant)
    }
  }

  return (
    <aside aria-label="Conversation information panel" className="relative w-full h-full overflow-hidden">
      {/* Header with X button */}
      <div
        className="flex justify-between items-center px-6 py-4"
        style={{ backgroundColor: "var(--tavern-dark)", color: "var(--tavern-cream)" }}
      >
        <h3 className="text-lg font-medieval">Conversation Info</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            background: "transparent",
            border: "2px solid #cdaa7d",
            color: "#f4f0e6",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#cdaa7d"
            e.currentTarget.style.color = "#2c1a1d"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
            e.currentTarget.style.color = "#f4f0e6"
          }}
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div
        className="p-6 space-y-8 text-sm overflow-y-auto h-full"
        style={{ backgroundColor: "var(--tavern-cream)", color: "var(--tavern-dark)" }}
      >
        {/* Conversation Avatar & Name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {conversation.is_group ? (
            <div className="avatar avatar-xl mx-auto mb-4" style={{ backgroundColor: "var(--tavern-purple)" }}>
              <Users className="w-10 h-10" />
            </div>
          ) : (
            <div className="mx-auto mb-4">
              {participants.find((p) => p.id !== currentUser.id) &&
                renderAvatar(participants.find((p) => p.id !== currentUser.id)!, "lg")}
            </div>
          )}
          <h2 className="text-xl font-medieval mb-2" style={{ color: "var(--tavern-dark)" }}>
            {conversation.is_group
              ? conversation.name || "Group Chat"
              : participants.find((p) => p.id !== currentUser.id)?.username || "Unknown User"}
          </h2>
          {conversation.description && (
            <p style={{ color: "var(--tavern-purple)" }} className="text-sm">
              {conversation.description}
            </p>
          )}
        </motion.div>

        {/* Participants */}
        <motion.section
          aria-labelledby="participants-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" style={{ color: "var(--tavern-purple)" }} />
            <h4 id="participants-heading" className="font-semibold" style={{ color: "var(--tavern-dark)" }}>
              Participants ({participants.length})
            </h4>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {participants.map((participant, index) => {
              const status = onlineUsers.get(participant.id) ?? "offline"
              const isOnline = status === "online"
              const isIdle = status === "idle"

              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer group card"
                  onClick={() => handleParticipantClick(participant)}
                  onKeyDown={(e) => handleKeyDown(e, participant)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile of ${participant.username}`}
                >
                  <div className="relative">
                    {renderAvatar(participant, "sm")}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? "bg-green-500" : isIdle ? "bg-amber-500" : "bg-slate-400"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate transition-colors" style={{ color: "var(--tavern-dark)" }}>
                      {participant.username}
                      {participant.id === currentUser.id && (
                        <span className="text-xs ml-2" style={{ color: "var(--tavern-purple)" }}>
                          (You)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`${isOnline ? "text-green-600" : isIdle ? "text-amber-600" : ""}`}
                        style={{ color: isOnline ? "#4caf50" : isIdle ? "#ff9800" : "var(--tavern-purple)" }}
                      >
                        {isOnline ? "Online" : isIdle ? "Idle" : "Offline"}
                      </span>
                      {participant.level && (
                        <>
                          <span style={{ color: "var(--tavern-purple)" }}>•</span>
                          <span className="level-badge">Lv. {participant.level}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Conversation Details */}
        <motion.section
          aria-labelledby="details-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" style={{ color: "var(--tavern-purple)" }} />
            <h4 id="details-heading" className="font-semibold" style={{ color: "var(--tavern-dark)" }}>
              Details
            </h4>
          </div>
          <div className="space-y-4 text-sm">
            {conversation.created_at && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-0.5" style={{ color: "var(--tavern-gold)" }} />
                <div>
                  <span className="block font-medium" style={{ color: "var(--tavern-purple)" }}>
                    Created
                  </span>
                  <p style={{ color: "var(--tavern-dark)" }}>
                    {new Date(conversation.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}

            {conversation.guildId && (
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 mt-0.5" style={{ color: "var(--tavern-gold)" }} />
                <div>
                  <span className="block font-medium" style={{ color: "var(--tavern-purple)" }}>
                    Guild Conversation
                  </span>
                  <p style={{ color: "var(--tavern-purple)" }}>This is a guild-related conversation.</p>
                </div>
              </div>
            )}

            {!conversation.created_at && !conversation.guildId && (
              <p className="italic text-center py-4" style={{ color: "var(--tavern-purple)", opacity: 0.7 }}>
                No additional details available.
              </p>
            )}
          </div>
        </motion.section>
      </div>
    </aside>
  )
}

export default ConversationInfoPanel
