"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import ConversationList from "./ConversationList"
import ChatWindow from "./ChatWindow"
import ConversationInfoPanel from "./ConversationInfoPanel"
import type { Conversation, Message, User, TypingUser, UserStatus } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { toast } from "@/components/ui/use-toast"

interface MessagingSystemProps {
  token: string
  currentUser: User
  showToast?: (message: string, type?: string) => void
  onlineUsers?: Map<string, UserStatus>
}

export default function MessagingSystem({ token, currentUser }: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineMap, setOnlineMap] = useState<Map<string, UserStatus>>(new Map())
  const [infoOpen, setInfoOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const renderAvatar = useCallback((user: User, size: "sm" | "md" | "lg" = "md") => (
    <img
      src={user.avatar || "/placeholder-user.jpg"}
      alt={user.username}
      className={`rounded-full object-cover ${size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10"}`}
    />
  ), [])

  const getOtherParticipant = useCallback(
    (conv: Conversation) => conv.is_group ? null : conv.participants.find(u => u.id !== currentUser.id) || null,
    [currentUser.id]
  )

  const getUserById = useCallback(
    (id: string) => conversations.flatMap(c => c.participants).find(u => u.id === id) || null,
    [conversations]
  )

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveId(conv.id)
    setInfoOpen(false)
  }, [])

  const handleWsMessage = useCallback(({ type, user_id, message, status, messages: initialMessages, ...rest }: any) => {
    if (type === "new_message") return setMessages(prev => [...prev, message]);
    if (type === "initial_messages") return setMessages(initialMessages || []);
    if (type === "user_online_status" && user_id && status)
      return setOnlineMap(prev => new Map(prev).set(user_id, status));

    if (type === "typing" && user_id !== currentUser.id) {
      const user = getUserById(user_id);
      if (!user) return;

      setTypingUsers(prev => {
        const exists = prev.some(t => t.user_id === user_id);
        return exists
          ? prev.map(t => t.user_id === user_id ? { ...t, timestamp: Date.now() } : t)
          : [...prev, { user_id, username: user.username, timestamp: Date.now() }];
      });

      setTimeout(() => {
        setTypingUsers(prev => prev.filter(t => t.user_id !== user_id));
      }, 3000);
    }

    if (type === "conversation_update") {
      const { conversation_id, last_message } = rest;
      setConversations(prev => {
        const updated = prev.map(conv =>
          conv.id === conversation_id ? { ...conv, updated_at: last_message.timestamp, last_message } : conv
        );
        return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      });
    }
  }, [currentUser.id, getUserById])

  const connectWebSocket = useCallback(() => {
    if (!activeId || wsStatus !== "disconnected") return

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${activeId}/?token=${token}`)
    setWsStatus("connecting")

    ws.onopen = () => {
      wsRef.current = ws
      setWsStatus("connected")
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }

    ws.onmessage = e => {
      try {
        handleWsMessage(JSON.parse(e.data))
      } catch (err) {
        console.error("WebSocket parse error", err)
      }
    }

    ws.onclose = () => {
      setWsStatus("disconnected")
      reconnectRef.current = setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = () => setWsStatus("disconnected")
  }, [activeId, token, handleWsMessage])

  const disconnectWebSocket = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current)
    wsRef.current?.close(1000)
    wsRef.current = null
    setWsStatus("disconnected")
  }, [])

  useEffect(() => {
    if (!activeId || !token) return
    disconnectWebSocket()
    connectWebSocket()
    return () => disconnectWebSocket()
  }, [activeId, token])

  const sendMessage = useCallback((payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(payload))
  }, [])

  const onTyping = () => {
    if (wsStatus === "connected") sendMessage({ type: "typing" })
  }

  const onSendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!activeId) return;
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("conversation_id", activeId);
      if (files && files.length > 0) {
        files.forEach((file) => formData.append("files", file));
      }

      const response = await axios.post("http://localhost:8000/api/messages/send/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const savedMessage = response.data;
      setMessages((prev) => [...prev, savedMessage]);
      sendMessage({ type: "new_message", message: savedMessage });
      setNewMessage("");
      setSelectedFiles([]);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Attachment upload failed.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [activeId, token, sendMessage])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)])
      e.target.value = ""
    }
  }

  const removeFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index))

  const activeConv = conversations.find(c => c.id === activeId) || null

  useEffect(() => {
    if (!showUserSearch || !userSearchQuery) return
    setIsSearchingUsers(true)
    fetch(`http://localhost:8000/api/users/search/?q=${userSearchQuery}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUserSearchResults(data))
      .catch(console.error)
      .finally(() => setIsSearchingUsers(false))
  }, [userSearchQuery, showUserSearch, token])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/conversations/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchConversations();
  }, [token])

  return (
    <motion.div className="flex h-[95vh] overflow-hidden bg-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ConversationList
        conversations={conversations}
        currentUserId={currentUser.id}
        selectedConversationId={activeId}
        onSelectConversation={handleSelectConversation}
        userMap={new Map<string, User>([
          [currentUser.id, currentUser],
          ...conversations.flatMap(c => c.participants.map(p => [p.id, p] as [string, User]))
        ])}
        onlineStatusMap={onlineMap}
        startConversation={async (user) => {
          const res = await fetch("http://localhost:8000/api/conversations/start/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ participant_id: user.id }),
          });

          if (!res.ok) return;
          const newConv: Conversation = await res.json();
          setConversations(prev => (prev.find(conv => conv.id === newConv.id) ? prev : [newConv, ...prev]));
          setActiveId(newConv.id);
        }}
        getOtherParticipant={getOtherParticipant}
        renderAvatar={renderAvatar}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showUserSearch={showUserSearch}
        setShowUserSearch={setShowUserSearch}
        userSearchQuery={userSearchQuery}
        setUserSearchQuery={setUserSearchQuery}
        userSearchResults={userSearchResults}
        isSearchingUsers={isSearchingUsers}
      />

      <div className="flex-1 flex flex-col min-h-0">
        {activeConv ? (
          <>
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
              onToggleInfo={() => setInfoOpen(v => !v)}
              onlineUsers={onlineMap}
              isSending={isSending}
              fileInputRef={fileInputRef}
              activeConversation={activeConv}
              conversations={conversations}
              getOtherParticipant={getOtherParticipant}
            />
            <AnimatePresence>
              {infoOpen && (
                <motion.div className="fixed inset-0 z-[9999] flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="absolute inset-0 bg-black/20" onClick={() => setInfoOpen(false)} />
                  <motion.div
                    className="relative w-[384px] h-full bg-white shadow-lg border-l border-gray-300 z-50"
                    initial={{ x: 384 }}
                    animate={{ x: 0 }}
                    exit={{ x: 384 }}
                    transition={{ type: "tween", duration: 0.3 }}
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
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            className="flex items-center justify-center h-full text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Select a conversation to start chatting.
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}