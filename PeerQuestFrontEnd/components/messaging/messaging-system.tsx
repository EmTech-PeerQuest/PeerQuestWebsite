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
  sender: {
    id: number
    username: string
    email?: string
  }
  receiver: {
    id: number
    username: string
    email?: string
  }
  content: string
  attachments?: string[]
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

export function MessagingSystem({ currentUser: initialUser, showToast }: MessagingSystemProps) {
  // ALL STATE DECLARATIONS AT THE TOP - ALWAYS CALLED IN SAME ORDER
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  
  // NEW USER SEARCH STATE
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  
  // ALL REF DECLARATIONS
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch users and conversations from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use full backend URL for local development, fallback to relative for production
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        console.log('Fetching data from:', `${apiBase}/api/users/me/`);
        console.log('Headers:', headers);
        
        const [userRes, convoRes] = await Promise.all([
          axios.get(`${apiBase}/api/users/me/`, { headers }),
          axios.get(`${apiBase}/api/messages/conversations/`, { headers })
        ])
        
        console.log('User data:', userRes.data);
        console.log('Conversations data:', convoRes.data);
        
        setCurrentUser(userRes.data)
        setConversations(convoRes.data)
      } catch (err: any) {
        console.error('Error fetching data:', err.response?.data || err.message);
        
        // TEMPORARY: Add mock data for testing
        if (err.response?.status === 404 || err.code === 'ECONNREFUSED') {
          console.log('Using mock data for testing');
          setCurrentUser({
            id: 1,
            username: 'current_user',
            email: 'user@example.com'
          });
          setConversations([
            {
              id: 1,
              participants: [
                { id: 1, username: 'current_user', email: 'user@example.com' },
                { id: 2, username: 'alice', email: 'alice@example.com' }
              ],
              last_message: 'Hey, how are you?',
              last_message_date: '2024-07-04T10:30:00Z',
              unread_count: 2
            },
            {
              id: 2,
              participants: [
                { id: 1, username: 'current_user', email: 'user@example.com' },
                { id: 3, username: 'bob', email: 'bob@example.com' }
              ],
              last_message: 'See you tomorrow!',
              last_message_date: '2024-07-04T09:15:00Z',
              unread_count: 0
            }
          ]);
          showToast("Using mock data - backend not available", "warning");
          return;
        }
        
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
      if (activeConversation === null) return;

      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${apiBase}/api/messages/conversations/${activeConversation}/`, { headers });
        setMessages(res.data); // ✅ This will load all messages into state
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        showToast('Could not load messages for this conversation.', 'error');
      }
    };

    fetchMessages();
  }, [activeConversation]);


  // NEW USER SEARCH FUNCTION
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    
    setIsSearchingUsers(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${apiBase}/api/messages/users/search/?q=${encodeURIComponent(query)}`, { headers });
      setUserSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      showToast("Failed to search users", "error");
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // DEBOUNCE USER SEARCH
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [userSearchQuery]);

  // START NEW CONVERSATION FUNCTION
  const startConversation = async (userId: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(`${apiBase}/api/conversations/start/`, {
        participant_id: userId
      }, { headers });
      
      if (response.data) {
        const newConversation = response.data;
        
        // Check if conversation already exists in our list
        const existingConversation = conversations.find(conv => conv.id === newConversation.id);
        
        if (!existingConversation) {
          setConversations(prev => [...prev, newConversation]);
        }
        
        setActiveConversation(newConversation.id);
        setUserSearchQuery('');
        setUserSearchResults([]);
        setShowUserSearch(false);
        showToast("Conversation started!", "success");
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      showToast("Failed to start conversation", "error");
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!currentUser) return null
    return conversation.participants.find((user: User) => user.id !== currentUser.id) || null
  }

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  })

  useEffect(() => {
    if (!activeConversation || !currentUser) return;

    const token = localStorage.getItem("access_token");
    const wsInstance = new WebSocket(`ws://localhost:8000/ws/chat/${activeConversation}/?token=${token}`);
    setWs(wsInstance);

    wsInstance.onopen = () => {
      console.log("WebSocket connected.");
    };

    wsInstance.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.conversation_id === activeConversation) {
          const newMsg: Message = {
            id: data.id,
            content: data.content,
            created_at: data.timestamp,
            read: false,
            attachments: [],
            sender: {
              id: data.sender_id,
              username: data.sender_username || "Unknown",
            },
            receiver: {
              id: data.recipient_id,
              username: "", // You can resolve it later
            }
          };
          setMessages(prev => [...prev, newMsg]);
        }
      } catch (err) {
        console.error("Invalid WS message:", event.data);
        showToast("Received invalid message.", "error");
      }
    };

    wsInstance.onerror = (event) => {
      console.error("WebSocket error:", event);
      showToast("WebSocket error", "error");
    };

    wsInstance.onclose = (event) => {
      console.warn("WebSocket closed:", event);
      setWs(null);
      showToast("WebSocket connection closed", "warning");
    };

    return () => {
      wsInstance.close();
    };
  }, [activeConversation, currentUser]);


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
    if (!currentUser) return
    
    const conversation = conversations.find(c => c.id === activeConversation)
    const receiver = conversation?.participants.find(u => u.id !== currentUser.id)
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

  const handleWebSocketSend = () => {
  if (!currentUser || !newMessage.trim() || !ws) return;

  const conversation = conversations.find(c => c.id === activeConversation);
  const receiver = conversation?.participants.find(u => u.id !== currentUser.id);

  if (!receiver) {
    showToast("Could not find the recipient for this conversation.", "error");
    return;
  }

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        content: newMessage,       // use 'content' to match backend expectation
        sender_id: currentUser.id,
        recipient_id: receiver.id
      })
    );
    setNewMessage("");
  } else {
    showToast("Connection is not open. Please wait or refresh.", "error");
  }
};

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
          onChange={e => setSearchQuery(e.target.value)}
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
            {filteredConversations.map(convo => {
              const other = getOtherParticipant(convo)
              return (
                <li
                  key={convo.id}
                  className={`p-2 rounded cursor-pointer mb-2 ${activeConversation === convo.id ? 'bg-[#CDAA7D] text-white' : 'hover:bg-[#e5d6c2]'}`}
                  onClick={() => handleConversationSelect(convo.id)}
                >
                  <div className="font-bold">{other?.username || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{convo.last_message || 'No messages yet'}</div>
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
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, idx) => {
                const isSelf = msg.sender?.id === currentUser?.id;

                return (
                  <div key={idx} className={`mb-2 flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-2 rounded-lg max-w-xs ${isSelf ? 'bg-[#8B75AA] text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {!msg.sender && (
                        <div className="text-red-500 text-xs italic mb-1">
                          Unknown sender
                        </div>
                      )}
                      <div>{msg.content}</div>
                      <div className="text-xs mt-1 opacity-70">{formatTime(msg.created_at)}</div>
                    </div>
                  </div>
                );
              })}


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