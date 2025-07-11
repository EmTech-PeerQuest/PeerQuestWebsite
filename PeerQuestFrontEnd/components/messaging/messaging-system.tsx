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
  // API error state for debug display
  const [apiError, setApiError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const id = localStorage.getItem("activeConversationId")
      return id && id !== "undefined" ? id : null
    }
    return null
  })
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
  // No longer inject file names into the input value. Instead, display file names separately in the input area UI.
  // Provide a function to get a truncated file name display for the UI (not for the input value).
  const getAttachedFileNamesDisplay = useCallback(() => {
    if (!selectedFiles || selectedFiles.length === 0) return null;
    const maxLen = 30;
    const names = selectedFiles.map(f => f.name.length > maxLen ? f.name.slice(0, maxLen) + '…' : f.name);
    let display = names.join(', ');
    if (display.length > 50) display = display.slice(0, 47) + '…';
    return display;
  }, [selectedFiles]);
  const [isSending, setIsSending] = useState(false)
  const [wsStatus, setWsStatus] = useState<
    "disconnected" | "connecting" | "connected" | "reconnecting"
  >("disconnected")
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const reconnectingRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  const API = useMemo(
    () =>
      axios.create({
        baseURL: "http://localhost:8000/api",
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token]
  )

  // --- USER SEARCH FUNCTIONALITY ---
  useEffect(() => {
    if (!showUserSearch) {
      setUserSearchResults([])
      return
    }
    let cancelled = false
    const fetchUsers = async () => {
      setIsSearchingUsers(true)
      try {
        let res;
        // Always fetch all users, then filter client-side if search query is present
        try {
          res = await API.get(`/users/`);
          let users = Array.isArray(res.data.users) ? res.data.users : res.data;
          if (!Array.isArray(users)) users = [];
          if (userSearchQuery.trim()) {
            const q = userSearchQuery.trim().toLowerCase();
            users = users.filter((u: any) =>
              (u.username && u.username.toLowerCase().includes(q)) ||
              (u.email && u.email.toLowerCase().includes(q))
            );
          }
          setUserSearchResults(users);
          return;
        } catch (err: any) {
          if (err?.response?.status !== 404) throw err;
        }
        try {
          res = await API.get(`/api/users`);
          let users = Array.isArray(res.data.users) ? res.data.users : res.data;
          if (!Array.isArray(users)) users = [];
          if (userSearchQuery.trim()) {
            const q = userSearchQuery.trim().toLowerCase();
            users = users.filter((u: any) =>
              (u.username && u.username.toLowerCase().includes(q)) ||
              (u.email && u.email.toLowerCase().includes(q))
            );
          }
          setUserSearchResults(users);
          return;
        } catch (err) {
          // ignore
        }
        setUserSearchResults([]);
      } catch (err) {
        setUserSearchResults([]);
      } finally {
        if (!cancelled) setIsSearchingUsers(false);
      }
    };
    fetchUsers();
    return () => { cancelled = true };
  }, [userSearchQuery, showUserSearch, API]);

  // Ensure fileInputRef is stable and not recreated on every render
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingMessagesRef = useRef<Set<string>>(new Set())
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

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

  // Render avatar with online status indicator
  const renderAvatar = useCallback(
    (user: User, size?: "sm" | "md" | "lg") => {
      // Use only onlineMap for online status; never pass isOnline as a prop
      const status = onlineMap.get(user.id) || "offline";
      let sizeClass = "w-8 h-8";
      if (size === "sm") sizeClass = "w-6 h-6";
      if (size === "lg") sizeClass = "w-12 h-12";
      // Dot color and label by status
      let dotColor = "bg-gray-300";
      let dotLabel = "Offline";
      if (status === "online") {
        dotColor = "bg-green-500";
        dotLabel = "Online";
      } else if (status === "idle") {
        dotColor = "bg-amber-400";
        dotLabel = "Idle";
      }
      // Always show Online if status is online, never show Offline if user is online
      // Fix: If status is online, always show Online label
      const showLabel = status === "online" ? "Online" : dotLabel;
      return (
        <div className={`relative ${sizeClass}`}>
          <div className={`${sizeClass} rounded-full bg-gray-400 text-white flex items-center justify-center font-bold`}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.username || "?"} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.username ? user.username[0] : "?"
            )}
          </div>
          {/* Online status dot (no label here, just dot) */}
          <span
            className={`absolute bottom-0 right-0 ${size === "lg" ? "w-4 h-4" : size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} rounded-full border-2 border-white ${dotColor}`}
            title={showLabel}
          />
        </div>
      );
    },
    [onlineMap]
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
        const textOnly = content.trim().length > 0 && (!files || files.length === 0);
        let sentViaWS = false;

        // If only text and WebSocket is open, send via WS
        if (textOnly && activeId && wsRef.current?.readyState === WebSocket.OPEN) {
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const msg: Message = {
            id: tempId,
            conversation_id: activeId,
            sender: { ...currentUser, username: currentUser.username || "Unknown" },
            content,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            read: false,
            message_type: "text",
            attachments: [],
            status: "sending",
          };
          pendingMessagesRef.current.add(tempId);
          setMessages((prev) => [...prev, msg]);
          wsRef.current.send(
            JSON.stringify({ type: "send_message", content, temp_id: tempId })
          );
          sentViaWS = true;
        }

        // Always send via REST if not sent via WS, or if files are attached
        if (((!sentViaWS && textOnly) || (files?.length || content.trim())) && activeId) {
          setIsSending(true);
          const fd = new FormData();
          fd.append("content", content);
          fd.append("conversation_id", activeId);
          // Attach each file as its own field (backend expects 'files' as array)
          if (files && files.length > 0) {
            files.forEach((f) => fd.append("files", f));
          }

          const { data } = await API.post(
            "/messages/send/",
            fd,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          setNewMessage("");
          setSelectedFiles([]);

          // If WebSocket is not connected, fetch latest messages
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            try {
              const res = await API.get<Message[]>(`/conversations/${activeId}/messages/`);
              setMessages((existing) => {
                const temp = existing.filter((m) =>
                  m.id.startsWith("temp") && pendingMessagesRef.current.has(m.id)
                );
                const real = res.data.map((m) => ({
                  ...m,
                  status: (m.read ? "read" : "sent") as MessageStatus,
                }));
                return [...real, ...temp].sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                );
              });
            } catch (e) {
              // ignore
            }
          } else {
            // If WebSocket is connected, only update conversation list for last message
            handleConversationUpdate(activeId, data);
            // Do NOT add the REST response to messages; let the WebSocket event handle it
          }
        }
      } catch (err) {
        console.error("send error", err);
        showToast?.("⚠️ Failed to send message", "error");
      } finally {
        setIsSending(false);
      }
    },
    [API, activeId, currentUser, handleConversationUpdate, showToast]
  )

  // Memoize handleWsMessage with stable reference
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

        case "new_message": {
          setMessages((prev) => {
            // If temp_id is present, use mergeOrAppendMessage
            if (data.temp_id) {
              pendingMessagesRef.current.delete(data.temp_id)
              return mergeOrAppendMessage(prev, data.message, data.temp_id)
            }
            // If the message is from the current user, remove ALL temp messages for self in this conversation
            if (data.message.sender.id === currentUser.id) {
              const filtered = prev.filter(
                (m) =>
                  !(
                    m.id.startsWith("temp") &&
                    m.sender.id === currentUser.id &&
                    m.conversation_id === data.message.conversation_id
                  )
              )
              // Only add if not already present
              if (filtered.some((m) => m.id === data.message.id)) return filtered
              return [...filtered, { ...data.message, status: "sent" as MessageStatus }]
            }
            // If no temp_id and not from current user, try to match by content, sender, and status 'sending'
            const idx = prev.findIndex(
              (m) =>
                m.id.startsWith("temp") &&
                m.content === data.message.content &&
                m.sender.id === data.message.sender.id &&
                m.status === "sending"
            )
            if (idx !== -1) {
              // Replace temp message with real one
              const updated = [...prev]
              updated[idx] = { ...data.message, status: "sent" as MessageStatus }
              return updated
            }
            // Otherwise, only add if not already present
            if (prev.some((m) => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
          handleConversationUpdate(data.conversation_id, data.message)
          return
        }

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
    // Only depend on stable references, not objects/functions that change on every render
    [currentUser.id, mergeOrAppendMessage, handleConversationUpdate]
  )

  // --- Stable ref for handleWsMessage to avoid effect restarts ---
  const handleWsMessageRef = useRef(handleWsMessage)
  useEffect(() => {
    handleWsMessageRef.current = handleWsMessage
  }, [handleWsMessage])

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

  // WebSocket lifecycle with improved reconnect UI
  useEffect(() => {
    if (!mounted || !activeId) return
    let shouldReconnect = true
    let reconnectTimeout: NodeJS.Timeout | null = null

    // Memoize wsUrl so effect only runs when necessary
    const wsUrl = `ws://localhost:8000/ws/chat/${activeId}/?token=${token}`

    // Only create the connect function once per effect run
    function connect() {
      setWsStatus(reconnectAttempt > 0 ? "reconnecting" : "connecting")
      // If a socket is already open, close it before opening a new one
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => {
        setWsStatus("connected")
        setReconnectAttempt(0)
        reconnectingRef.current = false
      }
      ws.onmessage = (e) => {
        try {
          if (handleWsMessageRef.current) {
            handleWsMessageRef.current(JSON.parse(e.data))
          }
        } catch (err) {
          // Defensive: log and do not close socket on handler error
          console.error("WebSocket message handler error", err)
        }
      }
      ws.onclose = (event) => {
        console.warn("WebSocket closed", event)
        setWsStatus("disconnected")
        if (shouldReconnect) {
          reconnectingRef.current = true
          setReconnectAttempt((prev) => prev + 1)
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 10000)
          reconnectTimeout = setTimeout(connect, delay)
        }
      }
      ws.onerror = (event) => {
        console.error("WebSocket error", event)
        setWsStatus("disconnected")
        // Do not call ws.close() here; let onclose handle reconnection
      }
    }
    connect()
    return () => {
      shouldReconnect = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    }
    // Only rerun if wsUrl, mounted, or reconnectAttempt changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, token, mounted, reconnectAttempt])

  // Manual reconnect handler
  const handleManualReconnect = useCallback(() => {
    setReconnectAttempt(0)
    setWsStatus("connecting")
  }, [])

  // initial mount
  useEffect(() => {
    setMounted(true)
    return () => wsRef.current?.close()
  }, [])

  // load conversation list once mounted
  useEffect(() => {
    if (!mounted) return
    API.get<Conversation[]>("/conversations/")
      .then((res) => {
        setConversations(res.data)
        setApiError(null)
      })
      .catch((err) => {
        setApiError(
          err?.response?.data?.detail || err?.message || "Unknown API error"
        )
        showToast?.("⚠️ Failed to load conversations", "error")
      })
  }, [API, mounted, showToast])

  // sync external onlineUsers updates
  useEffect(() => {
    setOnlineMap(new Map(onlineUsers))
  }, [onlineUsers])

  const userMap = useMemo(() => {
    const m = new Map<string, User>([[currentUser.id, currentUser]])
    conversations.forEach((c) =>
      c.participants.forEach((u) => m.set(u.id, u))
    )
    return m
  }, [conversations, currentUser])

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
        {/* API error display for debug */}
        {apiError && (
          <div className="bg-red-100 text-red-700 p-2 text-xs border-t border-red-300">
            <b>API Error:</b> {apiError}
          </div>
        )}
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConv ? (
          <>
            {(wsStatus === "disconnected" || wsStatus === "reconnecting") && (
              <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-xs border-b border-yellow-300">
                {wsStatus === "reconnecting"
                  ? `Connection lost. Trying to reconnect... (Attempt ${reconnectAttempt})`
                  : "Disconnected from tavern. "}
                <button
                  className="ml-2 px-2 py-1 bg-yellow-200 rounded text-xs border border-yellow-400 hover:bg-yellow-300"
                  onClick={handleManualReconnect}
                  disabled={wsStatus === "reconnecting"}
                >
                  Reconnect
                </button>
              </div>
            )}
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
                const fs = e.target.files;
                e.target.value = "";
                if (fs && fs.length > 0) {
                  setSelectedFiles(Array.from(fs));
                }
              }}
              removeFile={(i) =>
                setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))
              }
              selectedFiles={selectedFiles}
              // getAttachedFileNamesDisplay is not needed in ChatWindow, remove this prop
              onToggleInfo={() => setInfoOpen((v) => !v)}
              onlineUsers={onlineMap}
              isSending={isSending}
              fileInputRef={fileInputRef}
              activeConversation={activeConv}
              conversations={conversations}
              getOtherParticipant={getOtherParticipant}
              isLoading={isLoadingMessages}
            />
          </>
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
