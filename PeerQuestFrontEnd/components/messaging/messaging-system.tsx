"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Send, MoreVertical, Info, Paperclip, X, Download, FileText, ImageIcon, ArrowLeft } from "lucide-react"
import axios from "axios"
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

const TEST_CONVERSATION_ID = 1; // Change this to a valid conversation ID in your DB

// CORS fix: Make sure to set credentials true in axios
axios.defaults.withCredentials = true;

// Hardcoded users for testing (add required fields)
const HARDCODED_USERS: User[] = [
  { id: 1, username: 'Alice', email: 'alice@example.com', level: 5 },
  { id: 2, username: 'Bob', email: 'bob@example.com', level: 3 },
  { id: 3, username: 'Charlie', email: 'charlie@example.com', level: 2 },
];

// Hardcoded conversations for testing
const HARDCODED_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    participants: [HARDCODED_USERS[0], HARDCODED_USERS[1]],
    last_message: 'Hey Bob!',
    last_message_date: '2025-06-27T10:00:00Z',
    unread_count: 0,
  },
  {
    id: 2,
    participants: [HARDCODED_USERS[0], HARDCODED_USERS[2]],
    last_message: 'Hi Charlie!',
    last_message_date: '2025-06-27T09:00:00Z',
    unread_count: 1,
  },
];

export function MessagingSystem({ currentUser: initialUser, showToast }: MessagingSystemProps) {
  // Use hardcoded users and conversations for testing
  const [currentUser, setCurrentUser] = useState<User | null>(HARDCODED_USERS[0])
  const [conversations, setConversations] = useState<Conversation[]>(HARDCODED_CONVERSATIONS)
  const [activeConversation, setActiveConversation] = useState<number | null>(TEST_CONVERSATION_ID)
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

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [userRes, convoRes] = await Promise.all([
  //         axios.get("/api/users/me/"),
  //         axios.get("/api/messages/conversations/")
  //       ])
  //       setCurrentUser(userRes.data)
  //       setConversations(convoRes.data)
  //     } catch (err: any) {
  //       if (err.response?.status === 404) {
  //         showToast("Messaging backend not ready", "warning")
  //       } else {
  //         showToast("Failed to load messaging data", "error")
  //       }
  //     }
  //   }
  //   fetchData()
  // }, [])


  // Hardcoded messages for each conversation
  const HARDCODED_MESSAGES: { [key: number]: Message[] } = {
    1: [
      {
        id: 1,
        sender: HARDCODED_USERS[0],
        receiver: HARDCODED_USERS[1],
        content: "Hey Bob!",
        created_at: "2025-06-27T10:00:00Z",
        read: true,
      },
      {
        id: 2,
        sender: HARDCODED_USERS[1],
        receiver: HARDCODED_USERS[0],
        content: "Hi Alice!",
        created_at: "2025-06-27T10:01:00Z",
        read: true,
      },
    ],
    2: [
      {
        id: 3,
        sender: HARDCODED_USERS[0],
        receiver: HARDCODED_USERS[2],
        content: "Hi Charlie!",
        created_at: "2025-06-27T09:00:00Z",
        read: false,
      },
      {
        id: 4,
        sender: HARDCODED_USERS[2],
        receiver: HARDCODED_USERS[0],
        content: "Hello Alice!",
        created_at: "2025-06-27T09:02:00Z",
        read: false,
      },
    ],
  }

  useEffect(() => {
    if (activeConversation !== null) {
      setMessages(HARDCODED_MESSAGES[activeConversation] || [])
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

  // Basic WebSocket chat UI example
  // NOTE: Replace 'ws://localhost:8000/ws/chat/general/' with your actual backend WebSocket URL
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    if (activeConversation === null) return
    // Example: use conversation id as room name
    const socket = new WebSocket(`ws://localhost:8000/ws/chat/${activeConversation}/`)
    setWs(socket)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages((prev) => [...prev, data])
    }
    socket.onclose = () => {
      setWs(null)
    }
    return () => {
      socket.close()
    }
  }, [activeConversation])

  const handleWebSocketSend = () => {
    if (ws && newMessage.trim()) {
      ws.send(JSON.stringify({
        message: newMessage,
        sender: currentUser.id,
        conversation: activeConversation
      }))
      setNewMessage("")
    }
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversation List */}
      <div className="w-1/3 border-r bg-[#F4F0E6] p-4 overflow-y-auto">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full mb-4 px-2 py-1 border rounded"
        />
        <ul>
          {filteredConversations.map(convo => {
            const other = getOtherParticipant(convo)
            return (
              <li
                key={convo.id}
                className={`p-2 rounded cursor-pointer mb-2 ${activeConversation === convo.id ? 'bg-[#CDAA7D] text-white' : 'hover:bg-[#e5d6c2]'}`}
                onClick={() => handleConversationSelect(convo.id)}
              >
                <div className="font-bold">{other?.username || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{convo.last_message}</div>
              </li>
            )
          })}
        </ul>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation === null ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-2 flex ${msg.sender.id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.sender.id === currentUser.id ? 'bg-[#8B75AA] text-white' : 'bg-gray-200 text-gray-800'}`}>
                    <div>{msg.content}</div>
                    <div className="text-xs mt-1 opacity-70">{formatTime(msg.created_at)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleWebSocketSend() }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={handleWebSocketSend}
                className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699]"
                disabled={!newMessage.trim() || !ws}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}