export interface User {
  id: string | number;
  email: string;
  username?: string;
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
  status: 'open' | 'in-progress' | 'completed'
  xp_reward: number
  gold_reward?: number
  max_participants: number
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
  message: string
  status: 'pending' | 'approved' | 'rejected'
  applied_at: string
  reviewed_at?: string
  reviewed_by?: {
    id: number
    username: string
    email: string
  }
}
