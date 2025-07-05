export interface User {
  id: string | number;
  email: string;
  username?: string;
  avatar?: string;
  isBanned?: boolean;
  banned?: boolean; // Alternative naming
  banReason?: string;
  roles?: string[];
  createdAt?: string;
  level?: number;
  xp?: number;
  gold?: number;
  completedQuests?: number;
  createdQuests?: number;
  joinedGuilds?: number;
  createdGuilds?: number;
  bio?: string;
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
  difficulty: 'easy' | 'medium' | 'hard'
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
  requirements?: string
  resources?: string
  slug: string
  participant_count: number
  applications_count: number
  can_accept_participants: boolean
  is_completed: boolean
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
}




export interface Guild {
  id: string | number;
  name: string;
  description?: string;
  requirements?: string[];
  createdAt?: string;
  emblem?: string;
  specialization?: string;
  members?: number;
  funds?: number;
  poster?: {
    id?: number; // Added missing id property
    username?: string;
    avatar?: string;
    name?: string;
  };
  // Missing properties found in components
  membersList?: number[];
  admins?: number[];
  username?: string; // Alternative naming
  category?: string;
  settings?: {
    joinRequirements?: {
      manualApproval?: boolean;
    };
  };
  shout?: {
    content: string;
    authorName: string;
    createdAt: string;
  };
  socialLinks?: Array<{
    platform: string;
    url: string;
    name?: string;
  }>;
  applications?: GuildApplication[];
}

export interface GuildApplication {
  id: number
  userId: number
  username: string
  avatar?: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  appliedAt: Date
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
    difficulty: 'easy' | 'medium' | 'hard'
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
  status: 'pending' | 'approved' | 'rejected'
  applied_at: string
  reviewed_at?: string
  reviewed_by?: {
    id: number
    username: string
    email: string
  }
}
