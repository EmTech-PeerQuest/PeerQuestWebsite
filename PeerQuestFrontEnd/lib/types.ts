export interface User {
  id: string | number;
  email: string;
  email_verified?: boolean;
  username?: string;
  avatar?: string;
  isBanned?: boolean;
  banReason?: string;
  roles?: string[];
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
    username?: string;
    avatar?: string;
    name?: string;
  };
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
}
