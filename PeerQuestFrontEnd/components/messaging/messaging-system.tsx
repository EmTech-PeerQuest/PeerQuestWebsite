"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import ConversationInfoPanel from "./ConversationInfoPanel";
import type { Conversation, Message, User, TypingUser } from "@/lib/types";

// Define the WebSocketMessage interface
interface WebSocketMessage {
  type: string;
  sender_id?: string;
  [key: string]: any;
}

interface MessagingSystemProps {
  token: string;
  currentUser: User;
  showToast?: (message: string, type?: string) => void;
  onlineUsers?: Map<string, "online" | "idle" | "offline">;
}

export default function MessagingSystem({ token, currentUser }: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, "online" | "idle" | "offline">>(new Map());
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket state and refs
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get user by ID
  const getUserById = useCallback((userId: string): User | null => {
    for (const conversation of conversations) {
      const user = conversation.participants.find(p => p.id === userId);
      if (user) return user;
    }
    return null;
  }, [conversations]);

  const getOtherParticipant = useCallback(
    (conversation: Conversation): User | null => {
      if (conversation.is_group) return null;
      return conversation.participants.find((u) => u.id !== currentUser.id) || null;
    },
    [currentUser.id]
  );

  // Define handleSelectConversation here
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setActiveConversationId(conversation.id.toString())  // Set active conversation ID
    setShowInfoPanel(false)  // Close the info panel when conversation is selected
  }, [])

  // WebSocket message handler
  const handleWsMessage = useCallback((data: any) => {
    console.log('Received WebSocket message:', data);
    
    switch (data.type) {
      case 'connection_status':
        console.log('Connection status:', data.message);
        break;
        
      case 'initial_messages':
        console.log('Received initial messages:', data.messages);
        setMessages(data.messages || []);
        break;
        
      case 'new_message':
        console.log('📨 New message received:', data.message);
        setMessages(prev => [...prev, data.message]);
        break;
        
      case 'message_sent':
        console.log('✅ Message sent confirmation:', data);
        break;
        
      case 'typing':
        console.log('👤 User typing:', data);
        if (data.user_id && data.user_id !== currentUser.id) {
          const typingUser = getUserById(data.user_id);
          if (typingUser) {
            setTypingUsers(prev => {
              const existing = prev.find(t => t.user_id === data.user_id);
              if (!existing) {
                return [...prev, { 
                  user_id: data.user_id, 
                  username: typingUser.username,
                  timestamp: Date.now() 
                }];
              }
              return prev.map(t => 
                t.user_id === data.user_id 
                  ? { ...t, timestamp: Date.now() }
                  : t
              );
            });
            
            // Clear typing indicator after 3 seconds
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(t => t.user_id !== data.user_id));
            }, 3000);
          }
        }
        break;
        
      case 'user_online_status':
        console.log('👥 User online status:', data);
        if (data.user_id && data.status) {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.user_id, data.status);
            return newMap;
          });
        }
        break;
        
      case 'error':
        console.error('❌ WebSocket error:', data.message);
        break;
        
      default:
        console.warn('⚠️ Unhandled WS message type:', data.type, data);
    }
  }, [currentUser.id, getUserById]);

  // WebSocket connection function
  const connectWebSocket = useCallback(() => {
    if (!activeConversationId || !token) {
      console.log('Cannot connect WebSocket: missing activeConversationId or token');
      return;
    }

    if (wsConnectionStatus === 'connecting' || wsConnectionStatus === 'connected') {
      console.log('WebSocket already connecting or connected, skipping');
      return;
    }

    console.log('Attempting to connect to WebSocket');
    setWsConnectionStatus('connecting');

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsUrl = `ws://localhost:8000/ws/chat/${activeConversationId}/?token=${token}`;
    console.log('WebSocket URL:', wsUrl);

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      wsRef.current = ws;
      setWsConnectionStatus('connected');
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWsMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed', event.code, event.reason);
      wsRef.current = null;
      setWsConnectionStatus('disconnected');
      
      if (event.code !== 1000 && activeConversationId && token) {
        console.log('Scheduling reconnect attempt...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnectionStatus('disconnected');
    };
  }, [activeConversationId, token, wsConnectionStatus, handleWsMessage]);

  // Cleanup function
  const disconnectWebSocket = useCallback(() => {
    console.log('Cleaning up WebSocket connection');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setWsConnectionStatus('disconnected');
  }, []);

  // Main useEffect for WebSocket connection
  useEffect(() => {
    console.log('useEffect triggered for WebSocket connection', {
      activeConversationId: activeConversationId || 'null',
      token: token ? 'present' : 'missing',
      currentStatus: wsConnectionStatus
    });

    // Check if both activeConversationId and token are present before connecting
    if (!activeConversationId || !token) {
      console.log('Cannot connect WebSocket: missing activeConversationId or token');
      disconnectWebSocket();
      return;
    }

    // Proceed with WebSocket connection only if disconnected
    if (wsConnectionStatus === 'disconnected') {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [activeConversationId, token, wsConnectionStatus]);  // Add `activeConversationId` to the dependency list


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Function to handle sending a message
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Function to handle typing event
  const sendTypingEvent = useCallback(() => {
    if (wsConnectionStatus === 'connected') {
      sendMessage({ type: "typing" });
    }
  }, [wsConnectionStatus, sendMessage]);

  const onSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!activeConversationId) return;

      setIsSending(true);
      try {
        let fileRefs: string[] = [];
        if (files && files.length > 0) {
          const formData = new FormData();
          files.forEach((file) => formData.append("files", file));
          const uploadRes = await fetch(`http://localhost:8000/api/conversations/${activeConversationId}/upload/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
          if (!uploadRes.ok) throw new Error("File upload failed");
          const uploadData = await uploadRes.json();
          fileRefs = uploadData.file_ids;
        }

        const payload: any = { type: "send_message", content };
        if (fileRefs.length > 0) {
          payload.files = fileRefs;
        }
        sendMessage(payload);

        setNewMessage("");
        setSelectedFiles([]);        
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, sendMessage, token]
  );

  const onTyping = useCallback(() => {
    sendTypingEvent();
  }, [sendTypingEvent]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...filesArray]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const activeConversation = conversations.find((c) => c.id.toString() === activeConversationId) || null;
  const otherParticipant = activeConversation ? getOtherParticipant(activeConversation) : null;

  const formatTime = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const toggleInfoPanel = () => setShowInfoPanel((v) => !v);

  return (
    <div className="flex h-[95vh] overflow-hidden bg-gray-100">
      <ConversationList
        conversations={conversations}
        currentUserId={currentUser.id}
        selectedConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        userMap={new Map(conversations.flatMap((c) => c.participants.map((p) => [p.id, p])))}
        onlineUsers={onlineUsers}
        showUserSearch={false}
        startConversation={async (participants) => {
          try {
            const res = await fetch("http://localhost:8000/api/conversations/start/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ participants }),
            });
            if (!res.ok) throw new Error("Failed to start conversation");
            const newConversation: Conversation = await res.json();
            setConversations((prev) => [newConversation, ...prev]);
            setActiveConversationId(newConversation.id.toString());
          } catch (err) {
            console.error("Start conversation failed:", err);
          }
        }}
        getOtherParticipant={getOtherParticipant}
        renderAvatar={(user, size = "md") => (
          <img
            src={user.avatar || "/placeholder-user.jpg"}
            alt={user.username}
            className={`rounded-full object-cover ${
              size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10"
            }`}
          />
        )}
        onlineStatusMap={onlineUsers}
      />

      <div className="flex-1 flex flex-col border-l border-gray-300">
        {activeConversation ? (
          <>
            <ChatWindow
              messages={messages}
              currentUserId={currentUser.id}
              currentUser={currentUser}
              otherParticipant={otherParticipant}
              conversationName={activeConversation.name}
              isGroupChat={activeConversation.is_group}
              onSendMessage={onSendMessage}
              onTyping={onTyping}
              typingUserIds={typingUsers.map((t) => t.user_id)}
              wsConnected={wsConnectionStatus === 'connected'}
              wsError={wsConnectionStatus === 'disconnected' ? 'Disconnected' : undefined}
              messagesContainerRef={messagesContainerRef}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              renderAvatar={(user, size = "md") => (
                <img
                  src={user.avatar || "/placeholder-user.jpg"}
                  alt={user.username}
                  className={`rounded-full object-cover ${
                    size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10"
                  }`}
                />
              )}
              formatTime={formatTime}
              handleFileSelect={handleFileSelect}
              removeFile={removeFile}
              selectedFiles={selectedFiles}
              onToggleInfo={toggleInfoPanel}
              onlineUsers={onlineUsers}
              isSending={isSending}
              fileInputRef={fileInputRef}
              activeConversation={activeConversationId}
              conversations={conversations}
              getOtherParticipant={getOtherParticipant}
            />
            {showInfoPanel && activeConversation && (
              <ConversationInfoPanel
                conversation={activeConversation}
                participants={activeConversation.participants}
                onlineUsers={onlineUsers}
                renderAvatar={(user, size = "md") => (
                  <img
                    src={user.avatar || "/placeholder-user.jpg"}
                    alt={user.username}
                    className={`rounded-full object-cover ${
                      size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10"
                    }`}
                  />
                )}
                onClose={toggleInfoPanel}
                currentUser={currentUser}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
