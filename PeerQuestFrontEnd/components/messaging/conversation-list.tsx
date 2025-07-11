"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Conversation, User } from "@/lib/types"
import { Search, MessageSquarePlus, Users, Clock, Scroll, Shield } from "lucide-react"
import type { JSX } from "react/jsx-runtime"

type ConversationListProps = {
  conversations: Conversation[]
  userMap: Map<string, User>
  selectedConversationId: string | null
  onSelectConversation: (conversation: Conversation) => void
  currentUserId: string
  startConversation: (participant: User) => Promise<void>
  getOtherParticipant: (conversation: Conversation) => User | null
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  onlineStatusMap: Map<string, "online" | "idle" | "offline">
  searchQuery: string
  setSearchQuery: (query: string) => void
  showUserSearch: boolean
  setShowUserSearch: React.Dispatch<React.SetStateAction<boolean>>
  userSearchQuery: string
  setUserSearchQuery: (query: string) => void
  userSearchResults: User[]
  isSearchingUsers: boolean
  // Add these new props for read status management
  unreadConversations: Set<string>
  markConversationAsRead: (conversationId: string) => void
}

export default function ConversationList({
  conversations,
  currentUserId,
  onlineStatusMap,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  setSearchQuery,
  showUserSearch,
  setShowUserSearch,
  userSearchQuery,
  setUserSearchQuery,
  userSearchResults,
  startConversation,
  isSearchingUsers,
  getOtherParticipant,
  renderAvatar,
  unreadConversations,
  markConversationAsRead,
}: ConversationListProps) {
  const handleStartConversation = async (user: User) => {
    try {
      await startConversation(user)
      setShowUserSearch(false)
    } catch (err) {
      console.error("Failed to start conversation:", err)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation(conversation)
    // Mark conversation as read when selected
    if (unreadConversations.has(conversation.id)) {
      markConversationAsRead(conversation.id)
    }
  }

  const getMessagePreview = (conversation: Conversation): string => {
    const lastMessage = conversation.last_message
    if (!lastMessage || typeof lastMessage.content !== "string") return "No messages yet"
    const preview = lastMessage.content
    return preview.length > 50 ? `${preview.slice(0, 50)}...` : preview
  }

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )

  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f4f0e6 0%, rgba(244, 240, 230, 0.9) 100%)",
        borderRight: "3px solid #cdaa7d",
        boxShadow: "4px 0 16px rgba(44, 26, 29, 0.1)",
      }}
    >
      {/* Fixed Header */}
      <div
        className="p-6 border-b-2 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #2c1a1d 0%, #3d2a2f 100%)",
          borderBottomColor: "#cdaa7d",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-xl font-bold"
            style={{
              color: "#f4f0e6",
              fontFamily: "'Papyrus', 'Bradley Hand', cursive",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            🏰 Tavern Messages
          </h1>
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: showUserSearch ? "#cdaa7d" : "transparent",
              border: "2px solid #cdaa7d",
              color: showUserSearch ? "#2c1a1d" : "#f4f0e6",
            }}
            aria-label={showUserSearch ? "Search conversations" : "Search users"}
          >
            {showUserSearch ? <Search className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: "#cdaa7d" }} />
          <input
            type="text"
            placeholder={showUserSearch ? "🔍 Search for adventurers..." : "🔍 Search conversations..."}
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none"
            style={{
              backgroundColor: "rgba(244, 240, 230, 0.9)",
              borderColor: "#cdaa7d",
              color: "#2c1a1d",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#8b75aa"
              e.target.style.boxShadow = "0 0 0 3px rgba(139, 117, 170, 0.2)"
              e.target.style.backgroundColor = "#f4f0e6"
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#cdaa7d"
              e.target.style.boxShadow = "none"
              e.target.style.backgroundColor = "rgba(244, 240, 230, 0.9)"
            }}
            value={showUserSearch ? userSearchQuery : searchQuery}
            onChange={(e) => (showUserSearch ? setUserSearchQuery(e.target.value) : setSearchQuery(e.target.value))}
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: "#f4f0e6" }}>
        <AnimatePresence initial={false}>
          {showUserSearch ? (
            <motion.div
              key="user-search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {isSearchingUsers && (
                <div className="text-center py-8" style={{ color: "#8b75aa" }}>
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"
                    style={{ borderColor: "#8b75aa" }}
                  />
                  <p className="text-sm">🔍 Searching adventurers...</p>
                </div>
              )}
              {!isSearchingUsers &&
                userSearchResults.map((user) => {
                  // Only use onlineStatusMap for search results (no fallback)
                  const isOnline = onlineStatusMap.get(user.id) === "online";
                  return (
                    <motion.div
                      key={user.id}
                      onClick={() => handleStartConversation(user)}
                      className="cursor-pointer flex items-center p-4 rounded-xl transition-all group"
                      style={{
                        background: "linear-gradient(135deg, white 0%, rgba(244, 240, 230, 0.8) 100%)",
                        border: "2px solid #cdaa7d",
                        boxShadow: "0 2px 8px rgba(44, 26, 29, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)"
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(44, 26, 29, 0.15)"
                        e.currentTarget.style.borderColor = "#8b75aa"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(44, 26, 29, 0.1)"
                        e.currentTarget.style.borderColor = "#cdaa7d"
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      layout
                    >
                      {renderAvatar({ ...user, isOnline }, "md")}
                      <div className="ml-3 flex-1">
                        <p className="font-semibold transition-colors" style={{ color: "#2c1a1d" }}>
                          ⚔️ {user.username}
                        </p>
                        <p className="text-sm" style={{ color: "#8b75aa" }}>
                          📜 Start conversation
                        </p>
                        {user.level && (
                          <span
                            className="inline-block px-2 py-1 rounded-full text-xs font-bold mt-1"
                            style={{
                              background: "linear-gradient(135deg, #cdaa7d 0%, #ffe26f 100%)",
                              color: "#2c1a1d",
                            }}
                          >
                            ⚔️ Lv. {user.level}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              {!isSearchingUsers && userSearchResults.length === 0 && userSearchQuery && (
                <div className="text-center py-12" style={{ color: "#8b75aa" }}>
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">🚫 No adventurers found</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="conversation-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {sortedConversations.length === 0 && !searchQuery && (
                <div className="text-center py-12" style={{ color: "#8b75aa" }}>
                  <Scroll className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3
                    className="font-bold mb-2"
                    style={{
                      fontFamily: "'Papyrus', 'Bradley Hand', cursive",
                      color: "#2c1a1d",
                    }}
                  >
                    📜 No conversations yet
                  </h3>
                  <p className="text-sm">Start a new conversation to begin messaging</p>
                </div>
              )}
              {sortedConversations
                .filter((conv) => {
                  if (!searchQuery) return true
                  const name = conv.name || getOtherParticipant(conv)?.username || "Unknown"
                  return name.toLowerCase().includes(searchQuery.toLowerCase())
                })
                .map((conv) => {
                  const isSelected = conv.id.toString() === selectedConversationId
                  const otherParticipant = getOtherParticipant(conv)
                  const displayName = conv.is_group ? conv.name : otherParticipant?.username || "Unknown User"
                  const displayUser = !conv.is_group ? otherParticipant : null
                  const preview = getMessagePreview(conv)
                  // Only use onlineStatusMap for conversation list (no fallback)
                  const presence = displayUser ? onlineStatusMap.get(displayUser.id) ?? "offline" : undefined;
                  // Always show Online if presence is online, never show Offline if user is online
                  const isOnline = presence === "online";
                  const isIdle = presence === "idle";
                  const dotLabel = isOnline ? "Online" : isIdle ? "Idle" : "Offline";
                  const hasUnread = unreadConversations.has(conv.id)

                  return (
                    <motion.div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className="cursor-pointer flex items-center p-4 rounded-xl transition-all group relative overflow-hidden"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, #cdaa7d 0%, #e6c78a 100%)"
                          : "linear-gradient(135deg, white 0%, rgba(244, 240, 230, 0.8) 100%)",
                        border: `2px solid ${isSelected ? "#8b75aa" : "#cdaa7d"}`,
                        boxShadow: isSelected
                          ? "0 8px 24px rgba(139, 117, 170, 0.3)"
                          : "0 2px 8px rgba(44, 26, 29, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = "translateY(-2px)"
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(44, 26, 29, 0.15)"
                          e.currentTarget.style.borderColor = "#8b75aa"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(44, 26, 29, 0.1)"
                          e.currentTarget.style.borderColor = "#cdaa7d"
                        }
                      }}
                      layout
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                          style={{ background: "linear-gradient(to bottom, #8b75aa, #cdaa7d)" }}
                          layoutId="selected-indicator"
                        />
                      )}

                      <div className="relative ml-2">
                        {displayUser ? (
                          renderAvatar(
                            displayUser,
                            "md"
                          )
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-yellow-600"
                            style={{ backgroundColor: "#8b75aa" }}
                          >
                            <Shield className="w-5 h-5" style={{ color: "#f4f0e6" }} />
                          </div>
                        )}
                        {/* Online status dot with label - always render, color by presence */}
                        {displayUser && (
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white z-10 ${
                              isOnline ? "bg-green-600" : isIdle ? "bg-yellow-400" : "bg-gray-300"
                            }`}
                            title={dotLabel}
                            aria-label={`User is ${dotLabel.toLowerCase()}`}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex justify-between items-start mb-1">
                          <h3
                            className="font-semibold truncate transition-colors"
                            style={{ color: isSelected ? "#2c1a1d" : "#2c1a1d" }}
                          >
                            {conv.is_group ? "🛡️" : "⚔️"} {displayName}
                          </h3>
                          <div className="flex items-center text-xs ml-2" style={{ color: "#8b75aa" }}>
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(conv.updated_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <p
                          className="text-sm truncate transition-colors"
                          style={{ color: isSelected ? "#2c1a1d" : "#8b75aa" }}
                        >
                          📜 {preview}
                        </p>
                      </div>

                      {/* Unread indicator - fixed logic */}
                      {hasUnread && (
                        <motion.div
                          className="w-3 h-3 rounded-full ml-2"
                          style={{ backgroundColor: "#f44336" }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  )
                })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}