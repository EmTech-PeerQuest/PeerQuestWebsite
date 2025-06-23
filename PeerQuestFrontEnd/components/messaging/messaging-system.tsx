"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Send, MoreVertical, Info, Paperclip, X, Download, FileText, ImageIcon, ArrowLeft } from "lucide-react"
import axios from "@/lib/api/auth"
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

interface Message {
  id: number
  sender: User
  receiver: User
  content: string
  attachments?: string[] // URLs to files
  created_at: string
  read: boolean
}

interface Conversation {
  id: number
  participants: User[]
  last_message: string
  last_message_date: string
  unread_count: number
}

export function MessagingSystem({ currentUser: initialUser, showToast }: MessagingSystemProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getOtherParticipant = (conversation: Conversation) => {
    if (!currentUser) return null
    return conversation.participants.find((user: User) => user.id !== currentUser.id) || null
  }

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, convoRes] = await Promise.all([
          axios.get("/api/users/me/"),
          axios.get("/api/messages/conversations/")
        ])
        setCurrentUser(userRes.data)
        setConversations(convoRes.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          showToast("Messaging backend not ready", "warning")
        } else {
          showToast("Failed to load messaging data", "error")
        }
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (activeConversation !== null) {
      axios.get(`/api/messages/conversations/${activeConversation}/messages/`)
        .then(res => setMessages(res.data))
        .catch(() => showToast("Failed to load messages", "error"))
    }
  }, [activeConversation])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    setAttachments([...attachments, ...Array.from(files)])
    setShowAttachmentPreview(true)
  }

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name))
    if (attachments.length === 1) setShowAttachmentPreview(false)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return
    const conversation = conversations.find(c => c.id === activeConversation)
    const receiver = conversation?.participants.find(u => u.id !== currentUser?.id)
    if (!receiver) return

    const formData = new FormData()
    formData.append("receiver_id", receiver.id.toString())
    formData.append("content", newMessage)
    attachments.forEach(file => formData.append("attachments", file))

    try {
      const res = await axios.post("/api/messages/send/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setMessages(prev => [...prev, res.data])
      setNewMessage("")
      setAttachments([])
      setShowAttachmentPreview(false)
      showToast("Message sent!", "success")
    } catch {
      showToast("Failed to send message", "error")
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const getFileIcon = (type: string) => type.startsWith("image/") ? <ImageIcon size={16} /> : <FileText size={16} />

  const formatTime = (date: string) => {
    const parsed = new Date(date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (diff === 1) return "Yesterday"
    if (diff < 7) return parsed.toLocaleDateString([], { weekday: "short" })
    return parsed.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const handleConversationSelect = (id: number) => {
    setActiveConversation(id)
    setShowMobileChat(true)
  }

  const handleBackToConversations = () => {
    setShowMobileChat(false)
    setActiveConversation(null)
  }

  if (!currentUser) {
    return (
      <div className="text-center text-gray-400 py-16">
        Messaging is currently unavailable. Please check back later.
      </div>
    )
  }

  return <div className="text-center text-gray-500">Messaging UI here</div>
}