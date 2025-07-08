"use client"

import React from "react"
import type { User, Conversation } from "@/lib/types"

interface ConversationInfoPanelProps {
  conversation: Conversation
  participants: User[]
  onlineUsers: Map<string, "online" | "idle" | "offline">
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
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <aside
      aria-label="Conversation information panel"
      className="w-96 bg-white p-4 rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-3 rounded-t-lg">
        <h3 className="text-lg font-bold">Conversation Info</h3>
        <button
          onClick={onClose}
          className="text-white hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded cursor-pointer"
          aria-label="Close conversation info panel"
          type="button"
          tabIndex={0}
        >
          Close
        </button>
      </div>

      {/* Participants */}
      <section className="mt-4" aria-labelledby="participants-heading">
        <h4 id="participants-heading" className="font-medium">
          Participants
        </h4>
        <div className="flex flex-col gap-3 mt-2 max-h-60 overflow-y-auto">
          {participants.map((participant) => {
            const status = onlineUsers.get(participant.id) ?? "offline"
            const isOnline = status === "online"
            const isIdle = status === "idle"
            return (
              <div key={participant.id} className="flex items-center gap-3 cursor-pointer" aria-label={`View profile of ${participant.username}`} tabIndex={0}>
                {renderAvatar(participant, "sm")}
                <div>
                  <span className="font-medium block truncate max-w-[150px]">
                    {participant.username}
                  </span>
                  <span
                    className={`text-sm ${
                      isOnline
                        ? "text-green-500"
                        : isIdle
                        ? "text-yellow-500"
                        : "text-gray-500"
                    }`}
                  >
                    {isOnline ? "Online" : isIdle ? "Idle" : "Offline"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Conversation Details */}
      <section className="mt-6" aria-labelledby="details-heading">
        <h4 id="details-heading" className="font-medium">
          Conversation Details
        </h4>
        <p className="text-sm break-words">
          {conversation.description || conversation.name || "No description"}
        </p>
      </section>
    </aside>
  )
}

export default ConversationInfoPanel
