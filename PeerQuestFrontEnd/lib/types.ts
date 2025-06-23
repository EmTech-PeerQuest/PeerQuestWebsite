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
