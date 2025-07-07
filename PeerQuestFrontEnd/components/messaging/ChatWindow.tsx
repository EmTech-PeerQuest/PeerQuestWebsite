import React, { useState, useEffect, useRef, RefObject } from "react"
import MessageBubble from "./MessageBubble"
import TypingIndicator from "./TypingIndicator"
import MessageInput from "./MessageInput"
import ConversationHeader from "./ConversationHeader"
import type {
  User,
  Message,
  TypingUser,
  Attachment,
  MessageStatus,
  Conversation,
} from "@/lib/types"

interface ChatWindowProps {
  messages: Message[]
  currentUserId: string
  currentUser: User
  otherParticipant: User | null
  conversationName?: string
  isGroupChat: boolean
  onSendMessage: (content: string, files?: File[]) => Promise<void>
  onTyping: () => void
  typingUserIds: string[]
  wsError?: string
  wsConnected: boolean
  messagesContainerRef: RefObject<HTMLDivElement>
  newMessage: string
  setNewMessage: (msg: string) => void
  renderAvatar: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  formatTime: (date: string) => string
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  selectedFiles: File[]
  onToggleInfo: () => void
  onlineUsers?: Map<string, "online" | "idle" | "offline">
  isSending: boolean
  fileInputRef: RefObject<HTMLInputElement>
  children?: React.ReactNode
  activeConversation: string | null
  conversations: Conversation[]
  getOtherParticipant: (conversation: Conversation) => User | null
}

export default function ChatWindow({
  messages,
  currentUserId,
  currentUser,
  otherParticipant,
  conversationName,
  isGroupChat,
  onSendMessage,
  onTyping,
  typingUserIds,
  wsError,
  wsConnected,
  messagesContainerRef,
  newMessage,
  setNewMessage,
  renderAvatar,
  formatTime,
  handleFileSelect,
  removeFile,
  selectedFiles,
  onToggleInfo,
  onlineUsers = new Map(),
  isSending,
  fileInputRef,
  activeConversation,
  conversations,
  getOtherParticipant,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const transformedTypingUsers: TypingUser[] = typingUserIds
    .filter((userId) => userId !== currentUserId)
    .map((userId) => {
      const user =
        otherParticipant?.id === userId
          ? otherParticipant
          : currentUser.id === userId
          ? currentUser
          : null
      return {
        user_id: userId,
        username: user?.username || `User ${userId}`,
      }
    })

  const scrollToBottom = () => {
    const scrollContainer = messagesContainerRef?.current
    if (scrollContainer) {
      const isNearBottom =
        scrollContainer.scrollHeight - scrollContainer.clientHeight <=
        scrollContainer.scrollTop + 100
      if (isNearBottom || messages.length <= 1) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      } else {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage && lastMessage.sender.id === currentUserId) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentUserId])

  const handleAttachmentClick = (attachment: Attachment) => {
    if (!attachment.url) return
    if (attachment.content_type?.startsWith("image/")) {
      window.open(attachment.url, "_blank")
    } else {
      const link = document.createElement("a")
      link.href = attachment.url
      link.download = attachment.filename
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleTypingEvent = () => {
    onTyping()
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <ConversationHeader
        activeConversation={activeConversation}
        conversations={conversations}
        getOtherParticipant={getOtherParticipant}
        onlineUsers={onlineUsers}
        wsConnected={wsConnected}
        wsError={wsError}
        onToggleInfo={onToggleInfo}
        renderAvatar={renderAvatar}
      />

      {/* WebSocket Status */}
      {!wsConnected && wsError && (
        <div
          className="px-4 py-2 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white font-medium text-sm"
          role="alert"
        >
          <p>Connection Error: {wsError}</p>
        </div>
      )}
      {!wsConnected && !wsError && (
        <div
          className="px-4 py-2 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white font-medium text-sm"
          role="status"
        >
          <p>Disconnected from server. Trying to reconnect...</p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
        aria-live="polite"
        role="log"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-6">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id || message.timestamp + message.sender.id}
              message={message}
              isOwnMessage={message.sender.id === currentUserId}
              status={message.status as MessageStatus}
              onAttachmentClick={handleAttachmentClick}
              renderAvatar={renderAvatar}
              onlineUsers={onlineUsers}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white px-4 py-1">
        <TypingIndicator
          typingUsers={transformedTypingUsers}
          currentUserId={currentUserId}
        />
      </div>

      {/* Message Input */}
      <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D]">
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={onSendMessage}
          onTyping={handleTypingEvent}
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
  )
}
