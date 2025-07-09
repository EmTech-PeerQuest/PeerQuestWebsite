"use client"

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"
import type { Conversation, Message, User, TypingUser, UserStatus } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import ConversationList from "./conversation-list"
import ChatWindow from "./chat-window"
import ConversationInfoPanel from "./conversation-info-panel"
import debounce from "lodash.debounce"

interface MessagingSystemProps {
  token: string
  currentUser: User
  showToast?: (msg: string, type?: "success" | "error" | "warning" | "info") => void
  onlineUsers?: Map<string, UserStatus>
}

export default function MessagingSystem({
  token,
  currentUser,
  showToast,
  onlineUsers = new Map(),
}: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeConversationId")
    }
    return null
  })

  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<Pick<TypingUser, "user_id" | "username">[]>([])
  const [onlineMap, setOnlineMap] = useState<Map<string, UserStatus>>(onlineUsers)
  const [infoOpen, setInfoOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [mounted, setMounted] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const isUnmountedRef = useRef(false)
  const pendingMessagesRef = useRef<Set<string>>(new Set()) // Track pending optimistic messages
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  
  const API = useMemo(() => {
    return axios.create({
      baseURL: "http://localhost:8000/api",
      headers: { Authorization: `Bearer ${token}` },
    })
  }, [token])

  useEffect(() => {
    if (activeId) {
      localStorage.setItem("activeConversationId", activeId)
    }
  }, [activeId])


  useEffect(() => {
    setMounted(true)
    return () => {
      isUnmountedRef.current = true
      wsRef.current?.close()
    }
  }, [])

  const markConversationAsRead = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id && conv.last_message
          ? { ...conv, last_message: { ...conv.last_message, read: true } }
          : conv
      )
    )
  }, [])

  const handleConversationUpdate = useCallback((conversationId: string, lastMessage: Message) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === conversationId ? { ...c, last_message: lastMessage, updated_at: lastMessage.timestamp } : c
      )
      return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    })
  }, [])

  const renderAvatar = useCallback((user: User) => {
    return <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold">{user.username[0]}</div>
  }, [])

  const getOtherParticipant = useCallback((conv: Conversation) => {
    return conv.participants.find((u) => u.id !== currentUser.id) || null
  }, [currentUser.id])

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveId(conv.id)
    setInfoOpen(false)

    if (
      conv.last_message &&
      !conv.last_message.read &&
      conv.last_message.sender.id !== currentUser.id
    ) {
      markConversationAsRead(conv.id)
    }
  }, [markConversationAsRead, currentUser.id])

  const onSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      const isTextOnly = content.trim().length > 0 && (!files || files.length === 0)

      if (wsRef.current?.readyState === WebSocket.OPEN && isTextOnly && activeId) {
        const tempId = `temp-${Date.now()}-${Math.random()}`
        const optimisticMessage: Message = {
          id: tempId,
          conversation_id: activeId,
          sender: currentUser,
          content,
          timestamp: new Date().toISOString(),
          message_type: "text",
          attachments: [],
          created_at: new Date().toISOString(),
          read: false,
          status: "sending", // optional, if your Message type includes this as a union type
        }

        // Track this as a pending message
        pendingMessagesRef.current.add(tempId)

        // Optimistically append message
        setMessages((prev) => [...prev, optimisticMessage])

        // Send via WebSocket
        wsRef.current.send(JSON.stringify({ type: "send_message", content, temp_id: tempId }))

        return
      }

      if (files?.length || content.trim()) {
        setIsSending(true)
        try {
          const fd = new FormData()
          fd.append("content", content)
          fd.append("conversation_id", activeId!)
          files?.forEach((f) => fd.append("files", f))

          const { data } = await API.post<Message>("/messages/send/", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          })

          setMessages((m) => [...m, data])
          handleConversationUpdate(activeId!, data)
        } catch {
          showToast?.("⚠️ Failed to send message", "error")
        } finally {
          setIsSending(false)
        }
      }
    },
    [activeId, API, showToast, handleConversationUpdate, currentUser]
  )

  const handleWsMessage = useCallback(
    (data: any) => {
      console.log("[handleWsMessage] Type:", data.type, data)

      switch (data.type) {
        case "initial_messages":
          console.log("[WS] Initial messages:", data.messages)
          setMessages(data.messages || [])
          setIsLoadingMessages(false)
          return

        case "new_message":
          console.log("[WS] Handling new_message", data.message)
          if (data.temp_id && pendingMessagesRef.current.has(data.temp_id)) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.temp_id
                  ? { ...data.message, status: "sent" }
                  : msg
              )
            )
            pendingMessagesRef.current.delete(data.temp_id)
          } else {
            setMessages((prev) => {
              const idx = prev.findIndex((msg) => msg.id === data.message.id)
              if (idx !== -1) {
                const updated = [...prev]
                updated[idx] = { ...updated[idx], ...data.message }
                return updated
              }
              return [...prev, data.message]
            })
          }

          // ✅ Check and insert into message list if active conversation
          if (data.conversation_id === activeId) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === data.message.id)
              if (!exists) {
                console.log("[WS] Appending new message to active chat")
                return [...prev, data.message]
              }
              return prev
            })
          }
          return


        case "conversation_update":
          handleConversationUpdate(data.conversation_id, data.last_message)

          // ✅ Only update messages if this is the active conversation
          if (data.conversation_id === activeId) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === data.last_message.id)
              if (exists) return prev
              return [...prev, data.last_message]
            })
          }
          return



        case "presence_update":
          if (data.user_id !== currentUser.id) {
            setOnlineMap((prev) =>
              new Map(prev).set(data.user_id, data.is_online ? "online" : "offline")
            )
          }
          return

        case "typing":
          setTypingUsers((prev) => {
            if (prev.some((u) => u.user_id === data.user_id)) return prev
            return [...prev, { user_id: data.user_id, username: data.username }]
          })
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id))
          }, 3000)
          return

        // ✅ NEW: update status to "read"
        case "message_read_update":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.message_id && msg.sender.id === currentUser.id
                ? { ...msg, status: "read" }
                : msg
            )
          )
          return
      }
    },
    [currentUser.id, handleConversationUpdate]
  )


  useEffect(() => {
    if (!activeId) return;

    // 🔄 Reset state
    setMessages([]);
    setIsLoadingMessages(true);

    // ✅ Fallback: fetch messages manually via REST
    API.get<Message[]>(`/conversations/${activeId}/messages/`)
      .then((res) => {
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]))
          res.data.forEach((m) => map.set(m.id, m))
          return Array.from(map.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        })
      })





    const proto = window.location.protocol === "https:" ? "wss" : "ws"
    const ws = new WebSocket(`${proto}://localhost:8000/ws/chat/${activeId}/?token=${token}`)
    setWsStatus("connecting")

    ws.onopen = () => setWsStatus("connected")
    ws.onmessage = (e) => {
      try {
        handleWsMessage(JSON.parse(e.data))
      } catch {
        console.error("WS parse error")
      }
    }
    ws.onerror = (event) => {
    console.warn("WebSocket encountered an error", event);
    // No throw, just a safe log
  };

    ws.onclose = () => {
      setWsStatus("disconnected")
      // Clean up any pending messages on disconnect
      pendingMessagesRef.current.clear()
      if (!isUnmountedRef.current) {
        setTimeout(() => {
          wsRef.current = new WebSocket(ws.url)
        }, 3000)
      }
    }

    wsRef.current = ws
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [activeId, token, handleWsMessage])

  const debouncedTyping = useMemo(
    () =>
      debounce(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "typing" }))
        }
      }, 500),
    []
  )
  const onTyping = () => {
    if (newMessage.trim().length > 0) {
      debouncedTyping()
    }
  }


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = e.target.files
    if (fs) {
      setSelectedFiles((s) => [...s, ...Array.from(fs)])
      e.target.value = ""
    }
  }
  const removeFile = (i: number) => setSelectedFiles((s) => s.filter((_, idx) => idx !== i))

  useEffect(() => {
    if (!mounted) return
    API.get<Conversation[]>("/conversations/")
      .then((res) => setConversations(res.data))
      .catch(() => showToast?.("⚠️ Failed to load conversations", "error"))
  }, [mounted, API, showToast])

  useEffect(() => {
    if (conversations.length === 0) return

    const isValid = conversations.some((c) => c.id === activeId)

    if (!isValid) {
      handleSelectConversation(conversations[0])
    }
  }, [conversations, activeId, handleSelectConversation])



  useEffect(() => {
    if (!showUserSearch || userSearchQuery.length < 2) return
    setIsSearchingUsers(true)
    API.get<User[]>(`/users/search/?q=${encodeURIComponent(userSearchQuery)}`)
      .then((res) => setUserSearchResults(res.data))
      .finally(() => setIsSearchingUsers(false))
  }, [showUserSearch, userSearchQuery, API])

  const userMap = useMemo(() => {
    const m = new Map<string, User>([[currentUser.id, currentUser]])
    conversations.forEach((c) => c.participants.forEach((u) => m.set(u.id, u)))
    return m
  }, [conversations, currentUser])

  const activeConv = useMemo(() => conversations.find((c) => c.id === activeId) || null, [
    conversations,
    activeId,
  ])

  const unreadConversations = useMemo(() => {
    return new Set(
      conversations
        .filter(
          (conv) =>
            conv.last_message &&
            !conv.last_message.read &&
            conv.last_message.sender.id !== currentUser.id
        )
        .map((conv) => conv.id)
    )
  }, [conversations, currentUser.id])




    return (
  <div className="flex h-full w-full overflow-hidden">
    {/* Left: Conversation List */}
    <div className="w-[300px] flex flex-col border-r border-slate-200">
      <div className="sticky top-0 z-10 bg-white p-4 font-semibold text-slate-600 border-b border-slate-100">
        Messages
      </div>
      <div className="flex flex-col w-full h-full overflow-hidden">
        <ConversationList
          conversations={conversations}
          currentUserId={currentUser.id}
          selectedConversationId={activeId}
          onSelectConversation={handleSelectConversation}
          userMap={userMap}
          onlineStatusMap={onlineMap}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showUserSearch={showUserSearch}
          setShowUserSearch={setShowUserSearch}
          userSearchQuery={userSearchQuery}
          setUserSearchQuery={setUserSearchQuery}
          userSearchResults={userSearchResults}
          isSearchingUsers={isSearchingUsers}
          startConversation={async (u) => {
            const res = await API.post<Conversation>("/conversations/start/", { participant_id: u.id })
            setConversations((c) => (c.find((x) => x.id === res.data.id) ? c : [res.data, ...c]))
            setActiveId(res.data.id)
          }}
          getOtherParticipant={getOtherParticipant}
          renderAvatar={renderAvatar}
          unreadConversations={unreadConversations}
          markConversationAsRead={markConversationAsRead}
        />
      </div>
    </div>

      {/* Middle: Chat Window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConv ? (
          <ChatWindow
            messages={messages}
            currentUser={currentUser}
            onSendMessage={onSendMessage}
            onTyping={onTyping}
            typingUsers={typingUsers}
            wsConnected={wsStatus === "connected"}
            wsError={wsStatus === "disconnected" ? "Disconnected" : undefined}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            renderAvatar={renderAvatar}
            handleFileSelect={handleFileSelect}
            removeFile={removeFile}
            selectedFiles={selectedFiles}
            onToggleInfo={() => setInfoOpen((v) => !v)}
            onlineUsers={onlineMap}
            isSending={isSending}
            fileInputRef={fileInputRef}
            activeConversation={activeConv}
            conversations={conversations}
            getOtherParticipant={getOtherParticipant}
            isLoading={isLoadingMessages}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <p>Select a conversation to start chatting!</p>
          </div>
        )}
      </div>

      {/* Right: Info Panel */}
      <AnimatePresence>
        {infoOpen && activeConv && (
          <>
            <motion.div
              className="absolute inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoOpen(false)}
            />

            <motion.div
              className="absolute top-0 right-0 bottom-0 w-full sm:w-[400px] md:w-[450px] z-50 border-l border-gray-200 shadow-xl overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ConversationInfoPanel
                conversation={activeConv}
                participants={activeConv.participants}
                onlineUsers={onlineMap}
                renderAvatar={renderAvatar}
                onClose={() => setInfoOpen(false)}
                currentUser={currentUser}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}