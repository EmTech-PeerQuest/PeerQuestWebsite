"use client"

import React from "react"
import Image from "next/image"
import { Conversation, User, UserStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Search, MessageSquarePlus } from "lucide-react"

type MessageContentType = {
  content: string
}

type ConversationListProps = {
  conversations: Conversation[]
  userMap: Map<string, User>
  selectedConversationId: string | null
  onSelectConversation: (conversation: Conversation) => void
  currentUserId: string
  unreadCounts?: Record<string, number>
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  showUserSearch?: boolean
  setShowUserSearch?: React.Dispatch<React.SetStateAction<boolean>>
  userSearchQuery?: string
  setUserSearchQuery?: (query: string) => void
  userSearchResults?: User[]
  setUserSearchResults?: (users: User[]) => void
  startConversation: (participants: User[]) => Promise<void>
  isSearchingUsers?: boolean
  setActiveConversation?: (conversationId: string | null) => void
  onlineUsers?: Map<string, UserStatus>
  getOtherParticipant?: (conversation: Conversation) => User | null
  renderAvatar?: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  onlineStatusMap: Map<string, UserStatus>
}

export default function ConversationList({
  conversations,
  currentUserId,
  userMap,
  onlineUsers,
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
  // Default Avatar Renderer in case renderAvatar is not passed
  const defaultRenderAvatar = (user: User, size: string = "md"): JSX.Element => {
    const sizeClasses: Record<string, string> = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    }
    return (
      <div className={cn("relative", sizeClasses[size])}>
        <Image
          src={user.avatar || "/placeholder-user.jpg"}
          alt={user.username}
          className="rounded-full object-cover"
          fill
        />
        {onlineUsers?.get(user.id) === "online" && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></span>
        )}
      </div>
    )
  }

  const avatarRenderer = renderAvatar || defaultRenderAvatar;

  return (
    <div className="flex flex-col h-full bg-card shadow-sm rounded-lg">
      <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white">
        <h2 className="text-xl font-semibold">Chats</h2>
        <button
          onClick={() => setShowUserSearch && setShowUserSearch(prev => !prev)}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label={showUserSearch ? "Back to conversations" : "New chat"}
        >
          {showUserSearch ? (
            <Search className="h-5 w-5 rotate-90" />
          ) : (
            <MessageSquarePlus className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="p-4 border-b border-border">
        {showUserSearch ? (
          <input
            type="text"
            placeholder="Search users to start a chat..."
            className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            value={userSearchQuery || ""}
            onChange={(e) => setUserSearchQuery && setUserSearchQuery(e.target.value)}
          />
        ) : (
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {showUserSearch ? (
          <div className="py-2">
            {isSearchingUsers && <div className="p-4 text-center text-muted-foreground">Searching users...</div>}
            {!isSearchingUsers && userSearchResults && userSearchResults.length === 0 && userSearchQuery && (
              <div className="p-4 text-center text-muted-foreground">No users found.</div>
            )}
            {!isSearchingUsers && userSearchResults && userSearchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => startConversation([userMap.get(currentUserId)!, user])}
                className="cursor-pointer flex items-center px-4 py-3 hover:bg-accent transition"
              >
                {avatarRenderer(user, "md")}
                <div className="ml-3 text-sm font-medium">{user.username}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2">
            {conversations.length === 0 && !searchQuery && (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet. Start a new one!
              </div>
            )}
            {conversations.filter(conversation =>
              searchQuery
                ? (conversation.name || getOtherParticipant?.(conversation)?.username || "")
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
                : true
            ).map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              const otherParticipant = getOtherParticipant?.(conversation);
              const displayUser = conversation.is_group ? null : otherParticipant;
              const isOnline = displayUser ? onlineUsers?.get(displayUser.id) === "online" : false;

              const avatarSrc = displayUser?.avatar || "/default-avatar.png";
              const displayName = conversation.is_group && conversation.name
                ? conversation.name
                : displayUser?.username || "Unknown User";

              const lastMessage = conversation.last_message;
              let preview = "No messages yet";

              if (lastMessage) {
                if (typeof lastMessage === "string") {
                  preview = lastMessage.length > 40 ? lastMessage.slice(0, 40) + "..." : lastMessage;
                } else if (
                  typeof lastMessage === "object" &&
                  lastMessage !== null &&
                  "content" in lastMessage
                ) {
                  const messageContent = (lastMessage as MessageContentType).content;
                  preview = messageContent.length > 40 ? messageContent.slice(0, 40) + "..." : messageContent;
                }
              }

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={cn(
                    "cursor-pointer flex items-center px-4 py-3 hover:bg-accent transition",
                    isSelected && "bg-accent"
                  )}
                >
                  {displayUser ? (
                    avatarRenderer(displayUser, "md")
                  ) : (
                    <div className="relative w-10 h-10 mr-3">
                      <Image
                        src={conversation.is_group ? "/group-placeholder.png" : "/default-avatar.png"}
                        alt={displayName}
                        className="rounded-full object-cover"
                        fill
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 ml-3">
                    <div className="text-sm font-medium truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {preview}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
