
export interface QuestReport {
  id: number;
  reported_quest: string;
  reporter: string;
  reason: string;
  message?: string;
  created_at: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  reporter_username?: string;
  reported_quest_title?: string;
}
export interface ActionLogEntry {
  id: number;
  action: string;
  admin: string | null;
  target_user: string | null;
  details: string;
  created_at: string;
}
export interface User {
  id: string;
  email?: string;
  email_verified?: boolean;
  username?: string;
  avatar?: string;
  isOnline?: boolean
  lastSeen?: string
  isBanned?: boolean;
  banned?: boolean; // Alternative naming
  banReason?: string;
  banExpiration?: Date | string | null;
  roles?: string[];
  role?: string; // User role (quest_maker, adventurer, moderator, admin)
  roleDisplay?: string; // Human-readable role display
  roleLevel?: number; // Role hierarchy level
  createdAt?: string;
  dateJoined?: string;
  // Backend field names (snake_case)
  date_joined?: string;
  created_at?: string;
  last_password_change?: string;
  lastPasswordChange?: string;
  level?: number;
  xp?: number;
  experience_points?: number; // Backend field name
  gold?: number;
  gold_balance?: number; // Backend field name
  completedQuests?: number;
  createdQuests?: number;
  joinedGuilds?: number;
  createdGuilds?: number;
  bio?: string;
  displayName?: string;
  display_name?: string; // Backend field name
  birthday?: string;
  gender?: string;
  location?: string;
  // Additional properties for search functionality
  skills?: { id: string; name: string; description?: string }[];
  guilds?: Guild[];
  badges?: { id: string; name: string; icon?: string; description?: string; rarity?: 'common' | 'rare' | 'epic' | 'legendary'; earnedAt?: string }[];
  is_staff?: boolean;
  isSuperuser?: boolean;
  is_superuser?: boolean;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    youtube?: string;
    twitch?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  settings?: {
    language?: string;
    theme?: string;
    security?: {
      twoFactorEnabled?: boolean;
      twoFactorMethod?: string;
      backupCodesGenerated?: boolean;
    };
    privacy?: {
      showBirthday?: boolean;
      showGender?: boolean;
      showEmail?: boolean;
    };
    notifications?: {
      newQuests?: boolean;
      questApplications?: boolean;
      guildAnnouncements?: boolean;
      directMessages?: boolean;
      newsletter?: boolean;
    };
  };
  spendingLimits?: SpendingLimits;
  paymentMethods?: any[];
}

export interface SpendingLimits {
  dailyLimit: number;
  weeklyLimit: number;
  enabled: boolean;
  notifications: boolean;
  // Additional properties found in components
  skills?: string[];
  displayName?: string;
  location?: string;
  joinDate?: string;
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    description?: string;
  }>;
  guilds?: Guild[];
  spendingLimits?: SpendingLimits;
  spendingHistory?: SpendingRecord[];
}

export interface SpendingLimits {
  enabled: boolean;
  dailyLimit: number;
  weeklyLimit: number;
  notifications: boolean;
}

export interface SpendingRecord {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: 'purchase' | 'reward' | 'transfer' | 'refund';
}

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
  perks: string[];
}

export interface Quest {
  id: number
  title: string
  description: string
  category: {
    id: number
    name: string
    description?: string
  }
  difficulty: 'initiate' | 'adventurer' | 'champion' | 'mythic'
  status: 'open' | 'in-progress' | 'in_progress' | 'completed' // Include both variants
  xp_reward: number
  gold_reward?: number
  creator: {
    id: number
    username: string
    email: string
    level?: number
    xp?: number
  }
  created_at: string
  updated_at: string
  due_date?: string
  completed_at?: string
  completedAt?: string // Alternative naming
  createdAt?: string // Alternative naming
  resources?: string
  slug: string
  participant_count: number
  applications_count: number
  can_accept_participants: boolean
  is_completed: boolean
  reports_count?: number
  participants_detail?: Array<{
    id: number
    user: {
      id: number
      username: string
      email: string
      level?: number
      xp?: number
    }
    status: 'joined' | 'in_progress' | 'completed' | 'dropped'
    joined_at: string
    completed_at?: string
    progress_notes: string
  }>
  // Legacy fields for compatibility
  reward?: number
  xp?: number
  poster?: User
  deadline?: string
  applicants?: any[]
  isGuildQuest?: boolean
  guildId?: number
  guildReward?: number
  assignedTo?: number // Missing property found in components
  requirements?: string[]
}

