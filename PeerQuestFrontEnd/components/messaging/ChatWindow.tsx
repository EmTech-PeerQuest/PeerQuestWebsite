"use client"

import React, { useCallback, RefObject } from "react"
import MessageList from "./MessageList" // Import the corrected MessageList
import TypingIndicator from "./TypingIndicator"
import MessageInput from "./MessageInput"
import ConversationHeader from "./ConversationHeader"
import type { User, Message, TypingUser, Attachment, Conversation } from "@/lib/types"

interface ChatWindowProps {
  messages: Message[]
  currentUser: User
  onSendMessage: (content: string, files?: File[]) => Promise<void>
  onTyping: () => void
  // Pass the full TypingUser object, not just the ID
  typingUsers: TypingUser[]
  wsError?: string
  wsConnected: boolean
  newMessage: string
  setNewMessage: React.Dispatch<React.SetStateAction<string>>
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  selectedFiles: File[]
  onToggleInfo: () => void
  onlineUsers: Map<string, "online" | "idle" | "offline">
  isSending: boolean
  fileInputRef: RefObject<HTMLInputElement>
  activeConversation: Conversation | null // Pass the whole conversation object
  getOtherParticipant: (conversation: Conversation) => User | null
}

export default function ChatWindow({
  messages,
  currentUser,
  onSendMessage,
  onTyping,
  typingUsers, // Use the simplified prop
  wsError,
  wsConnected,
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
  getOtherParticipant,
}: ChatWindowProps) {
  const handleAttachmentClick = useCallback((attachment: Attachment) => {
    // Logic to handle opening/downloading attachments
    window.open(attachment.url, "_blank", "noopener,noreferrer")
  }, [])

  if (!activeConversation) {
    return <div className="flex items-center justify-center h-full">Select a conversation.</div>
  }

  return (
    <div className="flex flex-col h-full w-full bg-card">
      {/* Header */}
      <ConversationHeader
        conversation={activeConversation}
        getOtherParticipant={getOtherParticipant}
        onlineUsers={onlineUsers}
        onToggleInfo={onToggleInfo}
        renderAvatar={renderAvatar}
      />

      {/* Connection Status Banner */}
      {!wsConnected && (
        <div
          className="px-4 py-2 bg-yellow-600 text-white font-medium text-sm text-center"
          role="alert"
        >
          {wsError ? `Connection Error: ${wsError}` : "Reconnecting..."}
        </div>
      )}

      {/* Message List (Using the dedicated component) */}
      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        renderAvatar={renderAvatar}
        onlineUsers={onlineUsers}
      />

      {/* Typing Indicator & Message Input */}
      <div className="border-t border-border p-4 bg-background">
        <TypingIndicator typingUsers={typingUsers} currentUserId={currentUser.id} />
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={onSendMessage}
          onTyping={onTyping}
          disabled={!wsConnected || isSending}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          selectedFiles={selectedFiles}
          isSending={isSending}
          fileInputRef={fileInputRef}
        />
      </div>
    </div>
  )
}