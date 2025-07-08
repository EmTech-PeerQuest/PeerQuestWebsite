"use client"

import React, { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Message, User, UserStatus } from "@/lib/types"
import MessageBubble from "./MessageBubble"

type MessageListProps = {
  messages: Message[]
  currentUserId: string
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  onlineUsers: Map<string, UserStatus>
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  renderAvatar,
  onlineUsers,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200

    const lastMsg = messages.at(-1)
    if (atBottom || lastMsg?.sender.id === currentUserId) {
      endRef.current?.scrollIntoView({ behavior: "smooth" })
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
        <motion.p
          className="text-center text-gray-400 text-sm mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          No messages yet. Say hello!
        </motion.p>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isOwn = msg.sender.id === currentUserId
            const showAvatar =
              !isOwn && (i === 0 || messages[i - 1].sender.id !== msg.sender.id)

            return (
              <motion.div
                key={msg.id ?? `${msg.sender.id}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, delay: i * 0.01 }}
              >
                <MessageBubble
                  message={msg}
                  isOwnMessage={isOwn}
                  showAvatar={showAvatar}
                  renderAvatar={renderAvatar}
                  onlineUsers={onlineUsers}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
      <div ref={endRef} />
    </div>
  )
}

export default MessageList
