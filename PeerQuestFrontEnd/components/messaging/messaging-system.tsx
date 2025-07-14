"use client"

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"
import Avatar from "@/components/ui/avatar";
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
import TypingIndicator from "./typing-indicator"

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
  // Track currently typing users (for typing indicator)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  // Hybrid: local presence map for conversation, fallback to global
  const [onlineMap, setOnlineMap] = useState<Map<string, UserStatus>>(onlineUsers);
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

  const userMap = useMemo(() => {
  const m = new Map<string, User>([[currentUser.id, currentUser]])
  conversations.forEach((c) =>
    c.participants.forEach((u) => m.set(u.id, u))
  )
  return m
}, [conversations, currentUser])

  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const attachments = useMemo(() => {
    return messages
      .flatMap((m) => m.attachments || [])
      .filter((a) => a && a.filename && (a.file_url || a.url))
      .map((a) => ({
        ...a,
        file_url: a.file_url ?? a.url ?? "", // ✅ Ensure it's a string
      }));
  }, [messages]);


  useEffect(() => {
    return () => {
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, []);


  const API = useMemo(
    () => {
      // Use env var for API base, fallback to relative if not set
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][MessagingSystem] NEXT_PUBLIC_API_BASE_URL:', apiBase);
      }
      const baseURL = `${apiBase.replace(/\/$/, '')}/api`;
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][MessagingSystem] Axios baseURL:', baseURL);
      }
      return axios.create({
        baseURL,
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    [token]
  );

  // --- USER SEARCH FUNCTIONALITY ---
  useEffect(() => {
    if (!showUserSearch) {
      setUserSearchResults([])
      return
    }
    let cancelled = false;
    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        // Use the correct backend endpoint for user search
        const url = userSearchQuery.trim()
          ? `/users/search/?q=${encodeURIComponent(userSearchQuery.trim())}`
          : "/users/search/";
        const res = await API.get(url);
        let users = Array.isArray(res.data.results)
          ? res.data.results
          : Array.isArray(res.data.users)
          ? res.data.users
          : Array.isArray(res.data)
          ? res.data
          : [];
        // Filter out current user
        users = users.filter((u: any) => u.id !== currentUser.id);
        setUserSearchResults(users);
      } catch (err) {
        setUserSearchResults([]);
      } finally {
        if (!cancelled) setIsSearchingUsers(false);
      }
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [userSearchQuery, showUserSearch, API]);


  // Ensure fileInputRef is stable and not recreated on every render
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingMessagesRef = useRef<Set<string>>(new Set())
  const messageIdSet = useRef<Set<string>>(new Set());
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const hasReceivedInitialMessages = useRef(false);
  const [infoSearchQuery, setInfoSearchQuery] = useState("");


  const mergeOrAppendMessage = useCallback(
    (prev: Message[], incoming: Message, tempId?: string): Message[] => {
      // Attempt to find the matching temp message
      const updated = prev.map((m) => {
        const isMatchingFileMessage =
          m.id.startsWith("temp") &&
          m.sender.id === incoming.sender.id &&
          m.message_type === "file" &&
          incoming.message_type === "file" &&
          m.attachments?.length === incoming.attachments?.length &&
          m.attachments?.every((a, idx) => {
            const incomingA = incoming.attachments?.[idx];
            return (
              incomingA &&
              a.filename === incomingA.filename &&
              a.content_type === incomingA.content_type
            );
          });

        if (tempId && m.id === tempId) {
          return { ...incoming, status: "sent" as MessageStatus };
        }

        if (isMatchingFileMessage) {
          return { ...incoming, status: "sent" as MessageStatus };
        }

        if (m.id === incoming.id) {
          return {
            ...m,
            ...incoming,
            status: incoming.status ?? m.status, // 🔥 only upgrade if status is present
          };
        }


        return m;
      });

      // If it's already included, skip
      if (updated.some((m) => m.id === incoming.id)) return updated;

      return [...updated, { ...incoming, status: incoming.status ?? "sent" }].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    },
    []
  );




  // Render avatar with online status indicator
  const renderAvatar = useCallback(
    (user: User, size?: "sm" | "md" | "lg") => {
      const status = onlineMap.get(user.id) || onlineUsers.get(user.id) || "offline";
      let dotColor = "bg-gray-300";
      let dotLabel = "Offline";
      if (status === "online") {
        dotColor = "bg-green-500";
        dotLabel = "Online";
      } else if (status === "idle") {
        dotColor = "bg-amber-400";
        dotLabel = "Idle";
      }
      const showLabel = status === "online" ? "Online" : dotLabel;
      return (
        <div className="relative">
          <Avatar user={user} size={size || "md"} />
          <span
            className={`absolute bottom-0 right-0 ${size === "lg" ? "w-4 h-4" : size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} rounded-full border-2 border-white ${dotColor}`}
            title={showLabel}
          />
        </div>
      );
    },
    [onlineMap, onlineUsers]
  )

  const getOtherParticipant = useCallback(
    (conv: Conversation) =>
      conv.participants.find((u) => u.id !== currentUser.id) || null,
    [currentUser.id]
  )

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      setActiveId(conv.id)
      localStorage.setItem("activeConversationId", conv.id);
      setInfoOpen(false)
      // Send read_receipt for all unread messages from the other user
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const unread = messages
          .filter(
            (m) =>
              m.conversation_id === conv.id &&
              !m.read &&
              m.sender.id !== currentUser.id
          );
        console.log("[WS] Sending read_receipt for message IDs:", unread.map(m => m.id));
        unread.forEach((m) => {
          wsRef.current!.send(
            JSON.stringify({
              type: "read_receipt",
              message_id: m.id,
            })
          );
        });
      }
    },
    [currentUser.id, messages]
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
    if (!newMessage.trim()) return; // ✅ Guard against empty typing
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    debouncedTyping();
  };


  const onSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!content.trim() && (!files || files.length === 0)) {
        return; // ✅ Prevent sending empty messages or attachments
      }

      try {
        const textOnly = content.trim().length > 0 && (!files || files.length === 0);

        let sentViaWS = false;
        // If only text and WebSocket is open, send via WS
        if (activeId && wsRef.current?.readyState === WebSocket.OPEN && textOnly) {
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const msg: Message = {
            id: tempId,
            conversation_id: activeId,
            sender: { ...currentUser, username: currentUser.username || "Unknown" },
            content: content.trim(),
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            read: false,
            message_type: "text",
            attachments: [],
            status: "sending",
          };
          pendingMessagesRef.current.add(tempId);
          setMessages((prev) => [...prev, msg]);

          try {
              wsRef.current.send(
                JSON.stringify({
                  type: "send_message",
                  content: content.trim(),
                  conversation_id: activeId,
                  temp_id: tempId,
                })
              );
              sentViaWS = true;

              debouncedTyping.cancel();

              setNewMessage("");
          } catch (err) {
            console.warn("WebSocket send failed", err);
            showToast?.("⚠️ WebSocket error", "warning");
          }
        }

        // Send via REST if WS failed or if files are present
        if (files && files.length > 0 && activeId) {
          setIsSending(true);

          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const tempMsg: Message = {
            id: tempId,
            conversation_id: activeId,
            sender: { ...currentUser, username: currentUser.username || "Unknown" },
            content: content.trim(),
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            read: false,
            message_type: files?.length ? "file" : "text",
            attachments:
              files?.map((f) => ({
                id: `temp-${Date.now()}-${Math.random()}`,
                filename: f.name,
                file_size: f.size,
                content_type: f.type || "application/octet-stream",
                url: URL.createObjectURL(f),
              })) || [],
            status: "sending",
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === tempId)) return prev;

            // Avoid pushing if there's a temp message already with the same filename
            if (tempMsg.attachments && tempMsg.attachments.length > 0) {
              const fname = tempMsg.attachments[0].filename;
              const exists = prev.some((m) =>
                m.attachments?.[0]?.filename === fname &&
                m.sender.id === tempMsg.sender.id &&
                m.message_type === "file"
              );
              if (exists) return prev;
            }

            return [...prev, tempMsg];
          });


          try {
            const fd = new FormData();
            fd.append("content", content);
            fd.append("conversation_id", activeId);
            files?.forEach((f) => fd.append("files", f));

            const { data } = await API.post("/messages/send/", fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            setNewMessage("");
            setSelectedFiles([]);

            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
              try {
                const res = await API.get<Message[]>(`/conversations/${activeId}/messages/`);

                const realMessages = (res.data || []).map((m) => ({
                  ...m,
                  status: (m.read ? "read" : "sent") as MessageStatus,
                }));

                setMessages((existing) => {
                  const temp = existing.filter(
                    (m) =>
                      m.id.startsWith("temp") &&
                      pendingMessagesRef.current.has(m.id) &&
                        !realMessages.some(
                          (real) =>
                            real.content === m.content &&
                            real.sender.id === m.sender.id &&
                            real.message_type === m.message_type &&
                            (real.attachments?.[0]?.filename ?? "") === (m.attachments?.[0]?.filename ?? "")
                        )
                  );

                  return [...realMessages, ...temp].sort(
                    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                  );
                });
              } catch (e) {
                console.warn("Fallback REST fetch failed", e);
              }
            }
          } catch (err) {
            console.error("send error", err);
            showToast?.("⚠️ Failed to send message", "error");
          } finally {
            setIsSending(false);
          }
        }
      } catch (err) {
        console.error("Unexpected error in sendMessage", err);
        showToast?.("❌ Unexpected error", "error");
      }
    },
    [API, activeId, currentUser, handleConversationUpdate, showToast]
  );


  // Memoize handleWsMessage with stable reference
  const handleWsMessage = useCallback(
    (data: any) => {
      switch (data.type) {
          case "initial_messages":
            if (hasReceivedInitialMessages.current) return; // ✅ Skip if already handled
            hasReceivedInitialMessages.current = true;      // ✅ Mark as handled

            if (!Array.isArray(data.messages)) return;

            // Do not set status to delivered/read on initial fetch; only update via WebSocket events
            const realMessages = (data.messages || []).map((m: Message) => ({
              ...m,
              status: m.status as MessageStatus || "sent",
            }));

            setMessages((existing) => {
              const temp = existing.filter(
                (m) =>
                  m.id.startsWith("temp") &&
                  pendingMessagesRef.current.has(m.id) &&
                  !realMessages.some(
                    (real: Message) =>
                      real.content === m.content &&
                      real.sender.id === m.sender.id &&
                      real.message_type === m.message_type
                  )
              );

              return [...realMessages, ...temp].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });



            setIsLoadingMessages(false);
            return;


        case "new_message": {
          // Patch sender with full info if available
          if (data?.message?.sender?.id && userMap.has(data.message.sender.id)) {
            const fullSender = userMap.get(data.message.sender.id)
            data.message.sender = { ...data.message.sender, ...fullSender }
          }

          if (messageIdSet.current.has(data.message.id)) return;
          messageIdSet.current.add(data.message.id);


          setMessages((prev) => {
            if (data.temp_id && data.message.sender.id === currentUser.id) {
              pendingMessagesRef.current.delete(data.temp_id)
              return mergeOrAppendMessage(prev, data.message, data.temp_id)
            }

            const idx = prev.findIndex(
              (m) =>
                m.id.startsWith("temp") &&
                m.content === data.message.content &&
                m.sender.id === data.message.sender.id &&
                m.status === "sending"
            )
            if (idx !== -1) {
              const updated = [...prev]
              updated[idx] = { ...data.message, status: "sent" as MessageStatus }
              return updated
            }
            if (prev.some((m) => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })

          handleConversationUpdate(data.conversation_id, data.message)
          return
        }


        case "message_status":
          console.log("[WS] message_status event:", data);
          setMessages((prev) =>
            prev.map((m) => {
              // Only update status for the correct message and only for the sender
              const isTarget =
                (m.id === data.message_id ||
                  (m.id.startsWith("temp") && data.sender_id === currentUser.id)) &&
                m.sender.id === currentUser.id;
              return isTarget ? { ...m, status: data.status as MessageStatus } : m;
            })
          );
          return;


        case "typing": {
          if (data.user_id === currentUser.id) return;

          // Add or update typing user
          setTypingUsers((prev) => {
            const exists = prev.some((u) => u.user_id === data.user_id);
            if (exists) {
              return prev.map((u) =>
                u.user_id === data.user_id ? { ...u, username: data.username } : u
              );
            } else {
              return [...prev, { user_id: data.user_id, username: data.username }];
            }
          });

          // Clear previous timeout
          if (typingTimeouts.current.has(data.user_id)) {
            clearTimeout(typingTimeouts.current.get(data.user_id));
          }

          const timeout = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
            typingTimeouts.current.delete(data.user_id);
          }, 3000);

          typingTimeouts.current.set(data.user_id, timeout);
          return;
        }




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
          setOnlineMap((prev) =>
            new Map(prev).set(
              data.user_id,
              data.is_online ? "online" : "offline"
            )
          );
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
    hasReceivedInitialMessages.current = false; // ✅ Reset guard
    messageIdSet.current = new Set();

    if (!activeId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("⏳ Waiting for WebSocket initial_messages...");
      if (!hasReceivedInitialMessages.current && messages.length === 0) {
        setMessages([]); // ✅ Only clear if empty
      }
      return;
    }



    setIsLoadingMessages(true);

    const tempIds = Array.from(messageIdSet.current).filter((id) => id.startsWith("temp"));
    messageIdSet.current = new Set(tempIds);

    // Clean up pendingMessagesRef too (keep only temp ids)
    pendingMessagesRef.current = new Set(
      [...pendingMessagesRef.current].filter((id) => id.startsWith("temp"))
    );


    API.get<Message[]>(`/conversations/${activeId}/messages/`)
      .then((res) => {
        const realMessages = (res.data || []).map((m: Message) => ({
          ...m,
          status: (m.read ? "read" : "sent") as MessageStatus,
        }));

        setMessages((existing) => {
          const temp = existing.filter(
            (m) =>
              m.id.startsWith("temp") &&
              pendingMessagesRef.current.has(m.id) &&
              !realMessages.some(
                (real) =>
                  real.content === m.content &&
                  real.sender.id === m.sender.id &&
                  real.message_type === m.message_type
              )
          );

          return [...realMessages, ...temp].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      })
      .catch(() => showToast?.("⚠️ Failed to fetch messages", "error"))
      .finally(() => setIsLoadingMessages(false));
  }, [activeId, API, showToast, userMap]);


  useEffect(() => {
    if (!mounted || !activeId || !token) return;
    let shouldReconnect = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const buildWsUrl = () => {
      let protocol = "ws";
      let host = "";

      const rawHost = process.env.NEXT_PUBLIC_WS_BASE_URL?.trim();

      if (typeof window !== "undefined") {
        protocol = window.location.protocol === "https:" ? "wss" : "ws";
        host = window.location.host;

        if (rawHost) {
          try {
            const url = new URL(rawHost.startsWith("http") ? rawHost : `https://${rawHost}`);
            host = url.host;
            protocol = url.protocol === "https:" ? "wss" : "ws";
          } catch {
            host = rawHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
          }
        }
      } else {
        // Server-side fallback
        if (rawHost) {
          protocol = rawHost.startsWith("https") ? "wss" : "ws";
          host = rawHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
        } else {
          host = "localhost:8000";
          protocol = "ws";
        }
      }

      return `${protocol}://${host}/ws/chat/${activeId}/?token=${token}`;
    };

    const wsUrl = buildWsUrl();

    function connect() {
      if (typeof window !== "undefined") {
        console.debug("[WS] Connecting to:", wsUrl, {
          NEXT_PUBLIC_WS_BASE_URL: process.env.NEXT_PUBLIC_WS_BASE_URL,
          location: window.location.href,
        });
      }

      setWsStatus(reconnectAttempt > 0 ? "reconnecting" : "connecting");

      if (wsRef.current) {
        try {
          wsRef.current.onopen = null;
          wsRef.current.onmessage = null;
          wsRef.current.onerror = null;
          wsRef.current.onclose = null;
          if (
            wsRef.current.readyState === WebSocket.OPEN ||
            wsRef.current.readyState === WebSocket.CONNECTING
          ) {
            wsRef.current.close();
          }
        } catch (e) {
          console.warn("Error cleaning up old WebSocket", e);
        }
        wsRef.current = null;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        setReconnectAttempt(0);
        reconnectingRef.current = false;
      };

      ws.onmessage = (e) => {
        try {
          if (handleWsMessageRef.current) {
            handleWsMessageRef.current(JSON.parse(e.data));
          }
        } catch (err) {
          console.error("WebSocket message handler error", err);
        }
      };

      ws.onclose = (event) => {
        console.warn("WebSocket closed", event.code, event.reason);
        setWsStatus("disconnected");
        if (shouldReconnect) {
          reconnectingRef.current = true;
          setReconnectAttempt((prev) => prev + 1);
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 10000);
          reconnectTimeout = setTimeout(connect, delay);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error", event);
        setWsStatus("disconnected");
      };
    }

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (
          wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
    };
  }, [activeId, token, mounted, reconnectAttempt]);



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

  useEffect(() => {
    if (!mounted) return;
    API.get<Conversation[]>("/conversations/")
      .then((res) => {
        setConversations(res.data);
        setApiError(null);

        const storedId = localStorage.getItem("activeConversationId");

        if (
          storedId &&
          res.data.some((c) => c.id === storedId)
        ) {
          setActiveId(storedId);
        } else {
          // 🔥 Invalid or missing
          localStorage.removeItem("activeConversationId");
          setActiveId(null);
        }
      })
      .catch((err) => {
        setApiError(
          err?.response?.data?.detail || err?.message || "Unknown API error"
        );
        showToast?.("⚠️ Failed to load conversations", "error");
      });
  }, [API, mounted, showToast]);


  // Sync global presence context to local map for fallback
  useEffect(() => {
    if (onlineUsers && onlineUsers.size > 0) {
      setOnlineMap((prev) => {
        const updated = new Map(prev);
        for (const [id, status] of onlineUsers.entries()) {
          if (!updated.has(id)) updated.set(id, status);
        }
        return updated;
      });
    }
  }, [onlineUsers]);


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
              typingUsers={typingUsers.filter(u => u.user_id !== currentUser.id)}
              wsConnected={wsStatus === "connected"}
              wsError={wsStatus === "disconnected" ? "Disconnected" : undefined}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              renderAvatar={renderAvatar}
              handleFileSelect={(e) => {
                const fs = e.target.files
                e.target.value = ""
                if (fs && fs.length > 0) {
                  setSelectedFiles(Array.from(fs))
                }
              } }
              removeFile={(i) => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
              selectedFiles={selectedFiles}
              onToggleInfo={() => setInfoOpen((v) => !v)}
              onlineUsers={onlineMap}
              isSending={isSending}
              fileInputRef={fileInputRef}
              activeConversation={activeConv}
              conversations={conversations}
              getOtherParticipant={getOtherParticipant}
              isLoading={isLoadingMessages}
              isOtherUserTyping={isOtherUserTyping}
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
              className="fixed inset-0 bg-black/30 z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] md:w-[450px] h-screen z-[110] border-l border-gray-200 shadow-xl bg-white overflow-y-auto"
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
                attachments={attachments}
                infoSearchQuery={infoSearchQuery}
                setInfoSearchQuery={setInfoSearchQuery}
                messages={messages}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}