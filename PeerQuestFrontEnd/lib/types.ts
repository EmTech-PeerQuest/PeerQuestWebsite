export interface User {
  id: string | number;
  email: string;
  user_name: string;
  first_name: string;
  username?: string; // backward compatibility
  avatar?: string;
  isBanned?: boolean;
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
