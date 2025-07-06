import type { Guild, GuildMembership, GuildJoinRequest, CreateGuildData } from '@/lib/types';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_ENDPOINTS = {
  guilds: `${API_BASE_URL}/api/guilds/`,
  createGuild: `${API_BASE_URL}/api/guilds/create/`,
  guildDetail: (guildId: string) => `${API_BASE_URL}/api/guilds/${guildId}/`,
  guildUpdate: (guildId: string) => `${API_BASE_URL}/api/guilds/${guildId}/update/`,
  guildDelete: (guildId: string) => `${API_BASE_URL}/api/guilds/${guildId}/delete/`,
  myGuilds: `${API_BASE_URL}/api/guilds/my-guilds/`,
  guildMembers: (guildId: string) => `${API_BASE_URL}/api/guilds/${guildId}/members/`,
  joinGuild: (guildId: string) => `${API_BASE_URL}/api/guilds/${guildId}/join/`,
  leaveGuild: (guildId: string) => `${API_BASE_URL}/api/guilds/${guildId}/leave/`,
  guildJoinRequests: (guildId: string) => `${API_BASE_URL}/api/guilds/${guildId}/join-requests/`,
  processJoinRequest: (guildId: string, requestId: number) => 
    `${API_BASE_URL}/api/guilds/${guildId}/join-requests/${requestId}/process/`,
  kickMember: (guildId: string, userId: number) => 
    `${API_BASE_URL}/api/guilds/${guildId}/kick/${userId}/`,
} as const;

// Utility function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Utility function to create headers
function createHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Error handling utility
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// API Functions
export const guildApi = {
  // Get all public guilds (Guild Hall)
  async getGuilds(params?: {
    search?: string;
    specialization?: string;
    max_level?: number;
  }): Promise<Guild[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.specialization) searchParams.append('specialization', params.specialization);
    if (params?.max_level) searchParams.append('max_level', params.max_level.toString());

    const url = params ? `${API_ENDPOINTS.guilds}?${searchParams}` : API_ENDPOINTS.guilds;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(false), // Public endpoint
    });

    return handleResponse<Guild[]>(response);
  },

  // Get guild details
  async getGuildDetail(guildId: string): Promise<Guild> {
    const response = await fetch(API_ENDPOINTS.guildDetail(guildId), {
      method: 'GET',
      headers: createHeaders(false), // Public endpoint
    });

    return handleResponse<Guild>(response);
  },

  // Create a new guild
  async createGuild(guildData: CreateGuildData): Promise<Guild> {
    console.log('Creating guild with data:', guildData);
    
    // For now, send as JSON instead of FormData for simplicity
    const response = await fetch(API_ENDPOINTS.createGuild, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Temporarily disable auth for testing
        // 'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(guildData),
    });

    return handleResponse<Guild>(response);
  },

  // Update guild
  async updateGuild(guildId: string, guildData: Partial<CreateGuildData>): Promise<Guild> {
    const formData = new FormData();
    
    // Add provided fields
    Object.entries(guildData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'custom_emblem' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'tags' || key === 'social_links') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await fetch(API_ENDPOINTS.guildUpdate(guildId), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    return handleResponse<Guild>(response);
  },

  // Delete guild
  async deleteGuild(guildId: string): Promise<void> {
    const response = await fetch(API_ENDPOINTS.guildDelete(guildId), {
      method: 'DELETE',
      headers: createHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },

  // Get user's guilds
  async getMyGuilds(): Promise<Guild[]> {
    const response = await fetch(API_ENDPOINTS.myGuilds, {
      method: 'GET',
      headers: createHeaders(),
    });

    return handleResponse<Guild[]>(response);
  },

  // Get guild members
  async getGuildMembers(guildId: string): Promise<GuildMembership[]> {
    const response = await fetch(API_ENDPOINTS.guildMembers(guildId), {
      method: 'GET',
      headers: createHeaders(),
    });

    return handleResponse<GuildMembership[]>(response);
  },

  // Join guild
  async joinGuild(guildId: string, message?: string): Promise<{
    message: string;
    membership?: GuildMembership;
    join_request?: GuildJoinRequest;
  }> {
    const response = await fetch(API_ENDPOINTS.joinGuild(guildId), {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ message: message || '' }),
    });

    return handleResponse(response);
  },

  // Leave guild
  async leaveGuild(guildId: string): Promise<{ message: string }> {
    const response = await fetch(API_ENDPOINTS.leaveGuild(guildId), {
      method: 'POST',
      headers: createHeaders(),
    });

    return handleResponse(response);
  },

  // Get guild join requests (admin/owner only)
  async getGuildJoinRequests(guildId: string): Promise<GuildJoinRequest[]> {
    const response = await fetch(API_ENDPOINTS.guildJoinRequests(guildId), {
      method: 'GET',
      headers: createHeaders(),
    });

    return handleResponse<GuildJoinRequest[]>(response);
  },

  // Process join request (admin/owner only)
  async processJoinRequest(
    guildId: string, 
    requestId: number, 
    action: 'approve' | 'reject'
  ): Promise<{ message: string }> {
    const response = await fetch(API_ENDPOINTS.processJoinRequest(guildId, requestId), {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ action }),
    });

    return handleResponse(response);
  },

  // Kick member (admin/owner only)
  async kickMember(guildId: string, userId: number): Promise<{ message: string }> {
    const response = await fetch(API_ENDPOINTS.kickMember(guildId, userId), {
      method: 'POST',
      headers: createHeaders(),
    });

    return handleResponse(response);
  },
};

// Specialized hooks for React components
export const useGuildApi = () => {
  return {
    ...guildApi,
    
    // Helper method to check if user is guild member
    async isGuildMember(guildId: string): Promise<boolean> {
      try {
        const members = await guildApi.getGuildMembers(guildId);
        const token = getAuthToken();
        if (!token) return false;
        
        // This would need user ID from token or context
        // For now, return false - implement with proper user context
        return false;
      } catch {
        return false;
      }
    },

    // Helper to get guild by ID with error handling
    async getGuildSafe(guildId: string): Promise<Guild | null> {
      try {
        return await guildApi.getGuildDetail(guildId);
      } catch {
        return null;
      }
    },
  };
};

export default guildApi;
