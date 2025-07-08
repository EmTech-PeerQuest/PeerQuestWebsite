"use client"

import React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Conversation, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Search, MessageSquarePlus } from "lucide-react"

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
}

export default function ConversationList({
  conversations,
  currentUserId,
  userMap,
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
}: ConversationListProps) {
  const defaultRenderAvatar = (user: User, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses: Record<string, string> = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    }
    return (
      <div className={cn("relative rounded-full", sizeClasses[size])}>
        <Image
          src={user.avatar || "/placeholder-user.jpg"}
          alt={user.username || "User avatar"}
          className="object-cover rounded-full"
          fill
          sizes="40px"
        />
        {onlineStatusMap.get(user.id) === "online" && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></span>
        )}
      </div>
    )
  }

  const avatarRenderer = renderAvatar || defaultRenderAvatar

  const handleStartConversation = async (user: User) => {
    try {
      await startConversation(user)
      setShowUserSearch(false)
    } catch (err) {
      console.error("Failed to start conversation:", err)
    }
  }

  const getMessagePreview = (conversation: Conversation): string => {
    const lastMessage = conversation.last_message
    if (!lastMessage || typeof lastMessage.content !== "string") return "No messages yet"
    const preview = lastMessage.content
    return preview.length > 40 ? `${preview.slice(0, 40)}...` : preview
  }

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return (
    <motion.div
      className="flex flex-col h-full bg-white/90 dark:bg-card backdrop-blur-md shadow-xl rounded-2xl border border-gray-200 overflow-hidden"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white">
        <h2 className="text-xl font-bold tracking-wide">Chats</h2>
        <button
          onClick={() => setShowUserSearch((prev) => !prev)}
          className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={showUserSearch ? "Close search" : "New chat"}
        >
          {showUserSearch ? <Search className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border bg-background">
        <input
          type="text"
          placeholder={showUserSearch ? "Search for users..." : "Search conversations..."}
          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-muted text-sm shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
          value={showUserSearch ? userSearchQuery : searchQuery}
          onChange={(e) =>
            showUserSearch ? setUserSearchQuery(e.target.value) : setSearchQuery(e.target.value)
          }
        />
      </div>

      {/* Conversation/User Search List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {showUserSearch ? (
            <motion.div
              key="user-search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 p-2"
            >
              {isSearchingUsers && (
                <div className="text-center text-muted-foreground py-2 animate-pulse">Searching...</div>
              )}
              {!isSearchingUsers &&
                userSearchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    onClick={() => handleStartConversation(user)}
                    className="cursor-pointer flex items-center p-3 rounded-lg hover:bg-accent transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    layout
                  >
                    {avatarRenderer(user, "md")}
                    <div className="ml-3 font-medium text-sm">{user.username}</div>
                  </motion.div>
                ))}
              {!isSearchingUsers && userSearchResults.length === 0 && userSearchQuery && (
                <div className="text-center text-muted-foreground py-2">No users found.</div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="conversation-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1 p-2"
            >
              {sortedConversations.length === 0 && !searchQuery && (
                <div className="text-center text-muted-foreground p-4">No chats yet. Start a new one!</div>
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
                  const displayName = conv.is_group
                    ? conv.name
                    : otherParticipant?.username || "Unknown User"
                  const displayUser = !conv.is_group ? otherParticipant : null
                  const preview = getMessagePreview(conv)

                  return (
                    <motion.div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv)}
                      className={cn(
                        "cursor-pointer flex items-center p-3 rounded-lg transition-all",
                        isSelected
                          ? "bg-accent shadow-md"
                          : "hover:bg-muted hover:shadow-sm"
                      )}
                      layout
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {displayUser ? (
                        avatarRenderer(displayUser, "md")
                      ) : (
                        <div className="relative w-10 h-10">
                          <Image
                            src={conv.is_group ? "/group-placeholder.png" : "/placeholder-user.jpg"}
                            alt={displayName || "Conversation"}
                            className="rounded-full object-cover"
                            fill
                            sizes="40px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold truncate">{displayName}</span>
                          <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                            {new Date(conv.updated_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{preview}</div>
                      </div>
                    </motion.div>
                  )
                })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
