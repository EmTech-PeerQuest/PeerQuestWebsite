"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Send, MoreVertical, Info, Paperclip, X, Download, FileText, ImageIcon, ArrowLeft } from "lucide-react"
import type { User } from "@/lib/types"

interface MessagingSystemProps {
  currentUser: User | null
  showToast: (message: string, type?: string) => void
}

interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export function MessagingSystem({ currentUser, showToast }: MessagingSystemProps) {
  const [conversations, setConversations] = useState(mockConversations)
  const [activeConversation, setActiveConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get the other participant in a conversation
  const getOtherParticipant = (conversation: any) => {
    if (!currentUser) return null
    const otherId = conversation.participants.find((id: number) => id !== currentUser.id)
    return otherId ? mockUsers.find((user) => user.id === otherId) : null
  }

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    if (!otherParticipant) return false

    return otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation !== null && currentUser) {
      // Find messages for this conversation
      const conversationMessages = mockMessages.filter(
        (msg) =>
          (msg.senderId === currentUser.id &&
            msg.receiverId ===
              conversations
                .find((c) => c.id === activeConversation)
                ?.participants.find((id) => id !== currentUser.id)) ||
          (msg.receiverId === currentUser.id &&
            msg.senderId ===
              conversations.find((c) => c.id === activeConversation)?.participants.find((id) => id !== currentUser.id)),
      )

      setMessages(conversationMessages || [])

      // Mark messages as read
      const updatedConversations = conversations.map((conv) =>
        conv.id === activeConversation ? { ...conv, unreadCount: 0 } : conv,
      )
      setConversations(updatedConversations)
    }
  }, [activeConversation, currentUser, conversations])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newAttachments: FileAttachment[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
    setShowAttachmentPreview(true)
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
    if (attachments.length === 1) {
      setShowAttachmentPreview(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon size={16} />
    return <FileText size={16} />
  }

  const handleSendMessage = () => {
    if ((!newMessage.trim() && attachments.length === 0) || activeConversation === null || !currentUser) return

    const otherParticipantId = conversations
      .find((c) => c.id === activeConversation)
      ?.participants.find((id) => id !== currentUser.id)

    if (!otherParticipantId) return

    const newMsg = {
      id: Date.now(),
      senderId: currentUser.id,
      receiverId: otherParticipantId,
      content: newMessage || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: new Date(),
      read: false,
    }

    // Add to messages
    setMessages((prev) => [...prev, newMsg])

    // Update conversation
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              lastMessage: newMessage || `Sent ${attachments.length} file(s)`,
              lastMessageDate: new Date(),
            }
          : conv,
      ),
    )

    setNewMessage("")
    setAttachments([])
    setShowAttachmentPreview(false)

    showToast("Message sent!", "success")
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const handleConversationSelect = (conversationId: number) => {
    setActiveConversation(conversationId)
    setShowMobileChat(true)
  }

  const handleBackToConversations = () => {
    setShowMobileChat(false)
    setActiveConversation(null)
  }

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#2C1A1D] mb-4">Please Log In</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to access the messaging system.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex h-[500px] md:h-[600px]">
          {/* Conversations Sidebar - Mobile: Full width when not in chat, Desktop: Always visible */}
          <div
            className={`${showMobileChat ? "hidden" : "flex"} md:flex w-full md:w-1/3 border-r border-gray-200 flex-col`}
          >
            <div className="p-3 md:p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#2C1A1D]">Messages</h2>
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 rounded-full px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation)
                  if (!otherParticipant) return null

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation.id)}
                      className={`w-full text-left p-3 md:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        activeConversation === conversation.id ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-10 md:w-12 h-10 md:h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-lg md:text-xl text-white">
                            {otherParticipant.avatar}
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              otherParticipant.isAdmin ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-[#2C1A1D] truncate">{otherParticipant.username}</h3>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(new Date(conversation.lastMessageDate))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-gray-600 truncate flex-1 mr-2">{conversation.lastMessage}</p>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-[#8B75AA] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-4 text-center text-gray-500">No conversations found</div>
              )}
            </div>
          </div>

          {/* Chat Area - Mobile: Full width when in chat, Desktop: Always visible */}
          <div className={`${!showMobileChat ? "hidden" : "flex"} md:flex flex-col w-full md:w-2/3`}>
            {activeConversation !== null ? (
              <>
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <button
                      onClick={handleBackToConversations}
                      className="md:hidden mr-3 text-gray-500 hover:text-[#8B75AA]"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-8 md:w-10 h-8 md:h-10 bg-[#8B75AA] rounded-full flex items-center justify-center text-sm md:text-lg text-white">
                      {getOtherParticipant(conversations.find((c) => c.id === activeConversation))?.avatar}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-[#2C1A1D] text-sm md:text-base">
                        {getOtherParticipant(conversations.find((c) => c.id === activeConversation))?.username}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {getOtherParticipant(conversations.find((c) => c.id === activeConversation))?.isAdmin
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <button className="text-gray-500 hover:text-[#8B75AA]">
                      <Info size={18} />
                    </button>
                    <button className="text-gray-500 hover:text-[#8B75AA]">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 p-3 md:p-4 overflow-y-auto">
                  {messages.length > 0 ? (
                    messages
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`mb-3 md:mb-4 flex ${
                            message.senderId === currentUser.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          {message.senderId !== currentUser.id && (
                            <div className="w-6 md:w-8 h-6 md:h-8 bg-[#8B75AA] rounded-full flex items-center justify-center text-xs md:text-sm text-white mr-2 flex-shrink-0">
                              {getOtherParticipant(conversations.find((c) => c.id === activeConversation))?.avatar}
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] md:max-w-[70%] px-3 md:px-4 py-2 rounded-lg ${
                              message.senderId === currentUser.id
                                ? "bg-[#8B75AA] text-white rounded-br-none"
                                : "bg-gray-100 text-[#2C1A1D] rounded-bl-none"
                            }`}
                          >
                            <p className="text-sm md:text-base">{message.content}</p>

                            {/* File Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment: FileAttachment) => (
                                  <div
                                    key={attachment.id}
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                      message.senderId === currentUser.id
                                        ? "bg-white/20 border-white/30"
                                        : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    {getFileIcon(attachment.type)}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs md:text-sm font-medium truncate">{attachment.name}</p>
                                      <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                    </div>
                                    <button
                                      onClick={() => window.open(attachment.url, "_blank")}
                                      className={`p-1 rounded hover:bg-black/10 ${
                                        message.senderId === currentUser.id ? "text-white" : "text-gray-600"
                                      }`}
                                    >
                                      <Download size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-xs mt-1 opacity-70">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500 text-sm md:text-base">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachment Preview */}
                {showAttachmentPreview && attachments.length > 0 && (
                  <div className="px-3 md:px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{attachments.length} file(s) selected</span>
                      <button
                        onClick={() => {
                          setAttachments([])
                          setShowAttachmentPreview(false)
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1"
                        >
                          {getFileIcon(attachment.type)}
                          <span className="text-sm truncate max-w-[100px] md:max-w-[120px]">{attachment.name}</span>
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-3 md:p-4 border-t border-gray-200">
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-[#8B75AA] hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    <div className="flex-1">
                      <textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="w-full bg-gray-100 rounded-lg px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B75AA] resize-none"
                        rows={1}
                        style={{ minHeight: "36px", maxHeight: "120px" }}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && attachments.length === 0}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                        newMessage.trim() || attachments.length > 0
                          ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-[#8B75AA] rounded-full flex items-center justify-center text-white text-xl md:text-2xl mx-auto mb-4">
                    💬
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#2C1A1D] mb-2">Your Messages</h3>
                  <p className="text-gray-500 text-sm md:text-base max-w-xs">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
