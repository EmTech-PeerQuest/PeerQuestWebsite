"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIChatbotProps {
  currentUser: UserType | null
}

export function AIChatbot({ currentUser }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Greetings, ${currentUser?.username || "adventurer"}! I'm the Tavern Keeper's AI assistant. How can I help you with your quests today?`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestionPrompts = [
    "🎯 How do I post a quest?",
    "🏰 Tell me about guilds",
    "💰 How do I earn gold?",
    "📈 How does leveling work?",
    "🔍 Find me good quests",
    "👥 How do I join a guild?",
    "💬 How does messaging work?",
    "⚔️ What are quest types?",
    "🏆 Show me achievements",
    "🎮 Getting started guide",
    "💎 What can I buy with gold?",
    "🛡️ Guild roles explained",
    "📊 Check my progress",
    "🎪 What's new in the tavern?",
    "🔧 Account settings help",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Removed generateAIResponse. All AI responses are now handled by the backend LLM (Groq) and should be PeerQuest Tavern related as per backend prompt/logic.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const res = await fetch("/api/users/ai-chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newUserMessage], user: currentUser }),
      });
      const data = await res.json();
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || data.error || "Sorry, I couldn't process your request.",
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, there was an error contacting the AI service.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    const cleanSuggestion = suggestion.replace(/^[🎯🏰💰📈🔍👥💬⚔️🏆🎮💎🛡️📊🎪🔧]\s/u, "")
    setInput(cleanSuggestion)
    setShowSuggestions(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300
            bg-gradient-to-r from-[var(--tavern-gold)] to-[var(--tavern-purple)]
            text-[var(--tavern-dark)] font-semibold hover:shadow-xl hover:scale-105
            ${isOpen ? "hidden" : "flex"}
          `}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] bg-[var(--tavern-cream)] border-2 border-[var(--tavern-gold)] rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--tavern-gold)] to-[var(--tavern-purple)] text-[var(--tavern-dark)] rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-bold">Tavern AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/10 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-[var(--tavern-purple)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`
                    max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap
                    ${
                      message.role === "user"
                        ? "bg-[var(--tavern-gold)] text-[var(--tavern-dark)] rounded-br-none"
                        : "bg-white border border-[var(--tavern-gold)] text-[var(--tavern-dark)] rounded-bl-none"
                    }
                  `}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-[var(--tavern-gold)] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[var(--tavern-dark)]" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-[var(--tavern-purple)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-[var(--tavern-gold)] text-[var(--tavern-dark)] p-3 rounded-lg rounded-bl-none">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}

            {/* Suggestion Prompts */}
            {showSuggestions && messages.length === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[var(--tavern-purple)] font-medium text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Try asking about:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {suggestionPrompts.slice(0, 6).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-left p-2 text-xs bg-white border border-[var(--tavern-gold)] rounded-lg hover:bg-[var(--tavern-gold)] hover:text-[var(--tavern-dark)] transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-[var(--tavern-purple)] hover:underline"
                >
                  Hide suggestions
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[var(--tavern-gold)]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about quests, guilds, or anything..."
                className="flex-1 px-3 py-2 border border-[var(--tavern-gold)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tavern-purple)] text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-[var(--tavern-gold)] text-[var(--tavern-dark)] rounded-lg hover:bg-[var(--tavern-purple)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
