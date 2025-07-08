"use client"

import React, { useCallback, RefObject } from "react"
import { motion, AnimatePresence } from "framer-motion"
import MessageList from "./MessageList"
import TypingIndicator from "./TypingIndicator"
import MessageInput from "./MessageInput"
import ConversationHeader from "./ConversationHeader"
import type {
  User,
  Message,
  TypingUser,
  Attachment,
  Conversation,
  UserStatus,
} from "@/lib/types"

interface ChatWindowProps {
  messages: Message[]
  currentUser: User
  onSendMessage: (content: string, files?: File[]) => Promise<void>
  onTyping: () => void
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
  onlineUsers: Map<string, UserStatus>
  isSending: boolean
  fileInputRef: RefObject<HTMLInputElement>
  activeConversation: Conversation | null
  getOtherParticipant: (conversation: Conversation) => User | null
  conversations: Conversation[]
}

export default function ChatWindow({
  messages,
  currentUser,
  onSendMessage,
  onTyping,
  typingUsers,
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
  conversations,
}: ChatWindowProps) {
  const handleAttachmentClick = useCallback((attachment: Attachment) => {
    window.open(attachment.url, "_blank", "noopener,noreferrer")
  }, [])

  const getValidUserStatus = (status: UserStatus): "online" | "idle" | "offline" => {
    if (status === "online" || status === "idle" || status === "offline") return status
    return "offline"
  }

  const filteredOnlineUsers = new Map<string, "online" | "idle" | "offline">()
  onlineUsers.forEach((status, userId) => {
    filteredOnlineUsers.set(userId, getValidUserStatus(status))
  })

  if (!activeConversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a conversation to begin
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col flex-1 min-h-0 w-full bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <ConversationHeader
        conversation={activeConversation}
        getOtherParticipant={getOtherParticipant}
        onlineUsers={filteredOnlineUsers}
        onToggleInfo={onToggleInfo}
        renderAvatar={renderAvatar}
      />

      {/* Connection Banner */}
      <AnimatePresence>
        {!wsConnected && (
          <motion.div
            className="px-4 py-2 bg-yellow-600 text-white font-medium text-sm text-center"
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {wsError ? `Connection Error: ${wsError}` : "Reconnecting..."}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message List */}
      <motion.div
        className="flex-1 min-h-0 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          renderAvatar={renderAvatar}
          onlineUsers={filteredOnlineUsers}
        />
      </motion.div>

      {/* Typing + Input */}
      <motion.div
        className="border-t border-border p-4 bg-background"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
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
      </motion.div>
    </motion.div>
  )
}
