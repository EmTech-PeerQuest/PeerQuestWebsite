export interface User {
  id: string;
  email: string;
  email_verified?: boolean;
  username?: string;
  avatar?: string;
  isBanned?: boolean;
  banReason?: string;
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
}



export interface Quest {
  id: number
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  reward: number
  xp: number
  status: 'open' | 'in_progress' | 'completed'
  poster: User
  createdAt: string // or `Date` if you're consistent
  deadline: string  // same here
  applicants: any[]
  isGuildQuest?: boolean
  guildId?: number
  guildReward?: number
  completedAt?: string
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
    username?: string;
    avatar?: string;
    name?: string;
  };
}

export interface GuildApplication {
  id: number
  userId: number
  username: string
  avatar?: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  appliedAt: Date
}

export interface Badge {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
}
