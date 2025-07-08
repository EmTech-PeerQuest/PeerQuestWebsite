"use client"
import React, { useEffect, useRef } from "react"
import type { Message, User } from "@/lib/types"
import MessageBubble from "./MessageBubble"

type Props = {
  messages: Message[]
  currentUserId: string
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  // Corrected type to include all possible statuses
  onlineUsers: Map<string, "online" | "idle" | "offline">
}

const MessageList: React.FC<Props> = ({ messages, currentUserId, renderAvatar, onlineUsers }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = containerRef.current
    if (!scrollContainer) return

    // Heuristic to check if user is scrolled up to see older messages
    const isScrolledUp =
      scrollContainer.scrollHeight - scrollContainer.clientHeight > scrollContainer.scrollTop + 200 // 200px threshold

    // If the user hasn't scrolled up, or the new message is from the current user, scroll to bottom
    const lastMessage = messages[messages.length - 1]
    if (!isScrolledUp || lastMessage?.sender.id === currentUserId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, currentUserId])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 min-h-0"
      aria-live="polite"
      role="log"
    >
      {messages.length === 0 ? (
        <div className="text-center text-gray-400 text-sm mt-6">No messages yet. Say hello!</div>
      ) : (
        messages.map((msg, index) => {
          const isOwnMessage = msg.sender.id === currentUserId
          const prevMsg = messages[index - 1]
          // Group consecutive messages by the same sender
          const showAvatar = !isOwnMessage && (!prevMsg || prevMsg.sender.id !== msg.sender.id)

          return (
            <MessageBubble
              key={msg.id ?? `${msg.sender.id}-${index}`}
              message={msg}
              isOwnMessage={isOwnMessage}
              showAvatar={showAvatar}
              renderAvatar={renderAvatar}
              onlineUsers={onlineUsers}
            />
          )
        })
      )}
      {/* Anchor for scrolling to the bottom */}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList