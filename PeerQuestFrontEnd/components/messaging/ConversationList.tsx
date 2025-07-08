"use client"

import React from "react"
import Image from "next/image"
import { Conversation, User, UserStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Search, MessageSquarePlus } from "lucide-react"

type ConversationListProps = {
  conversations: Conversation[]
  userMap: Map<string, User>
  selectedConversationId: string | null
  onSelectConversation: (conversation: Conversation) => void
  currentUserId: string
  // The parent component must update the conversations list after a new chat is started.
  startConversation: (participants: User[]) => Promise<void>
  getOtherParticipant: (conversation: Conversation) => User | null
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  onlineStatusMap: Map<string, "online" | "idle" | "offline">

  // Search and UI state
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
  // Fallback avatar renderer if one isn't provided via props
  const defaultRenderAvatar = (user: User, size: "sm" | "md" | "lg" = "md"): JSX.Element => {
    const sizeClasses: Record<string, string> = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }
    return (
      <div className={cn("relative rounded-full", sizeClasses[size])}>
        <Image
          src={user.avatar || "/placeholder-user.jpg"}
          alt={user.username}
          className="object-cover rounded-full"
          fill
          sizes="(max-width: 768px) 40px, 64px"
        />
        {onlineStatusMap.get(user.id) === "online" && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></span>
        )}
      </div>
    )
  }

  const avatarRenderer = renderAvatar || defaultRenderAvatar

  // Function to safely get the current user object
  const getCurrentUser = (): User | undefined => {
    return userMap.get(currentUserId)
  }

  // Handle starting a new conversation safely
  const handleStartConversation = async (user: User) => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.error("Could not start conversation: Current user not found.")
      return
    }
    await startConversation([currentUser, user])
    // After starting, switch back to the conversation list view
    setShowUserSearch(false)
  }

  const getMessagePreview = (conversation: Conversation): string => {
    const lastMessage = conversation.last_message
    if (!lastMessage || typeof lastMessage.content !== "string") {
      return "No messages yet"
    }
    const preview = lastMessage.content
    return preview.length > 40 ? `${preview.slice(0, 40)}...` : preview
  }

  return (
    <div className="flex flex-col h-full bg-card shadow-lg rounded-lg border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white rounded-t-lg">
        <h2 className="text-xl font-semibold">Chats</h2>
        <button
          onClick={() => setShowUserSearch((prev) => !prev)}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label={showUserSearch ? "Close search" : "New chat"}
        >
          {showUserSearch ? <Search className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder={showUserSearch ? "Search for users..." : "Search conversations..."}
          className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary"
          value={showUserSearch ? userSearchQuery : searchQuery}
          onChange={(e) => (showUserSearch ? setUserSearchQuery(e.target.value) : setSearchQuery(e.target.value))}
          autoFocus
        />
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto">
        {showUserSearch ? (
          <div>
            {isSearchingUsers && <div className="p-4 text-center text-muted-foreground">Searching...</div>}
            {!isSearchingUsers && userSearchResults.length > 0 && (
              userSearchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartConversation(user).catch(console.error)}
                  className="cursor-pointer flex items-center p-3 hover:bg-accent transition-colors"
                  tabIndex={0}
                >
                  {avatarRenderer(user, "md")}
                  <div className="ml-3 font-medium">{user.username}</div>
                </div>
              ))
            )}
            {!isSearchingUsers && userSearchResults.length === 0 && userSearchQuery && (
              <div className="p-4 text-center text-muted-foreground">No users found.</div>
            )}
          </div>
        ) : (
          <div>
            {conversations.length === 0 && !searchQuery && (
              <div className="p-4 text-center text-muted-foreground">No chats yet. Start a new one!</div>
            )}
            {conversations
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

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv)}
                    className={cn(
                      "cursor-pointer flex items-center p-3 transition-colors",
                      isSelected ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    tabIndex={0}
                  >
                    {displayUser ? (
                      avatarRenderer(displayUser, "md")
                    ) : (
                      <div className="relative w-10 h-10">
                        <Image
                          src={conv.is_group ? "/group-placeholder.png" : "/placeholder-user.jpg"}
                          alt={displayName}
                          className="rounded-full object-cover"
                          fill
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 ml-3">
                      <div className="font-semibold truncate">{displayName}</div>
                      <div className="text-sm text-muted-foreground truncate">{preview}</div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}