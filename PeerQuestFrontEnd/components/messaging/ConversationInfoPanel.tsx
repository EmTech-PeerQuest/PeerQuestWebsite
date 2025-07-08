"use client"

import React from "react"
import type { User, Conversation, UserStatus } from "@/lib/types"
import { X } from "lucide-react"

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
  if (!currentUser) return <div className="p-6 text-center animate-fadeIn">Loading...</div>

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
    <aside
      aria-label="Conversation information panel"
      className="relative w-96 h-full bg-white dark:bg-card rounded-l-2xl shadow-xl overflow-hidden animate-slideUp"
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white px-4 py-3">
        <h3 className="text-lg font-bold tracking-wide">Conversation Info</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/20 transition duration-200 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close panel"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-6 text-sm text-gray-900 dark:text-white">
        {/* Participants */}
        <section aria-labelledby="participants-heading">
          <h4 id="participants-heading" className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Participants ({participants.length})
          </h4>
          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
            {participants.map((participant) => {
              const status = onlineUsers.get(participant.id) ?? "offline"
              const isOnline = status === "online"
              const isIdle = status === "idle"

              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-all duration-150 cursor-pointer"
                  onClick={() => handleParticipantClick(participant)}
                  onKeyDown={(e) => handleKeyDown(e, participant)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile of ${participant.username}`}
                >
                  <div className="relative">
                    {renderAvatar(participant, "sm")}
                    <span
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? "bg-green-500" : isIdle ? "bg-yellow-400" : "bg-gray-400"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {participant.username}
                      {participant.id === currentUser.id && (
                        <span className="text-xs text-gray-500 ml-1">(You)</span>
                      )}
                    </p>
                    <p
                      className={`text-xs ${
                        isOnline ? "text-green-600" : isIdle ? "text-yellow-600" : "text-gray-500"
                      }`}
                    >
                      {isOnline ? "Online" : isIdle ? "Idle" : "Offline"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Metadata */}
        <section aria-labelledby="details-heading">
          <h4 id="details-heading" className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Conversation Details
          </h4>
          <div className="space-y-3 text-sm">
            {conversation.name && (
              <div>
                <span className="block text-muted-foreground font-medium">Name:</span>
                <p className="text-gray-900 dark:text-white">{conversation.name}</p>
              </div>
            )}
            {conversation.description && (
              <div>
                <span className="block text-muted-foreground font-medium">Description:</span>
                <p className="text-gray-900 dark:text-white">{conversation.description}</p>
              </div>
            )}
            {conversation.created_at && (
              <div>
                <span className="block text-muted-foreground font-medium">Created:</span>
                <p>
                  {new Date(conversation.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {conversation.guildId && (
              <div>
                <span className="block text-muted-foreground font-medium">Guild Conversation</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is a guild-related conversation.
                </p>
              </div>
            )}
            {!conversation.name && !conversation.description && (
              <p className="italic text-muted-foreground">No additional details available.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}

export default ConversationInfoPanel
