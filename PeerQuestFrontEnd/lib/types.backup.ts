export interface User {
  id: string | number;
  email: string;
  username?: string;
  avatar?: string;
  isBanned?: boolean;
  banReason?: string;
  roles?: string[];
}


export interface Quest {
  id: string | number;
  title: string;
  description?: string;
  status?: string;
  reward?: number;
  requirements?: string[];
}


export interface Guild {
  id: string | number;
  name: string;
  description?: string;
  requirements?: string[];
  poster?: {
    username?: string;
    avatar?: string;
  };
}
