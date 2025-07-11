"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Smile } from "lucide-react"
import type { Guild, User, GuildChatMessage } from "@/lib/types"

interface GuildChatModalProps {
  isOpen: boolean
  onClose: () => void
  guild: Guild
  currentUser: User | null
  showToast: (message: string, type?: string) => void
}

export function GuildChatModal({ isOpen, onClose, guild, currentUser, showToast }: GuildChatModalProps) {
  const [messages, setMessages] = useState<GuildChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineMembers] = useState(Math.floor(guild.members * 0.3)) // Simulate online members
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock messages for demonstration
  useEffect(() => {
    if (isOpen) {
      const mockMessages: GuildChatMessage[] = [
        {
          id: 1,
          guildId: guild.id,
          senderId: guild.poster.id,
          senderName: guild.poster.username,
          senderAvatar: guild.poster.avatar,
          content: "Welcome to the guild chat! Feel free to discuss quests and collaborate here.",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: 2,
          guildId: guild.id,
          senderId: 2,
          senderName: "QuestMaster",
          senderAvatar: "Q",
          content: "Has anyone seen the new alchemy quest? It looks challenging but rewarding!",
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
        {
          id: 3,
          guildId: guild.id,
          senderId: 3,
          senderName: "MysticBrewer",
          senderAvatar: "M",
          content: "I'm working on that one! Would love some help with the rare ingredients.",
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
      ]
      // TODO: Fetch real guild chat messages from API
      // For now, start with empty chat
      setMessages([])
    }
  }, [isOpen, guild.id, guild.poster])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!isOpen || !currentUser) return null

  const isMember = guild.membersList.includes(currentUser.id)
  const isAdmin = guild.admins.includes(currentUser.id) || guild.poster.id === currentUser.id

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: GuildChatMessage = {
      id: Date.now(),
      guildId: guild.id,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      content: newMessage,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    showToast("Message sent!", "success")
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2C1A1D] rounded-lg w-full max-w-5xl h-[80vh] flex overflow-hidden">
        {/* Sidebar - Simplified */}
        <div className="w-64 bg-[#3D2A2F] flex flex-col">
          {/* Guild Header */}
          <div className="p-4 border-b border-[#4A3540]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#CDAA7D] rounded-lg flex items-center justify-center text-xl">
                {guild.emblem}
              </div>
              <div>
                <h3 className="font-bold text-white">{guild.name}</h3>
                <p className="text-xs text-gray-400">
                  {onlineMembers} online • {guild.members} members
                </p>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 p-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Online Members ({onlineMembers})
              </h4>
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center gap-2 px-2 py-1 rounded text-gray-300">
                  <div className="w-6 h-6 bg-[#8B75AA] rounded-full flex items-center justify-center text-xs text-white">
                    {guild.poster.avatar}
                  </div>
                  <span className="text-sm">{guild.poster.username}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                </div>

                {/* Sample online members */}
                {guild.membersList.slice(0, 5).map((memberId) => (
                  <div key={memberId} className="flex items-center gap-2 px-2 py-1 rounded text-gray-300">
                    <div className="w-6 h-6 bg-[#8B75AA] rounded-full flex items-center justify-center text-xs text-white">
                      M
                    </div>
                    <span className="text-sm">Member {memberId}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#4A3540] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">{guild.name} Chat</h2>
              <p className="text-sm text-gray-400">Guild discussion</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div className="w-10 h-10 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {message.senderAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{message.senderName}</span>
                    <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                  </div>
                  <p className="text-gray-300">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {isMember && (
            <div className="p-4 border-t border-[#4A3540]">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Message #general`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendMessage()
                    }}
                    className="w-full bg-[#3D2A2F] border border-[#4A3540] rounded px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#8B75AA]"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    <Smile size={20} />
                  </button>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                    newMessage.trim()
                      ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                      : "bg-[#4A3540] text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          {!isMember && (
            <div className="p-4 border-t border-[#4A3540] text-center">
              <p className="text-gray-400">You must be a member of this guild to participate in chat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