export interface Guild {
  guild_id: string;
  name: string;
  description: string;
  specialization: string;
  welcome_message?: string;
  custom_emblem?: string | null;
  preset_emblem?: string;
  privacy: 'public' | 'private';
  require_approval: boolean;
  minimum_level: number;
  allow_discovery: boolean;
  show_on_home_page: boolean;
  who_can_post_quests: 'all_members' | 'admins_only' | 'owner_only';
  who_can_invite_members: 'all_members' | 'admins_only' | 'owner_only';
  owner: User;
  created_at: string;
  updated_at: string;
  member_count: number;
  tags?: GuildTag[];
  social_links?: GuildSocialLink[];
  
  // Backward compatibility
  id?: string | number;
  requirements?: string[];
  emblem?: string;
  members?: number;
  funds?: number;
  membersList?: number[];
  poster?: {
    id?: number; // Added missing id property
    username?: string;
    avatar?: string;
    name?: string;
  };
  // Missing properties found in components
  admins?: number[];
  username?: string; // Alternative naming
  shout?: {
    content: string;
    authorName: string;
    createdAt: string;
  };
  
  // Additional fields for overview modal
  category?: string;
  announcements?: GuildAnnouncement[];
  settings?: {
    joinRequirements?: {
      manualApproval: boolean;
    };
  };
  socialLinks?: string[]; // For backward compatibility
}

export interface GuildTag {
  id: number;
  tag: string;
}

export interface GuildSocialLink {
  id: number;
  platform_name: string;
  url: string;
}

export interface GuildAnnouncement {
  id: number;
  title: string;
  content: string;
  author: User;
  created_at: string;
  is_pinned?: boolean;
}

export interface GuildMembership {
  id: number;
  user: User;
  guild: Guild;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected' | 'left' | 'kicked';
  is_active: boolean;
  joined_at: string;
  approved_at?: string;
  left_at?: string;
  approved_by?: User;
}

export interface GuildJoinRequest {
  id: number;
  guild: Guild;
  user: User;
  message: string;
  created_at: string;
  processed_at?: string;
  processed_by?: User;
  is_approved?: boolean | null; // null = pending, true = approved, false = rejected
}

export interface CreateGuildData {
  name: string;
  description: string;
  specialization: string;
  welcome_message?: string;
  custom_emblem?: File | null;
  preset_emblem?: string;
  privacy: 'public' | 'private';
  require_approval: boolean;
  minimum_level: number;
  allow_discovery: boolean;
  show_on_home_page: boolean;
  who_can_post_quests: 'all_members' | 'admins_only' | 'owner_only';
  who_can_invite_members: 'all_members' | 'admins_only' | 'owner_only';
  tags?: string[];
  social_links?: Array<{
    platform_name: string;
    url: string;
  }>;
  guildId?: string | number // Missing property
}

export interface GuildChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type?: 'message' | 'system' | 'announcement';
}

export interface Application {
  id: number
  quest: {
    id: number
    title: string
    difficulty: 'initiate' | 'adventurer' | 'champion' | 'mythic'
    status: 'open' | 'in-progress' | 'completed'
    xp_reward: number
    gold_reward: number
    creator: {
      id: number
      username: string
      email: string
      level?: number
      xp?: number
    }
    due_date?: string
  }
  applicant: {
    id: number
    username: string
    email: string
    level?: number
    xp?: number
  }
  status: 'pending' | 'approved' | 'rejected' | 'kicked'
  applied_at: string
  reviewed_at?: string
  reviewed_by?: {
    id: number
    username: string
    email: string
  }
}


export interface Badge {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
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
