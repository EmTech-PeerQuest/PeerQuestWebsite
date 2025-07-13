"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Cookies from "js-cookie"
import EmojiPicker from "emoji-picker-react"
import { X, Send, Smile, Loader2 } from "lucide-react"
import type { Guild, User, GuildChatMessage } from "@/lib/types"

interface GuildChatModalProps {
  isOpen: boolean
  onClose: () => void
  guild: Guild | null
  currentUser: User | null
  showToast: (message: string, type?: string) => void
  userMemberships?: { [guildId: string]: boolean }
}

export function GuildChatModal({
  isOpen,
  onClose,
  guild,
  currentUser,
  showToast,
  userMemberships = {},
  token,
}: GuildChatModalProps & { token: string }) {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, "online" | "idle" | "offline">>(new Map());
  const [messages, setMessages] = useState<GuildChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [memberDetails, setMemberDetails] = useState<User[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [membershipVerified, setMembershipVerified] = useState(false)
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(!!token)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const seenMessageIds = useRef<Set<string>>(new Set())
  
  // Set authentication state based on token prop
  useEffect(() => {
  setIsAuthenticated(!!token)
  if (!token && isOpen) {
  showToast("Please log in to access guild chat", "error")
  }
  }, [isOpen, showToast, token])

  const API_BASE = "http://localhost:8000/api"
  const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
  try {
  if (!token) {
  throw new Error("No authentication token found")
  }
  
  const response = await fetch(url.startsWith("/api") ? `${API_BASE}${url.replace("/api", "")}` : url, {
  ...options,
  headers: {
  ...options.headers,
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  },
  })

      if (response.status === 401) {
        setIsAuthenticated(false)
        throw new Error("Authentication expired. Please log in again.")
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Expected JSON, got ${contentType}. Response: ${text.substring(0, 200)}...`)
      }
      return await response.json()
    } catch (error) {
      console.error("❌ Fetch error:", error)
      throw error
    }
  }

  const createWebSocketConnection = (guildId: string, token: string) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws"
  // Use localhost:8000 for backend, matching messaging system
  const wsUrl = `${protocol}://localhost:8000/ws/guild/${guildId}/?token=${token}`
  const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      console.log("✅ Connected to guild WebSocket")
      setIsAuthenticated(true)
    }
    
    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error)
      showToast("Connection error. Please try again.", "error")
    }
    
    socket.onclose = (event) => {
      console.log(`🛑 WebSocket closed: ${event.code} - ${event.reason}`)
      if (event.code === 1006 && isOpen) {
        console.warn("⚠️ WebSocket closed unexpectedly. Reconnecting...")
        setTimeout(() => {
          if (guild && isOpen) {
            const newToken = Cookies.get("access")
            if (newToken) {
              socketRef.current = createWebSocketConnection(String(guild.guild_id), newToken)
            }
          }
        }, 2000)
      }
    }

    return socket
  }

  const verifyMembershipWithErrorHandling = async (guildId: string, currentUser: User) => {
    try {
      const data = await fetchWithErrorHandling(`/api/guilds/${guildId}/members/`)
      // API returns a list of GuildMembership objects, extract user
      const members = Array.isArray(data) ? data : data.results || []
      return members.some((m: any) => {
        const memberId = String(m.user?.id || m.id)
        const currentUserId = String(currentUser.id)
        return memberId === currentUserId
      })
    } catch (error) {
      console.error("❌ Failed to verify membership:", error)
      if (error instanceof Error && error.message.includes("Authentication")) {
        showToast(error.message, "error")
      }
      return false
    }
  }

  const isMember = useMemo(() => {
    if (!guild || !currentUser) return false
    const guildMembership = userMemberships[guild.guild_id]
    return guildMembership || membershipVerified
  }, [guild, currentUser, userMemberships, membershipVerified])

  const isAdmin = useMemo(() => {
    if (!currentUser || !guild) return false
    const userId = Number(currentUser.id)
    return guild.admins?.includes(userId) || guild.poster?.id === userId
  }, [currentUser, guild])

  const totalMemberCount = useMemo(() => {
    const count = memberDetails.length
    const hasPoster = guild?.poster && !memberDetails.some((m) => m.id === String(guild.poster!.id))
    return count + (hasPoster ? 1 : 0)
  }, [memberDetails, guild?.poster])

  const canParticipateInChat = isAuthenticated && (isMember || isAdmin || membershipVerified)

  useEffect(() => {
    if (!isOpen || !currentUser || !guild?.guild_id || !token) return
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
    socketRef.current.close()
    }

    const socket = createWebSocketConnection(guild.guild_id, token)
    socketRef.current = socket

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("WebSocket message received:", data)
        if (data.type === "new_message") {
          const message: GuildChatMessage = {
            ...data.message,
            timestamp: data.message.timestamp || new Date().toISOString(),
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev
            return [...prev, message]
          })
        }
        if (data.type === "online_users") {
          // Set all users in the list as online
          setOnlineUsers(() => {
            const updated = new Map<string, "online" | "idle" | "offline">();
            if (Array.isArray(data.user_ids)) {
              data.user_ids.forEach((id: string) => {
                updated.set(String(id), "online");
              });
            }
            return updated;
          });
        }
        if (data.type === "presence_update") {
          console.log('[GuildChat Presence] user_id:', data.user_id, 'is_online:', data.is_online);
          setOnlineUsers(prev => {
            const updated = new Map(prev);
            updated.set(String(data.user_id), data.is_online ? "online" : "offline");
            return updated;
          });
        }
      } catch (error) {
        console.error("❌ Failed to parse WebSocket message:", error)
      }
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN) socket.close()
    }
  }, [isOpen, currentUser, guild, showToast])

  useEffect(() => {
    const fetchInitialMessages = async () => {
    if (!isOpen || !guild?.guild_id || !isAuthenticated || !token) return
    
    try {
    const data = await fetchWithErrorHandling(`/api/guilds/${guild.guild_id}/messages/`)
        if (Array.isArray(data)) {
          const formatted = data.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp || new Date().toISOString(),
          }))
          setMessages(formatted)
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
        showToast("Failed to load messages", "error")
      }
    }
    fetchInitialMessages()
  }, [isOpen, guild?.guild_id, isAuthenticated])

  useEffect(() => {
    if (!isOpen || !guild?.guild_id || !isAuthenticated || !token) return
    
    const fetchMembers = async () => {
    setIsLoadingMembers(true)
    try {
    const data = await fetchWithErrorHandling(`/api/guilds/${guild.guild_id}/members/`)
        let users: User[] = []
        if (Array.isArray(data)) {
          users = data.map((m: any) => m.user || m)
        } else if (data.results && Array.isArray(data.results)) {
          users = data.results.map((m: any) => m.user || m)
        } else if (data.users && Array.isArray(data.users)) {
          users = data.users
        }
        setMemberDetails(users)
      } catch (error) {
        console.error("Failed to load members:", error)
        showToast("Failed to load guild members", "error")
      } finally {
        setIsLoadingMembers(false)
      }
    }
    fetchMembers()
  }, [isOpen, guild?.guild_id, isAuthenticated])

  useEffect(() => {
    if (!currentUser || !guild?.guild_id || !isAuthenticated || !token) return
    
    // Skip verification if already confirmed as member
    if (userMemberships[guild.guild_id] === true) {
    setMembershipVerified(true)
    return
    }
    
    const verify = async () => {
    setMembershipLoading(true)
    try {
    const verified = await verifyMembershipWithErrorHandling(String(guild.guild_id), currentUser)
    setMembershipVerified(verified)
    } finally {
    setMembershipLoading(false)
    }
    }
    verify()
    }, [currentUser, guild, userMemberships, isAuthenticated, token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
  if (!newMessage.trim()) return
  
  if (!token) {
  showToast("Please log in to send messages", "error")
  return
  }
  
  if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
  showToast("Connection lost. Please refresh and try again.", "error")
  return
  }

    setIsSending(true)
    socketRef.current.send(
      JSON.stringify({
        type: "send_message",
        content: newMessage.trim(),
        sender_id: currentUser?.id,
        sender_name: currentUser?.username,
        sender_avatar: currentUser?.avatar_url || currentUser?.username?.[0] || "U",
      })
    )
    setNewMessage("")
    setTimeout(() => setIsSending(false), 300)
  }

  const handleEmojiClick = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.emoji)
    setShowEmojiPicker(false)
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diff = Math.floor((now.getTime() - dateObj.getTime()) / 60000)
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return dateObj.toLocaleDateString()
  }

  if (!isOpen || !currentUser || !guild) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2C1A1D] rounded-lg w-full max-w-5xl h-[80vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-[#4A3540] bg-[#251419] p-4 overflow-y-auto">
          <h3 className="text-white font-semibold text-lg mb-4">
            Members ({totalMemberCount})
          </h3>
          {isLoadingMembers ? (
            <p className="text-gray-400 text-sm">Loading members...</p>
          ) : (
            <>
              {/* Guild Creator */}
              {guild?.poster && (
                <div className="mb-6">
                  <div className="text-xs text-[#CDAA7D] font-bold uppercase mb-1">Guild Creator</div>
                  <div className="flex items-center gap-2 text-white">
                    <div className="relative w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center font-bold">
                      {guild.poster.avatar || guild.poster.username?.[0] || "?"}
                    </div>
                    <span className="text-sm font-semibold">{guild.poster.username ?? "Unknown"}</span>
                  </div>
                </div>
              )}
              {/* Members Header */}
              <div className="text-xs text-[#CDAA7D] font-bold uppercase mb-2">Members</div>
              <ul className="space-y-3">
                {memberDetails
                  .filter((user) => !guild?.poster || String(user.id) !== String(guild.poster.id))
                  .map((user) => {
                    const presence = onlineUsers.get(String(user.id)) || "offline";
                    let dotColor = "bg-gray-400";
                    let dotLabel = "Offline";
                    if (presence === "online") {
                      dotColor = "bg-green-500";
                      dotLabel = "Online";
                    } else if (presence === "idle") {
                      dotColor = "bg-yellow-400";
                      dotLabel = "Idle";
                    }
                    console.log('[GuildChat MemberList] user:', user, 'presence:', presence);
                    return (
                      <li
                        key={user.id}
                        className="flex items-center gap-2 text-white"
                      >
                        <div className="relative w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center font-bold">
                          {user.avatar && typeof user.avatar === "string" && user.avatar.startsWith("http") ? (
                            <img src={user.avatar} alt={user.username || "?"} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            user.username?.[0] || "?"
                          )}
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              presence === "online"
                                ? "bg-green-500"
                                : presence === "idle"
                                ? "bg-yellow-400"
                                : "bg-gray-400"
                            }`}
                            title={dotLabel}
                          ></span>
                        </div>
                        <span className="text-sm">{user.username ?? "Unknown"}</span>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#4A3540] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">{guild.name} Chat</h2>
              <p className="text-sm text-gray-400">Guild discussion</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isAuthenticated ? (
              <div className="text-center text-gray-400 py-8">
                <p>Please log in to view messages</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No messages yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser =
                  (message.senderId && String(message.senderId) === String(currentUser.id));
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse justify-end" : ""}`}
                  >
                    <div className="w-10 h-10 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {message.senderAvatar && typeof message.senderAvatar === "string" && message.senderAvatar.startsWith("http") ? (
                        <img src={message.senderAvatar} alt={message.senderName || "?"} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        message.senderAvatar
                      )}
                    </div>
                    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} flex-1`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{message.senderName}</span>
                        <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                      </div>
                      <p className={`px-4 py-2 rounded-2xl shadow-md inline-block max-w-xs break-words transition-colors duration-150
                        ${isCurrentUser
                          ? "bg-[#CDAA7D] text-[#2C1A1D] ml-auto border border-[#B8956D] hover:bg-[#e7d3b3]"
                          : "bg-[#F4F0E6] text-[#2C1A1D] mr-auto border border-[#E0D6C3] hover:bg-[#ede7db]"}
                      `}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isAuthenticated ? (
            <div className="p-4 border-t border-[#4A3540] text-center">
              <p className="text-gray-400">Please log in to participate in chat.</p>
            </div>
          ) : !canParticipateInChat ? (
            <div className="p-4 border-t border-[#4A3540] text-center">
              <p className="text-gray-400">
                {membershipLoading 
                  ? "Verifying membership..." 
                  : "You must be a member of this guild to participate in chat."
                }
              </p>
              <div className="mt-2 text-xs text-gray-500">
                Debug: authenticated={String(isAuthenticated)}, isMember={String(isMember)}, isAdmin={String(isAdmin)}, verified={String(membershipVerified)}
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-[#4A3540]">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Message #general"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="w-full bg-[#3D2A2F] border border-[#4A3540] rounded px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#8B75AA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <Smile size={20} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-14 right-0 z-10">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                    newMessage.trim()
                      ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                      : "bg-[#4A3540] text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}