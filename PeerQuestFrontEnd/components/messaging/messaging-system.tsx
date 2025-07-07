"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import axios from "axios"
import type { User, Message, Conversation } from "@/lib/types"

import ConversationList from "@/components/messaging/ConversationList"
import ChatWindow from "@/components/messaging/ChatWindow"
import ConversationInfoPanel from "@/components/messaging/ConversationInfoPanel"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface MessagingSystemProps {
  currentUser: User | null
  showToast: (message: string, type?: string) => void
  onlineUsers?: Map<string, "online" | "idle" | "offline"> // Optional prop for online status
}

axios.defaults.withCredentials = true

export default function MessagingSystem({ currentUser: initialUser, showToast }: MessagingSystemProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [wsError, setWsError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Map<string, "online" | "idle" | "offline">>(new Map())

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

  const userMap = useMemo(() => {
    const map = new Map<string, User>()
    conversations.forEach((c) => c.participants.forEach((u) => map.set(u.id, u)))
    return map
  }, [conversations])

  const otherParticipant = useMemo(() => {
    const convo = conversations.find((c) => c.id === activeConversation)
    return convo?.participants.find((u) => u.id !== currentUser?.id) || null
  }, [activeConversation, conversations, currentUser])

  const isGroupChat = useMemo(() => {
    return conversations.find((c) => c.id === activeConversation)?.is_group || false
  }, [activeConversation, conversations])

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((u) => u.id !== currentUser?.id) || null
  }

  const toggleInfoPanel = () => setShowInfoPanel((prev) => !prev)

  const renderAvatar = (user: User, size: "sm" | "md" | "lg" = "sm") => (
    <Avatar className={size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-10 w-10"}>
      <AvatarImage src={user.avatar || ""} alt={user.username} />
      <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
    </Avatar>
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const selected = Array.from(files).filter((file) => file.size <= 10 * 1024 * 1024) // 10MB limit
      setSelectedFiles(selected)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTyping = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "typing", sender_id: currentUser?.id }))
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const [userRes, convoRes] = await Promise.all([ 
          axios.get(`${API_BASE}/api/users/me/`, { headers }),
          axios.get(`${API_BASE}/api/messages/conversations/`, { headers }),
        ])

        setCurrentUser(userRes.data)
        setConversations(convoRes.data)
      } catch (err: any) {
        console.error("Failed to fetch user/conversations:", err)
        showToast("Failed to load messaging data", "error")
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!activeConversation) return
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get(`${API_BASE}/api/messages/conversations/${activeConversation}/messages/`, { headers })
        setMessages(res.data)
      } catch (err) {
        console.error("Failed to fetch messages", err)
        showToast("Could not load messages", "error")
      }
    }
    fetchMessages()
  }, [activeConversation])

  useEffect(() => {
    if (!activeConversation || !currentUser) return

    if (ws) {
      ws.close(1000, "Switching conversations")
      setWs(null)
    }

    const token = localStorage.getItem("access_token")
    const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://localhost:8000/ws/chat/${activeConversation}/?token=${token}`
    const newWs = new WebSocket(wsUrl)
    setWs(newWs)

    newWs.onopen = () => {
      setWsConnected(true)
      setWsError(null)
    }

    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "typing") {
          setTypingUserIds((prev) =>
            prev.includes(data.sender_id) ? prev : [...prev, data.sender_id]
          )
          setTimeout(() => {
            setTypingUserIds((prev) => prev.filter((id) => id !== data.sender_id))
          }, 3000)
        } else {
          const msg: Message = {
            id: data.id || Date.now(),
            content: data.content,
            conversation_id: data.conversation_id,
            created_at: data.timestamp,
            timestamp: data.timestamp,
            message_type: data.message_type || "text",
            status: data.status || "sent",
            read: false,
            attachments: [],
            sender: { id: data.sender?.id || data.sender_id, username: data.sender?.username || "User" },
            receiver: { id: data.recipient_id, username: "" },
          }
          setMessages((prev) => [...prev, msg])
        }
      } catch (err) {
        console.error("Invalid message", event.data)
      }
    }

    newWs.onerror = (err) => {
      console.error("WebSocket error:", err)
      setWsConnected(false)
      setWsError("WebSocket error")
      showToast("WebSocket error", "error")
    }

    newWs.onclose = () => {
      setWsConnected(false)
      setTypingUserIds([]) // Clear typing users on disconnect
    }

    return () => newWs.close()
  }, [activeConversation, currentUser])

  const handleWebSocketSend = async (content: string, attachments?: File[]) => {
    if (!content || !ws || ws.readyState !== WebSocket.OPEN || !currentUser || !activeConversation) return

    const convo = conversations.find(c => c.id === activeConversation)
    const receiver = convo?.participants.find((u) => u.id !== currentUser.id)
    if (!receiver) return

    const data = {
      content,
      sender_id: currentUser.id,
      recipient_id: receiver.id,
      attachments,
    }

    try {
      ws.send(JSON.stringify(data))
      setNewMessage("")
    } catch (err) {
      console.error("Send error", err)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 1000
    if (diff < 86400) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (diff < 172800) return "Yesterday"
    return d.toLocaleDateString()
  }

  if (!currentUser) return <div className="p-6 text-center">Loading...</div>

  return (
    <div className="flex h-screen overflow-hidden border rounded-lg">
      <ConversationList
        conversations={conversations}
        selectedConversationId={activeConversation}
        onSelectConversation={(c) => setActiveConversation(c.id)}
        currentUserId={currentUser.id}
        userMap={userMap}
        startConversation={async () => {}}
        onlineStatusMap={onlineUsers}
      />

      <ChatWindow
        activeConversation={activeConversation}
        messages={messages}
        currentUser={currentUser}
        currentUserId={currentUser.id}
        formatTime={formatTime}
        wsConnected={wsConnected}
        wsError={wsError ?? ""}
        otherParticipant={otherParticipant}
        isGroupChat={isGroupChat}
        onSendMessage={handleWebSocketSend}
        onTyping={handleTyping}
        typingUserIds={typingUserIds}
        messagesContainerRef={messagesContainerRef}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        renderAvatar={renderAvatar}
        handleFileSelect={handleFileSelect}
        removeFile={removeFile}
        selectedFiles={selectedFiles}
        isSending={isSending}
        fileInputRef={fileInputRef}
        onToggleInfo={toggleInfoPanel}
        onlineUsers={onlineUsers}
        conversations={conversations}
        getOtherParticipant={getOtherParticipant}
      />

      {showInfoPanel && activeConversation && (
        <ConversationInfoPanel
          conversation={conversations.find(c => c.id === activeConversation)!}
          participants={[currentUser, otherParticipant!]}
          onlineUsers={onlineUsers}
          renderAvatar={renderAvatar}
          onClose={toggleInfoPanel}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
