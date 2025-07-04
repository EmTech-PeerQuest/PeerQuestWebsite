"use client"
import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import axios from "axios"
import type { User } from "@/lib/types"

interface MessagingSystemProps {
  currentUser: User | null
  showToast: (message: string, type?: string) => void
}

interface Message {
  id: number
  sender: {
    id: number | string
    username: string
    email?: string
  }
  receiver: {
    id: number | string
    username: string
    email?: string
  }
  content: string
  attachments?: string[]
  created_at: string
  read: boolean
}

interface Conversation {
  id: string
  participants: User[]
  last_message: string
  last_message_date: string
  unread_count: number
}

// CORS fix: Make sure to set credentials true in axios
axios.defaults.withCredentials = true

export function MessagingSystem({ currentUser: initialUser, showToast }: MessagingSystemProps) {
  // ALL STATE DECLARATIONS AT THE TOP - ALWAYS CALLED IN SAME ORDER
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  // NEW USER SEARCH STATE
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  // ALL REF DECLARATIONS
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch users and conversations from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
        const token = localStorage.getItem("access_token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        console.log("Fetching data from:", `${apiBase}/api/users/me/`)

        const [userRes, convoRes] = await Promise.all([
          axios.get(`${apiBase}/api/users/me/`, { headers }),
          axios.get(`${apiBase}/api/messages/conversations/`, { headers }),
        ])

        console.log("User data:", userRes.data)
        console.log("Conversations data:", convoRes.data)

        setCurrentUser(userRes.data)
        setConversations(convoRes.data)
      } catch (err: any) {
        console.error("Error fetching data:", err.response?.data || err.message)

        if (err.response?.status === 401 || err.response?.status === 403) {
          showToast("You are not authenticated. Please log in.", "error")
        } else {
          showToast("Failed to load messaging data", "error")
        }
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return

      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
        const token = localStorage.getItem("access_token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const res = await axios.get(`${apiBase}/api/messages/conversations/${activeConversation}/messages/`, {
          headers,
        })
        setMessages(res.data)
      } catch (err: any) {
        console.error("Failed to fetch messages:", err)
        // Don't show error toast for 404 - it just means no messages yet
        if (err.response?.status !== 404) {
          showToast("Could not load messages for this conversation.", "error")
        }
      }
    }

    fetchMessages()
  }, [activeConversation])

  // Function to update conversation with new message
  const updateConversationWithMessage = (conversationId: string, messageContent: string, timestamp: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            last_message: messageContent,
            last_message_date: timestamp,
          }
        }
        return conv
      }),
    )
  }

  // NEW USER SEARCH FUNCTION
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([])
      return
    }

    setIsSearchingUsers(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      const token = localStorage.getItem("access_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.get(`${apiBase}/api/messages/users/search/?q=${encodeURIComponent(query)}`, {
        headers,
      })
      setUserSearchResults(response.data)
    } catch (error: any) {
      console.error("Error searching users:", error)
      showToast("Failed to search users", "error")
    } finally {
      setIsSearchingUsers(false)
    }
  }

  // DEBOUNCE USER SEARCH
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchUsers(userSearchQuery)
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [userSearchQuery])

  // START NEW CONVERSATION FUNCTION
  const startConversation = async (userId: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      const token = localStorage.getItem("access_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.post(
        `${apiBase}/api/conversations/start/`,
        {
          participant_id: userId,
        },
        { headers },
      )

      if (response.data) {
        const newConversation = response.data

        // Check if conversation already exists in our list
        const existingConversation = conversations.find((conv) => conv.id === newConversation.id)

        if (!existingConversation) {
          setConversations((prev) => [...prev, newConversation])
        }

        setActiveConversation(newConversation.id)
        setUserSearchQuery("")
        setUserSearchResults([])
        setShowUserSearch(false)
        showToast("Conversation started!", "success")
      }
    } catch (error: any) {
      console.error("Error starting conversation:", error)
      showToast("Failed to start conversation", "error")
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    if (!currentUser) return null
    return conversation.participants.find((user: User) => user.id !== currentUser.id) || null
  }

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  })

  useEffect(() => {
    if (!activeConversation || !currentUser) {
      // Close existing WebSocket if no active conversation
      if (ws) {
        console.log("Closing WebSocket - no active conversation")
        ws.close(1000, "No active conversation")
        setWs(null)
        setWsConnected(false)
      }
      return
    }

    // Close existing WebSocket before creating new one
    if (ws) {
      console.log("Closing existing WebSocket before creating new one")
      ws.close(1000, "Switching conversations")
      setWs(null)
      setWsConnected(false)
    }

    // Add a small delay to ensure the previous connection is fully closed
    const connectTimeout = setTimeout(() => {
      const token = localStorage.getItem("access_token")
      const wsUrl = `ws://localhost:8000/ws/chat/${activeConversation}/?token=${token}`
      console.log("Connecting to WebSocket:", wsUrl)

      const wsInstance = new WebSocket(wsUrl)
      setWs(wsInstance)

      wsInstance.onopen = () => {
        console.log("WebSocket connected to conversation:", activeConversation)
        setWsConnected(true)
      }

      wsInstance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("WebSocket message received:", data)

          // Handle connection status messages
          if (data.type === "connection_status") {
            console.log("Connection status:", data.message)
            return
          }

          const newMsg: Message = {
            id: data.id || Date.now(),
            content: data.content,
            created_at: data.timestamp || new Date().toISOString(),
            read: false,
            attachments: [],
            sender: {
              id: data.sender?.id || data.sender_id,
              username: data.sender?.username || "Unknown",
            },
            receiver: {
              id: data.recipient_id,
              username: "",
            },
          }

          setMessages((prev) => [...prev, newMsg])

          // Update the conversation list with the new message
          updateConversationWithMessage(activeConversation, data.content, data.timestamp || new Date().toISOString())
        } catch (err) {
          console.error("Invalid WS message:", event.data, err)
          showToast("Received invalid message.", "error")
        }
      }

      wsInstance.onerror = (event) => {
        console.error("WebSocket error:", event)
        setWsConnected(false)
        showToast("WebSocket connection error", "error")
      }

      wsInstance.onclose = (event) => {
        console.warn("WebSocket closed:", event)
        setWs(null)
        setWsConnected(false)

        if (event.code === 4001) {
          showToast("Authentication failed for WebSocket", "error")
        } else if (event.code === 4000) {
          showToast("WebSocket connection failed", "error")
        } else if (event.code !== 1000) {
          console.log("Unexpected WebSocket close, attempting reconnect...")
          // Only attempt reconnect if we still have an active conversation
          if (activeConversation) {
            setTimeout(() => {
              console.log("Attempting WebSocket reconnect...")
              // Trigger a re-render to reconnect
              setActiveConversation((prev) => prev)
            }, 1000)
          }
        }
      }
    }, 100) // Small delay to ensure clean connection switching

    return () => {
      clearTimeout(connectTimeout)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounting")
      }
    }
  }, [activeConversation, currentUser])

  const formatTime = (date: string) => {
    const parsed = new Date(date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (diff === 1) return "Yesterday"
    if (diff < 7) return parsed.toLocaleDateString([], { weekday: "short" })
    return parsed.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const handleConversationSelect = (id: string) => {
    setActiveConversation(id)
  }

  const handleWebSocketSend = () => {
    console.log("Attempting to send message:", {
      currentUser: currentUser?.id,
      newMessage: newMessage.trim(),
      ws: ws?.readyState,
      wsConnected,
      activeConversation,
    })

    if (!currentUser || !newMessage.trim() || !ws || !activeConversation) {
      console.log("Cannot send - missing requirements")
      return
    }

    const conversation = conversations.find((c) => c.id === activeConversation)
    const receiver = conversation?.participants.find((u) => u.id !== currentUser.id)

    if (!receiver) {
      showToast("Could not find the recipient for this conversation.", "error")
      return
    }

    if (ws.readyState === WebSocket.OPEN) {
      const messageData = {
        content: newMessage,
        sender_id: currentUser.id,
        recipient_id: receiver.id,
      }

      console.log("Sending WebSocket message:", messageData)
      try {
        ws.send(JSON.stringify(messageData))

        // Immediately update the conversation list with the sent message
        updateConversationWithMessage(activeConversation, newMessage, new Date().toISOString())

        setNewMessage("")
      } catch (error) {
        console.error("Error sending WebSocket message:", error)
        showToast("Failed to send message", "error")
      }
    } else {
      console.log("WebSocket not ready, state:", ws.readyState)
      showToast("Connection is not ready. Please wait or refresh.", "error")
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!currentUser) {
    return <div className="p-6 text-center text-gray-500">Loading user data...</div>
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversation List */}
      <div className="w-1/3 border-r bg-[#F4F0E6] p-4 overflow-y-auto">
        {/* SEARCH FOR NEW USERS SECTION */}
        <div className="mb-4">
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="w-full mb-2 px-3 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors"
          >
            {showUserSearch ? "Hide User Search" : "Start New Conversation"}
          </button>

          {showUserSearch && (
            <div className="relative">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users to start a conversation..."
                className="w-full p-2 border rounded"
              />

              {/* User Search Results Dropdown */}
              {userSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => startConversation(user.id.toString())}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                    >
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}

              {isSearchingUsers && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded shadow-lg z-10 p-3">
                  <div className="text-center text-gray-500">Searching users...</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* EXISTING CONVERSATIONS SEARCH */}
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-4 px-2 py-1 border rounded"
        />

        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">No conversations yet</p>
            <p className="text-sm">Use the button above to start a new conversation</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No conversations match your search</p>
          </div>
        ) : (
          <ul>
            {filteredConversations.map((convo) => {
              const other = getOtherParticipant(convo)

              return (
                <li
                  key={convo.id}
                  className={`p-2 rounded cursor-pointer mb-2 ${activeConversation === convo.id ? "bg-[#CDAA7D] text-white" : "hover:bg-[#e5d6c2]"}`}
                  onClick={() => handleConversationSelect(convo.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold">{other?.username || "Unknown"}</div>
                    <div className="text-xs text-gray-400">
                      {formatTime(convo.last_message_date || new Date().toISOString())}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{convo.last_message || "No messages yet"}</div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation === null ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="font-semibold">
                {(() => {
                  const conversation = conversations.find((c) => c.id === activeConversation)
                  const other = conversation ? getOtherParticipant(conversation) : null
                  return other?.username || "Unknown User"
                })()}
              </div>
              <div className="text-sm text-gray-500">
                {wsConnected ? (
                  <span className="text-green-600">● Connected</span>
                ) : (
                  <span className="text-gray-400">○ Connecting...</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSelf = msg.sender?.id?.toString() === currentUser?.id?.toString()

                  return (
                    <div key={idx} className={`mb-2 flex ${isSelf ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`px-3 py-2 rounded-lg max-w-xs ${isSelf ? "bg-[#8B75AA] text-white" : "bg-gray-200 text-gray-800"}`}
                      >
                        <div>{msg.content}</div>
                        <div className="text-xs mt-1 opacity-70">{formatTime(msg.created_at)}</div>
                      </div>
                    </div>
                  )
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleWebSocketSend()
                }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={handleWebSocketSend}
                className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] disabled:opacity-50"
                disabled={!newMessage.trim() || !wsConnected}
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
