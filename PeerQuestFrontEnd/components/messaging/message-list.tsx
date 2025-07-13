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
            // Always pass the original sender; renderAvatar uses onlineUsers map for status
            return (
              <div key={`${msg.id}-${msg.status ?? ""}`}> 
                <MessageBubble
                  message={msg}
                  isOwnMessage={isOwn}
                  showAvatar={showAvatar}
                  renderAvatar={(user, size) => {
                    const presence = onlineUsers.get(user.id) || "offline";
                    let dotColor = "bg-gray-300";
                    let dotLabel = "Offline";
                    if (presence === "online") {
                      dotColor = "bg-green-500";
                      dotLabel = "Online";
                    } else if (presence === "idle") {
                      dotColor = "bg-amber-400";
                      dotLabel = "Idle";
                    }
                    // Always show Online if presence is online, never show Offline if user is online
                    if (presence === "online") {
                      dotLabel = "Online";
                    }
                    let sizeClass = "w-8 h-8";
                    if (size === "sm") sizeClass = "w-6 h-6";
                    if (size === "lg") sizeClass = "w-12 h-12";
                    return (
                      <div className={`relative ${sizeClass}`}>
                        <div className={`${sizeClass} rounded-full bg-gray-400 text-white flex items-center justify-center font-bold`}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username || "?"} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <>{user.username ? user.username[0] : "?"}</>
                          )}
                        </div>
                        {/* Online status dot with label - always render, color by presence */}
                        <span
                          className={`absolute bottom-0 right-0 ${size === "lg" ? "w-4 h-4" : size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} rounded-full border-2 border-white z-10 ${dotColor}`}
                          title={dotLabel}
                        />
                      </div>
                    );
                  }}
                />
              </div>
            )
          })}
          <div ref={endRef} className="pt-2" />
        </AnimatePresence>
      )}
    </div>
  )
}

export default MessageList
