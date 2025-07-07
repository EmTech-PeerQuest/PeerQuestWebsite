"use client"

import React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
  // If currentUser is null, return a loading state or fallback UI
  if (!currentUser) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className="w-96 bg-white p-4 rounded-lg shadow-lg">
      {/* Header with Gradient Background */}
      <div className="flex justify-between items-center bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-3 rounded-t-lg">
        <h3 className="text-lg font-bold">Conversation Info</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-red-500">
          Close
        </button>
      </div>

      {/* Participants Section */}
      <div className="mt-4">
        <h4 className="font-medium">Participants</h4>
        <div className="flex gap-2 mt-2">
          {participants.map((participant) => {
            const isOnline = onlineUsers.get(participant.id) === "online"
            return (
              <div key={participant.id} className="flex items-center gap-2">
                {renderAvatar(participant, "sm")}
                <div className="flex flex-col">
                  <span className="font-medium">{participant.username}</span>
                  <span className={`text-sm ${isOnline ? "text-green-500" : "text-gray-500"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Conversation Details Section */}
      <div className="mt-4">
        <h4 className="font-medium">Conversation Details</h4>
        <p className="text-sm">{conversation.description || conversation.name || "No description"}</p>
      </div>
    </div>
  )
}

export default ConversationInfoPanel
