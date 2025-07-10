"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Message, User, UserStatus } from "@/lib/types"
import MessageBubble from "./message-bubble"
import { Scroll } from "lucide-react"

type MessageListProps = {
  messages: Message[]
  currentUserId: string
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  onlineUsers: Map<string, UserStatus>
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, renderAvatar, onlineUsers }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200

    const lastMsg = messages.at(-1)
    if (atBottom || lastMsg?.sender.id === currentUserId) {
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, currentUserId])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-2"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: `
        linear-gradient(45deg, rgba(203, 213, 225, 0.1) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(148, 163, 184, 0.1) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(203, 213, 225, 0.1) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.1) 75%)
      `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
      }}
      aria-live="polite"
      role="log"
    >
      {messages.length === 0 ? (
        <div
        >
          <div className="w-16 h-16 mb-4 opacity-50">
            <Scroll className="w-full h-full" style={{ color: "#8b75aa" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#2c1a1d" }}>
            No messages yet
          </h3>
          <p style={{ color: "#8b75aa" }}>Start the conversation by sending a message!</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isOwn = msg.sender.id === currentUserId
            const showAvatar = true

            return (
              <div
                key={`${msg.id}-${msg.status ?? ""}`}
              >
                <MessageBubble
                  message={msg}
                  isOwnMessage={isOwn}
                  showAvatar={showAvatar}
                  renderAvatar={renderAvatar}
                  onlineUsers={onlineUsers}
                />
              </div>
            )
          })}
        </AnimatePresence>
      )}
      <div ref={endRef} />
    </div>
  )
}

export default MessageList
