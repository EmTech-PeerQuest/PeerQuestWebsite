export interface User {
  id: string
  email?: string
  username: string
  avatar?: string
  isOnline?: boolean
  lastSeen?: string
  isBanned?: boolean
  banReason?: string
  roles?: string[]
  createdAt?: string
  level?: number
  xp?: number
  gold?: number
  completedQuests?: number
  createdQuests?: number
  joinedGuilds?: number
  createdGuilds?: number
  bio?: string
}

export interface Quest {
  id: number
  title: string
  description: string
  category: string
  difficulty: "easy" | "medium" | "hard"
  reward: number
  xp: number
  status: "open" | "in_progress" | "completed"
  poster: User
  createdAt: string
  deadline: string
  applicants: any[]
  isGuildQuest?: boolean
  guildId?: number
  guildReward?: number
  completedAt?: string
}

export interface Guild {
  id: string | number
  name: string
  description?: string
  requirements?: string[]
  createdAt?: string
  emblem?: string
  specialization?: string
  members?: number
  funds?: number
  poster?: {
    username?: string
    avatar?: string
    name?: string
  }
}

export interface GuildApplication {
  id: number
  userId: number
  username: string
  avatar?: string
  message: string
  status: "pending" | "accepted" | "rejected"
  appliedAt: Date
}

export interface Conversation {
  id: string
  is_group: boolean
  name?: string
  description?: string
  participants: User[]
  last_message?: Message
  updated_at: string
  unread_count?: number
  last_message_date?: string
  created_at?: string
  guildId?: string
}

export interface Message {
  id: string
  conversation_id: string
  sender: {
    id: string
    username: string
    avatar?: string
  }
  receiver?: {
    id: string
    username: string
    avatar?: string
  }
  content: string
  created_at: string
  read: boolean
  recipient_id?: string
  message_type: "text" | "file" | string
  status: "sending" | "sent" | "delivered" | "read" | "failed"
  timestamp: string
  attachments?: Attachment[]
}

export interface TypingUser {
  user_id: string
  username: string
  is_typing?: boolean
}

export interface Attachment {
  id: string
  filename: string
  file_size: number
  file_size_human?: string
  content_type: string
  file_type?: string
  thumbnail?: string
  thumbnail_url?: string
  url: string
  file_url?: string
  is_image?: boolean
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed"
export type UserStatus = "online" | "idle" | "offline"
