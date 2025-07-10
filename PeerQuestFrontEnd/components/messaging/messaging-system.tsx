"use client"

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"
import type {
  Conversation,
  Message,
  User,
  TypingUser,
  UserStatus,
  MessageStatus,
} from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import ConversationList from "./conversation-list"
import ChatWindow from "./chat-window"
import ConversationInfoPanel from "./conversation-info-panel"
import debounce from "lodash.debounce"

interface MessagingSystemProps {
  token: string
  currentUser: User
  showToast?: (
    msg: string,
    type?: "success" | "error" | "warning" | "info"
  ) => void
  onlineUsers?: Map<string, UserStatus>
}

export default function MessagingSystem({
  token,
  currentUser,
  showToast,
  onlineUsers = new Map(),
}: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("activeConversationId")
      : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<
    Pick<TypingUser, "user_id" | "username">[]
  >([])
  const [onlineMap, setOnlineMap] = useState<Map<string, UserStatus>>(
    onlineUsers
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [wsStatus, setWsStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected")
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingMessagesRef = useRef<Set<string>>(new Set())
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const API = useMemo(
    () =>
      axios.create({
        baseURL: "http://localhost:8000/api",
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token]
  )

  const mergeOrAppendMessage = useCallback(
    (prev: Message[], incoming: Message, tempId?: string): Message[] => {
      const updated = prev.map((m) =>
        tempId && m.id.startsWith("temp") && m.id === tempId
          ? { ...incoming, status: "sent" as MessageStatus }
          : m.id === incoming.id
          ? { ...m, ...incoming }
          : m
      )
      if (!updated.some((m) => m.id === incoming.id)) updated.push(incoming)
      return updated
    },
    []
  )

  const renderAvatar = useCallback(
    (user: User) => (
      <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold">
        {user.username[0]}
      </div>
    ),
    []
  )

  const getOtherParticipant = useCallback(
    (conv: Conversation) =>
      conv.participants.find((u) => u.id !== currentUser.id) || null,
    [currentUser.id]
  )

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      setActiveId(conv.id)
      setInfoOpen(false)
      if (
        conv.last_message &&
        !conv.last_message.read &&
        conv.last_message.sender.id !== currentUser.id
      ) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id
              ? { ...c, last_message: { ...c.last_message!, read: true } }
              : c
          )
        )
      }
    },
    [currentUser.id]
  )

  const handleConversationUpdate = useCallback((id: string, msg: Message) => {
    setConversations((prev) =>
      prev
        .map((c) =>
          c.id === id ? { ...c, last_message: msg, updated_at: msg.timestamp } : c
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
    )
  }, [])

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
    if (newMessage.trim()) debouncedTyping()
  }

  const onSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      try {
        const textOnly =
          content.trim().length > 0 && (!files || files.length === 0)

        // optimistic via WS
        if (
          wsRef.current?.readyState === WebSocket.OPEN &&
          textOnly &&
          activeId
        ) {
          const tempId = `temp-${Date.now()}-${Math.random()}`
          const msg: Message = {
            id: tempId,
            conversation_id: activeId,
            sender: currentUser,
            content,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            read: false,
            message_type: "text",
            attachments: [],
            status: "sending",
          }
          pendingMessagesRef.current.add(tempId)
          setMessages((prev) => [...prev, msg])
          wsRef.current.send(
            JSON.stringify({ type: "send_message", content, temp_id: tempId })
          )
          setNewMessage("")
          setSelectedFiles([])
          return
        }

        // fallback via REST
        if (files?.length || content.trim()) {
          setIsSending(true)
          const fd = new FormData()
          fd.append("content", content)
          fd.append("conversation_id", activeId!)
          files?.forEach((f) => fd.append("files", f))

          const { data } = await API.post<Message>(
            "/messages/send/",
            fd,
            { headers: { "Content-Type": "multipart/form-data" } }
          )
          setMessages((prev) => [...prev, data])
          handleConversationUpdate(activeId!, data)
          setNewMessage("")
          setSelectedFiles([])
        }
      } catch (err) {
        console.error("send error", err)
        showToast?.("⚠️ Failed to send message", "error")
      } finally {
        setIsSending(false)
      }
    },
    [API, activeId, currentUser, handleConversationUpdate, showToast]
  )

  const handleWsMessage = useCallback(
    (data: any) => {
      switch (data.type) {
        case "initial_messages":
          setMessages((prev) =>
            prev.length === 0
              ? (data.messages || []).map((m: Message) => ({
                  ...m,
                  status: (m.read ? "read" : "sent") as MessageStatus,
                }))
              : prev
          )
          setIsLoadingMessages(false)
          return

        case "new_message":
          if (data.temp_id) {
            setMessages((prev) =>
              mergeOrAppendMessage(prev, data.message, data.temp_id)
            )
            pendingMessagesRef.current.delete(data.temp_id)
          } else if (data.conversation_id === activeId) {
            setMessages((prev) =>
              prev.some((m) => m.id === data.message.id)
                ? prev
                : [...prev, data.message]
            )
          }
          handleConversationUpdate(data.conversation_id, data.message)
          return

        case "message_status":
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.message_id && m.sender.id === currentUser.id
                ? { ...m, status: data.status as MessageStatus }
                : m
            )
          )
          return

        case "typing":
          setTypingUsers((prev) =>
            prev.some((u) => u.user_id === data.user_id)
              ? prev
              : [...prev, { user_id: data.user_id, username: data.username }]
          )
          setTimeout(
            () =>
              setTypingUsers((prev) =>
                prev.filter((u) => u.user_id !== data.user_id)
              ),
            3000
          )
          return

        case "message_read_update":
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.message_id && m.sender.id === currentUser.id
                ? { ...m, status: "read" as MessageStatus }
                : m
            )
          )
          return

        case "presence_update":
          if (data.user_id !== currentUser.id) {
            setOnlineMap((prev) =>
              new Map(prev).set(
                data.user_id,
                data.is_online ? "online" : "offline"
              )
            )
          }
          return
      }
    },
    [activeId, currentUser.id, handleConversationUpdate, mergeOrAppendMessage]
  )

  // load latest messages whenever activeId changes
  useEffect(() => {
    if (!activeId) return
    setIsLoadingMessages(true)
    setMessages([])

    API.get<Message[]>(`/conversations/${activeId}/messages/`)
      .then((res) => {
        setMessages((existing) => {
          const temp = existing.filter((m) =>
            m.id.startsWith("temp") && pendingMessagesRef.current.has(m.id)
          )
          const real = res.data.map((m) => ({
            ...m,
            status: (m.read ? "read" : "sent") as MessageStatus,
          }))
          return [...real, ...temp].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() -
              new Date(b.timestamp).getTime()
          )
        })
      })
      .catch(() => showToast?.("⚠️ Failed to fetch messages", "error"))
      .finally(() => setIsLoadingMessages(false))
  }, [activeId, API, showToast])

  // WebSocket lifecycle
  useEffect(() => {
    if (!mounted || !activeId) return
    setWsStatus("connecting")
    const ws = new WebSocket(
      `ws://localhost:8000/ws/chat/${activeId}/?token=${token}`
    )
    wsRef.current = ws
    ws.onopen = () => setWsStatus("connected")
    ws.onmessage = (e) => handleWsMessage(JSON.parse(e.data))
    ws.onclose = () => setWsStatus("disconnected")
    ws.onerror = () => setWsStatus("disconnected")
    return () => ws.close()
  }, [activeId, handleWsMessage, mounted, token])

  // initial mount
  useEffect(() => {
    setMounted(true)
    return () => wsRef.current?.close()
  }, [])

  // load conversation list once mounted
  useEffect(() => {
    if (!mounted) return
    API.get<Conversation[]>("/conversations/")
      .then((res) => setConversations(res.data))
      .catch(() => showToast?.("⚠️ Failed to load conversations", "error"))
  }, [API, mounted, showToast])

  // sync external onlineUsers updates
  useEffect(() => {
    setOnlineMap(new Map(onlineUsers))
  }, [onlineUsers])

  const userMap = useMemo(() => {
    const m = new Map([[currentUser.id, currentUser]])
    conversations.forEach((c) =>
      c.participants.forEach((u) => m.set(u.id, u))
    )
    return m
  }, [conversations, currentUser.id])

  const unreadConversations = useMemo(
    () =>
      new Set(
        conversations
          .filter(
            (c) =>
              c.last_message &&
              !c.last_message.read &&
              c.last_message.sender.id !== currentUser.id
          )
          .map((c) => c.id)
      ),
    [conversations, currentUser.id]
  )

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [activeId, conversations]
  )

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-[300px] flex flex-col border-r border-slate-200">
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
            const res = await API.post<Conversation>(
              "/conversations/start/",
              { participant_id: u.id }
            )
            setConversations((prev) =>
              prev.find((x) => x.id === res.data.id)
                ? prev
                : [res.data, ...prev]
            )
            setActiveId(res.data.id)
          }}
          getOtherParticipant={getOtherParticipant}
          renderAvatar={renderAvatar}
          unreadConversations={unreadConversations}
          markConversationAsRead={(id) =>
            setConversations((prev) =>
              prev.map((c) =>
                c.id === id && c.last_message
                  ? { ...c, last_message: { ...c.last_message, read: true } }
                  : c
              )
            )
          }
        />
      </div>

      {/* Main chat */}
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
            handleFileSelect={(e) => {
              const fs = e.target.files
              if (fs) setSelectedFiles((prev) => [...prev, ...Array.from(fs)])
              e.target.value = ""
            }}
            removeFile={(i) =>
              setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))
            }
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
          <div className="flex-1 flex items-center justify-center p-8">
            <p>Select a conversation to start chatting!</p>
          </div>
        )}
      </div>

      {/* Info panel */}
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
