"use client"

import React, { useEffect, useRef } from "react"
import { Info, Wifi, WifiOff } from "lucide-react"
import type { Message, User, Conversation, UserStatus, TypingUser } from "@/lib/types"
import MessageInput from "./message-input"

interface ChatWindowProps {
  messages: Message[]
  currentUser: User
  onSendMessage: (content: string, files?: File[]) => Promise<void>
  onTyping: () => void
  typingUsers: Pick<TypingUser, "user_id" | "username">[]
  wsConnected: boolean
  wsError?: string
  newMessage: string
  setNewMessage: React.Dispatch<React.SetStateAction<string>>
  renderAvatar: (user: User) => React.ReactNode
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  selectedFiles: File[]
  onToggleInfo: () => void
  onlineUsers: Map<string, UserStatus>
  isSending: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  activeConversation: Conversation
  conversations: Conversation[]
  getOtherParticipant: (conv: Conversation) => User | null
  isLoading: boolean
}

export default function ChatWindow({
  messages,
  currentUser,
  onSendMessage,
  onTyping,
  typingUsers,
  wsConnected,
  wsError,
  newMessage,
  setNewMessage,
  renderAvatar,
  handleFileSelect,
  removeFile,
  selectedFiles,
  onToggleInfo,
  onlineUsers,
  isSending,
  fileInputRef,
  activeConversation,
  conversations,
  getOtherParticipant,
  isLoading,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const otherParticipant = getOtherParticipant(activeConversation)
  const isOnline = otherParticipant
    ? onlineUsers.get(otherParticipant.id) === "online"
    : false

  return (
    <div
      className="flex flex-col h-screen relative overflow-hidden"
      style={{ backgroundColor: "var(--tavern-cream)" }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 py-3 border-b"
        style={{
          backgroundColor: "var(--tavern-dark)",
          borderColor: "var(--tavern-gold)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherParticipant && renderAvatar(otherParticipant)}
            <div>
              <h2
                className="font-semibold"
                style={{ color: "var(--tavern-gold)" }}
              >
                {otherParticipant?.username || "Unknown User"}
              </h2>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--tavern-cream)" }}
              >
                {isOnline ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-400 font-medium">
                      Online
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                    <span className="text-slate-300 font-medium">
                      Offline
                    </span>
                  </>
                )}
                {wsConnected ? (
                  <Wifi className="w-4 h-4 text-green-400 ml-2" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400 ml-2" />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleInfo}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-20"
            style={{ backgroundColor: "var(--tavern-gold)" }}
          >
            <Info
              className="w-5 h-5"
              style={{ color: "var(--tavern-dark)" }}
            />
          </button>
        </div>
      </div>

      {/* WebSocket Error */}
      {wsError && (
        <div className="flex-shrink-0 bg-red-900 border-b border-red-700 p-3 text-center">
          <p className="text-red-200 text-sm font-medium">
            Connection lost. Trying to reconnect...
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={scrollContainerRef}
        style={{ backgroundColor: "var(--tavern-cream)", paddingBottom:  "140px" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: "var(--tavern-gold)" }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ color: "var(--tavern-dark)" }}
          >
            <p className="font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.sender.id === currentUser.id
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    isCurrentUser ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {renderAvatar(message.sender)}
                  </div>
                  <div className="flex-1 max-w-xs lg:max-w-md xl:max-w-lg">
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-sm ${
                        isCurrentUser ? "ml-auto" : ""
                      }`}
                      style={{
                        backgroundColor: isCurrentUser
                          ? "var(--tavern-gold)"
                          : "white",
                        color: "var(--tavern-dark)",
                        border: `1px solid ${
                          isCurrentUser
                            ? "var(--tavern-purple)"
                            : "var(--tavern-gold)"
                        }`,
                      }}
                    >
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                      {Array.isArray(message.attachments) &&
                        message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment.url || attachment.filename}
                                className="flex items-center gap-2"
                              >
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline font-medium hover:opacity-80"
                                  style={{ color: "var(--tavern-purple)" }}
                                >
                                  {attachment.filename}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                    <div
                      className={`mt-1 text-xs font-medium ${
                        isCurrentUser ? "text-right" : ""
                      }`}
                      style={{ color: "var(--tavern-dark)" }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isCurrentUser && message.status && (
                        <span className="ml-2" style={{ color: "var(--tavern-purple)" }}>
                          {message.status === "sending"   && "⏳"}
                          {message.status === "sent"      && "✓" }
                          {message.status === "delivered" && "✓✓"}  {/* ← delivered */}
                          {message.status === "read"      && "✓✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {otherParticipant && renderAvatar(otherParticipant)}
                </div>
                <div
                  className="px-4 py-2 rounded-2xl shadow-sm"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid var(--tavern-gold)",
                  }}
                >
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "var(--tavern-gold)" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "var(--tavern-gold)",
                        animationDelay: "0.1s",
                      }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "var(--tavern-gold)",
                        animationDelay: "0.2s",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Input */}
      <div
        className="fixed bottom-0 left-[300px] z-10 border-t p-4 bg-[var(--tavern-dark)]"
        style={{
          borderColor: "var(--tavern-gold)",
          height: "75px",
          width: "calc(100% - 300px)",
        }}
      >
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={onSendMessage}
          onTyping={onTyping}
          disabled={!wsConnected}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          selectedFiles={selectedFiles}
          isSending={isSending}
          fileInputRef={fileInputRef}
          wsConnected={wsConnected}
        />
      </div>
    </div>
  )
}
