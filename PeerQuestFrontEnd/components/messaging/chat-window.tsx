"use client"

import type React from "react"
import type { RefObject } from "react"
import { motion, AnimatePresence } from "framer-motion"
import MessageList from "./message-list"
import TypingIndicator from "./typing-indicator"
import MessageInput from "./message-input"
import ConversationHeader from "./conversation-header"
import type { User, Message, TypingUser, Conversation, UserStatus } from "@/lib/types"
import { AlertTriangle } from "lucide-react"
import type { JSX } from "react/jsx-runtime"

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
  isLoading: boolean
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
  isLoading,
}: ChatWindowProps) {
  const getValidUserStatus = (status: UserStatus): "online" | "idle" | "offline" => {
    if (status === "online" || status === "idle" || status === "offline") return status
    return "offline"
  }

  const filteredOnlineUsers = new Map<string, "online" | "idle" | "offline">()
  onlineUsers.forEach((status, userId) => {
    filteredOnlineUsers.set(userId, getValidUserStatus(status))
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading messages...
      </div>
    )
  }

  if (!activeConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 opacity-50">
            <svg viewBox="0 0 64 64" fill="currentColor" className="text-slate-400">
              <path d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8zm0 4c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20zm-8 12v8l6-4-6-4zm16 0v8l6-4-6-4z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-700">Select a Conversation</h3>
          <p className="text-slate-500">Choose a conversation to start messaging</p>
        </div>
      </div>
    )
  }

  return (
<div className="flex flex-col h-full">
  {/* Sticky Header Section */}
  <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <ConversationHeader
        conversation={activeConversation}
        getOtherParticipant={getOtherParticipant}
        onlineUsers={filteredOnlineUsers}
        onToggleInfo={onToggleInfo}
        renderAvatar={renderAvatar}
      />

      {/* WebSocket banner */}
      <AnimatePresence>
        {!wsConnected && (
          <motion.div
            className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-2"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              {wsError ? `Connection Error: ${wsError}` : "Reconnecting..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          renderAvatar={renderAvatar}
          onlineUsers={filteredOnlineUsers}
        />
      </div>

      {/* Footer: Typing + Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white">
        <TypingIndicator typingUsers={typingUsers} currentUserId={currentUser.id} />
        <div className="p-4">
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
            wsConnected={wsConnected}
          />
        </div>
      </div>
    </div>
  )
}