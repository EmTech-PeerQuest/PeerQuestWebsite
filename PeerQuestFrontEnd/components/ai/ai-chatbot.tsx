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

  const generateAIResponse = (userMessage: string): string => {
    const userName = currentUser?.username || "adventurer"
    const userLevel = currentUser?.level || 1
    const userGold = currentUser?.gold || 0

    const lowerMessage = userMessage.toLowerCase()

    // Greeting responses
    if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey") ||
      lowerMessage.includes("greetings")
    ) {
      const greetings = [
        `Well met, ${userName}! Welcome back to the tavern. I see you're Level ${userLevel} with ${userGold} gold. What adventure brings you here today?`,
        `Ah, ${userName}! Good to see you again! Your Level ${userLevel} status is impressive. How can this old tavern keeper assist you?`,
        `Greetings, brave ${userName}! The tavern is bustling today. With your ${userGold} gold, you're well-equipped for any quest!`,
        `Welcome, ${userName}! I've been expecting you. Your reputation as a Level ${userLevel} adventurer precedes you!`,
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    // Quest posting responses
    if (lowerMessage.includes("post") && lowerMessage.includes("quest")) {
      return `Excellent question, ${userName}! To post a quest:\n\n1. 📋 Click "Post a Quest" on the Quest Board\n2. 📝 Write a clear, detailed description\n3. 💰 Set a fair reward (${userGold} gold available)\n4. ⏰ Choose a deadline\n5. 🏷️ Add relevant tags\n6. 🚀 Publish and watch adventurers apply!\n\nRemember: Clear quests with fair rewards attract the best talent!`
    }

    // Quest finding responses
    if ((lowerMessage.includes("find") || lowerMessage.includes("good")) && lowerMessage.includes("quest")) {
      return `Looking for worthy quests, ${userName}? Here's my advice:\n\n🎯 **Browse by Category**: Check different quest types\n📊 **Match Your Level**: Look for Level ${userLevel} appropriate tasks\n💰 **Check Rewards**: Ensure fair compensation\n⭐ **Read Reviews**: See quest giver ratings\n🏷️ **Use Filters**: Sort by deadline, reward, difficulty\n\nStart with quests offering 50-200 gold for your level!`
    }

    // Guild creation responses
    if (lowerMessage.includes("create") && lowerMessage.includes("guild")) {
      return `Starting your own guild, ${userName}? Ambitious! Here's how:\n\n🏰 **Visit Guild Hall** → "Create Guild"\n📝 **Choose a Name**: Make it memorable!\n🎨 **Design Banner**: Show your guild's identity\n📋 **Write Description**: Attract like-minded adventurers\n💰 **Pay Fee**: 500 gold (you have ${userGold})\n👥 **Invite Members**: Start with friends\n⚖️ **Set Rules**: Establish guild culture\n\nA strong guild becomes your adventuring family!`
    }

    // Guild joining responses
    if (lowerMessage.includes("join") && lowerMessage.includes("guild")) {
      return `Seeking a guild family, ${userName}? Wise choice!\n\n🔍 **Browse Guilds**: Visit the Guild Hall\n📊 **Check Stats**: Member count, activity level\n📖 **Read Descriptions**: Find your perfect match\n💬 **Join Their Chat**: Get a feel for the community\n📝 **Apply**: Send a thoughtful application\n⏳ **Wait for Response**: Guild leaders review applications\n\nLook for active guilds with 10-50 members for the best experience!`
    }

    // Gold earning responses
    if (lowerMessage.includes("earn") && (lowerMessage.includes("gold") || lowerMessage.includes("money"))) {
      return `Ah, seeking fortune, ${userName}? Here are the best ways to earn gold:\n\n⚔️ **Complete Quests**: 50-500 gold per quest\n🏆 **Daily Challenges**: 25-100 gold daily\n🏰 **Guild Bonuses**: Extra rewards for guild members\n🎯 **Skill Bonuses**: Higher level = better rewards\n💎 **Rare Achievements**: Special gold bonuses\n🔄 **Referrals**: Bring friends, earn gold\n📈 **Level Up**: Unlock higher-paying quests\n\nYour current ${userGold} gold shows you're on the right path!`
    }

    // Gold spending responses
    if (
      (lowerMessage.includes("spend") || lowerMessage.includes("buy") || lowerMessage.includes("purchase")) &&
      lowerMessage.includes("gold")
    ) {
      return `Wondering how to spend your ${userGold} gold, ${userName}? Here are your options:\n\n🎯 **Post Quests**: Hire other adventurers\n🏰 **Guild Services**: Donations, upgrades\n🛡️ **Profile Upgrades**: Premium features\n🎨 **Customization**: Avatars, banners, themes\n💬 **Messaging**: Premium chat features\n🏆 **Achievements**: Unlock special rewards\n📊 **Analytics**: Advanced progress tracking\n\nInvest wisely to grow your reputation!`
    }

    // Leveling responses
    if (lowerMessage.includes("level") || lowerMessage.includes("xp") || lowerMessage.includes("experience")) {
      return `Seeking to grow stronger, ${userName}? At Level ${userLevel}, you're doing great!\n\n📈 **Gain XP by**:\n• Completing quests (+50-200 XP)\n• Guild participation (+25 XP daily)\n• Helping others (+10-50 XP)\n• Daily login (+5 XP)\n• Achievements (+100-500 XP)\n\n🎯 **Level Benefits**:\n• Higher quest rewards\n• Guild leadership roles\n• Premium features\n• Increased reputation\n\nNext level needs ${(userLevel + 1) * 100} XP total!`
    }

    // Messaging system responses
    if (lowerMessage.includes("messag") || lowerMessage.includes("chat") || lowerMessage.includes("talk")) {
      return `Communication is key in our tavern, ${userName}!\n\n💬 **Direct Messages**:\n• Click any user's profile\n• Send private messages\n• Share files and images\n• Voice messages (premium)\n\n🏰 **Guild Chat**:\n• Real-time group discussions\n• Quest coordination\n• File sharing\n• Announcement channels\n\n📱 **Features**:\n• Mobile notifications\n• Message history\n• Emoji reactions\n• @mentions\n\nStay connected with your fellow adventurers!`
    }

    // Quest types responses
    if (lowerMessage.includes("quest") && lowerMessage.includes("type")) {
      return `Many quest types await you, ${userName}!\n\n⚔️ **Combat Quests**: Battle challenges, raids\n🧩 **Puzzle Quests**: Brain teasers, riddles\n🎨 **Creative Quests**: Art, writing, design\n🔧 **Technical Quests**: Coding, debugging\n📚 **Research Quests**: Information gathering\n🏃 **Speed Quests**: Time-limited challenges\n👥 **Group Quests**: Team collaboration\n🎯 **Daily Quests**: Regular small tasks\n🏆 **Epic Quests**: Long-term adventures\n\nChoose quests that match your skills and interests!`
    }

    // Achievements responses
    if (lowerMessage.includes("achievement") || lowerMessage.includes("reward") || lowerMessage.includes("badge")) {
      return `Achievements showcase your prowess, ${userName}!\n\n🏆 **Quest Master**: Complete 100 quests\n👑 **Guild Leader**: Lead a successful guild\n💰 **Gold Hoarder**: Accumulate 10,000 gold\n⚡ **Speed Runner**: Complete quests quickly\n🤝 **Helper**: Assist 50+ adventurers\n📈 **Level Legend**: Reach Level 50\n🎯 **Specialist**: Master specific quest types\n🌟 **Tavern Regular**: 365 days active\n\nEach achievement grants gold, XP, and special titles!`
    }

    // Getting started responses
    if (
      lowerMessage.includes("start") ||
      lowerMessage.includes("new") ||
      lowerMessage.includes("begin") ||
      lowerMessage.includes("guide")
    ) {
      return `Welcome to PeerQuest Tavern, ${userName}! Here's your adventure roadmap:\n\n🎯 **Step 1**: Browse the Quest Board\n🏰 **Step 2**: Join or create a guild\n💰 **Step 3**: Complete your first quest\n📈 **Step 4**: Level up and earn gold\n👥 **Step 5**: Connect with other adventurers\n🏆 **Step 6**: Unlock achievements\n\n💡 **Pro Tips**:\n• Start with easy quests\n• Join an active guild\n• Be helpful to others\n• Check in daily for bonuses\n\nYour journey begins now!`
    }

    // Account settings responses
    if (lowerMessage.includes("setting") || lowerMessage.includes("account") || lowerMessage.includes("profile")) {
      return `Managing your adventurer profile, ${userName}?\n\n⚙️ **Profile Settings**:\n• Update avatar and banner\n• Edit bio and skills\n• Set availability status\n• Privacy controls\n\n🔔 **Notifications**:\n• Quest updates\n• Guild messages\n• Achievement alerts\n• Email preferences\n\n🔒 **Security**:\n• Change password\n• Two-factor authentication\n• Login history\n• Account recovery\n\nKeep your profile updated to attract better quests!`
    }

    // Progress tracking responses
    if (lowerMessage.includes("progress") || lowerMessage.includes("stat") || lowerMessage.includes("track")) {
      return `Let's review your progress, ${userName}!\n\n📊 **Current Stats**:\n• Level: ${userLevel}\n• Gold: ${userGold}\n• Quests Completed: ${Math.floor(userLevel * 3)}\n• Guild Rank: ${userLevel > 10 ? "Veteran" : "Novice"}\n\n📈 **This Month**:\n• XP Gained: ${userLevel * 50}\n• Gold Earned: ${userGold}\n• New Connections: ${Math.floor(userLevel / 2)}\n\n🎯 **Goals**:\n• Next Level: ${(userLevel + 1) * 100} XP needed\n• Gold Target: ${Math.max(1000, userGold * 2)}\n• Quest Milestone: ${Math.floor(userLevel * 3) + 10}\n\nYou're making excellent progress!`
    }

    // What's new responses
    if (lowerMessage.includes("new") && lowerMessage.includes("tavern")) {
      return `Exciting updates in our tavern, ${userName}!\n\n🆕 **Latest Features**:\n• AI Assistant (that's me!)\n• Enhanced guild chat\n• Mobile app improvements\n• New quest categories\n• Achievement system overhaul\n\n🎉 **Events**:\n• Weekly guild tournaments\n• Monthly quest challenges\n• Seasonal celebrations\n• Community contests\n\n🔜 **Coming Soon**:\n• Voice chat in guilds\n• Quest templates\n• Advanced analytics\n• Mentorship program\n\nStay tuned for more adventures!`
    }

    // Guild roles responses
    if (lowerMessage.includes("guild") && lowerMessage.includes("role")) {
      return `Guild hierarchy brings order to chaos, ${userName}!\n\n👑 **Guild Master**: Full control, can disband guild\n⚔️ **Officers**: Manage members, moderate chat\n🛡️ **Veterans**: Experienced members, mentor others\n👥 **Members**: Full guild privileges\n🆕 **Recruits**: New members, limited permissions\n\n🎯 **Role Benefits**:\n• Higher roles = more privileges\n• Special chat channels\n• Quest posting rights\n• Treasury access\n• Event organization\n\nEarn promotions through dedication and helpfulness!`
    }

    // Help with specific features
    if (lowerMessage.includes("help")) {
      return `I'm here to help, ${userName}! What specific area interests you?\n\n🎯 **Popular Topics**:\n• Quest posting and completion\n• Guild creation and management\n• Gold earning strategies\n• Leveling and XP system\n• Messaging and communication\n• Account settings\n• Achievement hunting\n\n💡 **Quick Tips**:\n• Use the search bar for specific quests\n• Join guild chat for real-time help\n• Check your notifications regularly\n• Complete daily challenges\n\nWhat would you like to know more about?`
    }

    // Personality responses
    if (lowerMessage.includes("joke") || lowerMessage.includes("funny") || lowerMessage.includes("laugh")) {
      const jokes = [
        `Why did the adventurer bring a ladder to the tavern? Because they heard the drinks were on the house! *chuckles in tavern keeper*`,
        `What do you call a guild with no members? A guild-ty pleasure! *slaps knee*`,
        `Why don't quest givers ever get lost? Because they always know the way to adventure! *winks*`,
        `What's an adventurer's favorite type of music? Quest-ion and answer! *grins widely*`,
        `Why did the gold piece go to therapy? It had too many issues with change! *chortles*`,
      ]
      return (
        jokes[Math.floor(Math.random() * jokes.length)] +
        `\n\nBut seriously, ${userName}, what quest assistance do you need?`
      )
    }

    if (
      lowerMessage.includes("tavern keeper") ||
      lowerMessage.includes("who are you") ||
      lowerMessage.includes("about you")
    ) {
      return `I'm the AI assistant to our beloved Tavern Keeper, ${userName}! I've learned from years of watching adventurers come and go, quests completed and guilds formed.\n\n🤖 **My Purpose**:\n• Guide new adventurers\n• Answer quest questions\n• Explain guild systems\n• Share tavern wisdom\n• Provide encouragement\n\n📚 **My Knowledge**:\n• Every quest type and strategy\n• Guild management best practices\n• Gold earning techniques\n• Platform features and updates\n\nI'm here 24/7 to help you succeed in your adventures!`
    }

    // Default helpful response with suggestions
    const suggestions = [
      "quest posting strategies",
      "guild joining tips",
      "gold earning methods",
      "leveling techniques",
      "achievement hunting",
      "messaging features",
      "profile optimization",
    ]
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]

    return `Interesting question, ${userName}! While I specialize in tavern matters, I'm always eager to help.\n\n🤔 **Perhaps you're interested in**:\n• ${randomSuggestion}\n• Platform navigation\n• Community guidelines\n• Technical support\n\n💡 **Try asking about**:\n"How do I post a quest?"\n"Tell me about guilds"\n"How do I earn more gold?"\n\nWhat specific aspect of the tavern would you like to explore?`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInput("")
    setIsLoading(true)
    setShowSuggestions(false)

    // Simulate AI thinking time
    setTimeout(
      () => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: generateAIResponse(userMessage),
        }
        setMessages((prev) => [...prev, aiResponse])
        setIsLoading(false)
      },
      1000 + Math.random() * 1500,
    ) // Random delay between 1-2.5 seconds
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
