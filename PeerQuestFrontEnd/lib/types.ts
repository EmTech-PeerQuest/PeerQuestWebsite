export interface User {
  id: number
  username: string
  email: string
  password: string
  avatar: string
  level: number
  xp: number
  gold: number
  bio: string
  completedQuests: number
  createdQuests: number
  joinedGuilds: number
  createdGuilds: number
  isAdmin?: boolean
  isBanned?: boolean
  createdAt: Date
  settings: UserSettings
  spendingLimits?: SpendingLimits
  spendingHistory?: SpendingRecord[]
}

export interface SpendingLimits {
  dailyLimit: number
  weeklyLimit: number
  enabled: boolean
  notifications: boolean
}

export interface SpendingRecord {
  id: number
  amount: number
  type: "quest_posting" | "guild_creation" | "other"
  description: string
  date: Date
}

export interface UserSettings {
  email: string
  username: string
  password: string
  avatar: string
  notifications: {
    questUpdates: boolean
    guildUpdates: boolean
    messages: boolean
    applicationUpdates: boolean
  }
  privacy: {
    showProfile: "everyone" | "friends" | "none"
    showActivity: boolean
    showGuilds: boolean
  }
  theme: "light" | "dark" | "system"
  language: string
}

export interface Quest {
  id: number
  title: string
  description: string
  poster: User
  reward: number
  xp: number
  deadline: Date
  category: string
  difficulty: "easy" | "medium" | "hard"
  status: "open" | "in-progress" | "completed"
  createdAt: Date
  completedAt?: Date
  assignedTo?: number
  applicants: QuestApplication[]
  isGuildQuest?: boolean
  guildId?: number
  guildReward?: number
}

export interface QuestApplication {
  id: number
  userId: number
  username: string
  avatar: string
  message: string
  status: "pending" | "accepted" | "rejected"
  appliedAt: Date
}

export interface Guild {
  id: number
  name: string
  description: string
  emblem: string
  poster: User
  members: number
  membersList: number[]
  admins: number[]
  specialization: string
  category: string
  createdAt: Date
  applications: GuildApplication[]
  funds: number
  settings: GuildSettings
  roles: GuildRole[]
  socialLinks: string[]
  shout?: GuildShout
}

export interface GuildSettings {
  joinRequirements: {
    manualApproval: boolean
    minimumLevel: number
    requiresApplication: boolean
  }
  visibility: {
    publiclyVisible: boolean
    showOnHomePage: boolean
    allowDiscovery: boolean
  }
  permissions: {
    whoCanPost: "everyone" | "members" | "admins"
    whoCanInvite: "everyone" | "members" | "admins"
    whoCanKick: "admins" | "owner"
  }
}

export interface GuildRole {
  id: number
  name: string
  description: string
  rank: number
  permissions: {
    manageMembers: boolean
    manageFunds: boolean
    postAnnouncements: boolean
    moderateChat: boolean
    acceptApplications: boolean
    kickMembers: boolean
    banMembers: boolean
    manageRoles: boolean
  }
  color: string
}

export interface GuildShout {
  id: number
  content: string
  authorId: number
  authorName: string
  createdAt: Date
  updatedAt: Date
}

export interface GuildApplication {
  id: number
  userId: number
  username: string
  avatar: string
  message: string
  status: "pending" | "accepted" | "rejected"
  appliedAt: Date
}

export interface GuildChatMessage {
  id: number
  guildId: number
  senderId: number
  senderName: string
  senderAvatar: string
  content: string
  createdAt: Date
  edited?: boolean
  editedAt?: Date
}

export interface Message {
  id: number
  senderId: number
  receiverId: number
  content: string
  read: boolean
  createdAt: Date
}

export interface Conversation {
  id: number
  participants: number[]
  lastMessage: string
  lastMessageDate: Date
  unreadCount: number
}

export interface Report {
  id: number
  type: "user" | "quest" | "guild"
  targetId: number
  targetName: string
  reason: string
  reportedBy: number
  reporterName: string
  status: "pending" | "resolved" | "dismissed"
  createdAt: Date
}

export interface GuildTransaction {
  id: number
  guildId: number
  type: "quest_reward" | "donation" | "expense" | "payout"
  amount: number
  description: string
  fromUserId?: number
  toUserId?: number
  questId?: number
  createdAt: Date
}
