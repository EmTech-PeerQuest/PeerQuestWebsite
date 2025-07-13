"use client"

import type React from "react"

import { useState } from "react"
import { X, Send } from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface MessagingModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: UserType
  currentUser: UserType
  showToast: (message: string, type?: string) => void
  onlineUsers?: Map<string, "online" | "idle" | "offline"> // Pass onlineUsers map for real-time status
}

export function MessagingModal({ isOpen, onClose, recipient, currentUser, showToast, onlineUsers }: MessagingModalProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: 1,
      senderId: currentUser.id,
      content: "Hello! I saw your profile and wanted to connect.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      senderId: recipient.id,
      content: "Hi there! Thanks for reaching out. How can I help you?",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  ])

  // Only use onlineUsers map for recipient online status (no backend fallback)
  // Support all online/idle/offline states. If not in map, treat as offline.
  let presence: "online" | "idle" | "offline" = "offline";
  if (onlineUsers && onlineUsers.has(recipient.id)) {
    presence = onlineUsers.get(recipient.id) as "online" | "idle" | "offline";
  }
  // Dot color and label by presence
  let dotColor = "bg-gray-300";
  let dotLabel = "Offline";
  let dotText = "text-gray-400";
  if (presence === "online") {
    dotColor = "bg-green-500";
    dotLabel = "Online";
    dotText = "text-green-500";
  } else if (presence === "idle") {
    dotColor = "bg-amber-400";
    dotLabel = "Idle";
    dotText = "text-amber-500";
  }
  // Always show Online if presence is online, never show Offline if user is online
  if (presence === "online") {
    dotLabel = "Online";
    dotText = "text-green-500";
  }

  if (!isOpen) return null

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      senderId: currentUser.id,
      content: message.trim(),
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage("")
    showToast("Message sent!", "success")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="w-10 h-10 bg-[#2C1A1D] rounded-full flex items-center justify-center text-white font-bold relative">
                  {recipient.avatar ? (
                    <img
                      src={recipient.avatar}
                      alt={recipient.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    recipient.username?.[0]?.toUpperCase() || "U"
                  )}
                  {/* Online status dot with label - always render, color by presence */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white z-10 ${dotColor}`}
                    title={dotLabel}
                  />
                </div>
                <span className={`ml-2 text-xs font-semibold ${dotText}`}>
                  {dotLabel}
                </span>
              </div>
              <div>
                <h2 className="font-bold">{recipient.username}</h2>
                <p className="text-sm text-[#F4F0E6] opacity-80">Level {recipient.level || 1} Adventurer</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-[#CDAA7D] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderId === currentUser.id
                    ? "bg-[#8B75AA] text-white"
                    : "bg-white border border-[#CDAA7D] text-[#2C1A1D]"
                }`}
              >
                <p>{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderId === currentUser.id ? "text-[#F4F0E6] opacity-80" : "text-gray-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-[#CDAA7D]">
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] resize-none"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`px-4 py-2 rounded-lg transition-colors ${
                message.trim()
                  ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
