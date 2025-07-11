"use client";
import React, { useEffect, useRef } from "react"
import { MessengerImage, MessengerFile } from "./chat-window-helpers"
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

function ChatWindow({
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
  onToggleInfo,
  onlineUsers,
  isSending,
  activeConversation,
  conversations,
  getOtherParticipant,
  isLoading,
}: ChatWindowProps) {
  // File attachment state and handlers
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = ""; // reset input
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Wrap onSendMessage to include files
  const handleSendMessage = async (content: string) => {
    await onSendMessage(content, selectedFiles);
    setSelectedFiles([]);
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const otherParticipant = getOtherParticipant(activeConversation)
  // Only use onlineUsers map for online status (no backend fallback)
  const presence = otherParticipant ? onlineUsers.get(otherParticipant.id) : undefined;
  let isOnline = false;
  let isIdle = false;
  let onlineLabel = "Offline";
  if (presence === "online") {
    isOnline = true;
    onlineLabel = "Online";
  } else if (presence === "idle") {
    isIdle = true;
    onlineLabel = "Idle";
  }
  // Always show Online if presence is online, never show Offline if user is online
  return (
    <div className="flex flex-col h-[calc(100vh-96px)] relative overflow-hidden" style={{ backgroundColor: "var(--tavern-cream)", marginTop: '48px', marginBottom: '48px', borderRadius: '20px' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b" style={{ backgroundColor: "var(--tavern-dark)", borderColor: "var(--tavern-gold)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherParticipant && renderAvatar(otherParticipant)}
            <div>
              <h2 className="font-semibold" style={{ color: "var(--tavern-gold)" }}>{otherParticipant?.username || "Unknown User"}</h2>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--tavern-cream)" }}>
                <>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : isIdle ? "bg-amber-400" : "bg-slate-400"}`} title={onlineLabel} />
                  <span className={isOnline ? "text-green-400 font-medium" : isIdle ? "text-amber-400 font-medium" : "text-slate-300 font-medium"}>{onlineLabel.charAt(0).toUpperCase() + onlineLabel.slice(1)}</span>
                </>
                {wsConnected ? <Wifi className="w-4 h-4 text-green-400 ml-2" /> : <WifiOff className="w-4 h-4 text-red-400 ml-2" />}
              </div>
            </div>
          </div>
          <button onClick={onToggleInfo} className="p-2 rounded-lg transition-colors hover:bg-opacity-20" style={{ backgroundColor: "var(--tavern-gold)" }}>
            <Info className="w-5 h-5" style={{ color: "var(--tavern-dark)" }} />
          </button>
        </div>
      </div>

      {/* WebSocket Error */}
      {wsError && (
        <div className="flex-shrink-0 bg-red-900 border-b border-red-700 p-3 text-center">
          <p className="text-red-200 text-sm font-medium">Connection lost. Trying to reconnect...</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollContainerRef} style={{ backgroundColor: "var(--tavern-cream)", paddingBottom: "140px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--tavern-gold)" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full" style={{ color: "var(--tavern-dark)" }}>
            <p className="font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => {
              const isCurrentUser = message.sender.id === currentUser.id;
              return (
                <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                  <div className="flex-shrink-0">
                    {renderAvatar({
                      id: message.sender.id,
                      username: message.sender.username,
                      avatar: message.sender.avatar,
                      email: (message.sender as any).email || "unknown@example.com"
                    })}
                  </div>
                  <div className="flex-1 max-w-xs lg:max-w-md xl:max-w-lg">
                    <div className={`px-4 py-2 rounded-2xl shadow-sm ${isCurrentUser ? "ml-auto" : ""}`} style={{ backgroundColor: isCurrentUser ? "var(--tavern-gold)" : "white", color: "var(--tavern-dark)", border: `1px solid ${isCurrentUser ? "var(--tavern-purple)" : "var(--tavern-gold)"}` }}>
                      {message.content && (<p className="whitespace-pre-wrap break-words">{message.content}</p>)}
                      {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((attachment, aidx) => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test((attachment.filename || "") + (attachment.url || ""));
                            if (isImage && attachment.url) {
                              return <MessengerImage key={attachment.url || aidx} url={attachment.url} filename={attachment.filename} />;
                            } else {
                              return <MessengerFile key={attachment.url || aidx} url={attachment.url} filename={attachment.filename} />;
                            }
                          })}
                        </div>
                      )}
                    </div>
                    <div className={`mt-1 text-xs font-medium ${isCurrentUser ? "text-right" : ""}`} style={{ color: "var(--tavern-dark)" }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {isCurrentUser && message.status && (
                        <span className="ml-2" style={{ color: "var(--tavern-purple)" }}>
                          {message.status === "sending" && "⏳"}
                          {message.status === "sent" && "✓"}
                          {message.status === "delivered" && "✓✓"}
                          {message.status === "read" && "✓✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
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
      <div className="fixed bottom-0 left-[300px] z-10 border-t p-4 bg-[var(--tavern-dark)]" style={{ borderColor: "var(--tavern-gold)", minHeight: "90px", width: "calc(100% - 300px)" }}>
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={handleSendMessage}
          onTyping={onTyping}
          disabled={!wsConnected || isSending}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          selectedFiles={selectedFiles}
          isSending={isSending}
          fileInputRef={fileInputRef}
          wsConnected={wsConnected}
        />
      </div>
    </div>

  );
}

export default ChatWindow;

