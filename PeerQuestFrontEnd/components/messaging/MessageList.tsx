"use client"
import React, { useEffect, useRef } from "react"
import type { Message, User } from "@/lib/types"
import MessageBubble from "./MessageBubble"

type Props = {
  messages: Message[]
  currentUserId: string
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  formatTime: (date: string) => string
  onlineUsers: Map<string, "online" | "idle"> // This map tracks user presence
}

const MessageList: React.FC<Props> = ({
  messages,
  currentUserId,
  renderAvatar,
  formatTime,
  onlineUsers, // Pass onlineUsers down to MessageBubble if it needs it for avatar status
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to the bottom when messages update
  useEffect(() => {
    const scrollContainer = scrollRef.current?.parentElement
    if (scrollContainer) {
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.clientHeight <=
        scrollContainer.scrollTop + 100 // 100px buffer
      if (isAtBottom) {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" })
      } else {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage && lastMessage.sender.id === currentUserId) {
          scrollRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      }
    } else {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, currentUserId]) // Add currentUserId as a dependency for the scroll logic

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-2"
      aria-live="polite"
      role="log"
    >
      {messages.length === 0 ? (
        <div className="text-center text-gray-400 text-sm mt-6">
          No messages yet. Say hello!
        </div>
      ) : (
        messages.map((msg, index) => {
          const isOwnMessage = msg.sender.id === currentUserId
          const prevMsg = messages[index - 1]
          // Show avatar if it's not own message AND (it's the first message OR sender changed from previous)
          const showAvatar =
            !isOwnMessage && (!prevMsg || prevMsg.sender.id !== msg.sender.id)

          // The `status` prop for MessageBubble should be for MESSAGE DELIVERY STATUS,
          // not the sender's online presence.
          // If your Message type has msg.status (e.g., 'sent', 'delivered', 'read'), pass that.
          const messageDeliveryStatus = msg.status // Assuming msg.status exists in Message type

          return (
            <div key={msg.id || `${msg.sender.id}-${index}`} className="relative">
              {/* Removed absolute positioned presence dot here. 
                  It's better handled within MessageBubble itself alongside the avatar,
                  or in the ConversationHeader. */}
              <MessageBubble
                message={msg}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                status={messageDeliveryStatus}
                renderAvatar={renderAvatar}
                onlineUsers={onlineUsers} // Pass the map directly
              />
            </div>
          )
        })
      )}

      {/* This ensures smooth scrolling to the latest message */}
      <div ref={scrollRef} className="scroll-mb-64" />
    </div>
  )
}

export default MessageList
