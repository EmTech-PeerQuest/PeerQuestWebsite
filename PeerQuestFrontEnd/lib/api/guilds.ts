
import type { Guild, GuildMembership, GuildJoinRequest, CreateGuildData } from '@/lib/types';
import { isValidUUID, toUUIDString } from './uuid';
import { useCallback, useMemo, useState } from 'react';

// --- API Endpoint Config ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
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
  processJoinRequest: (guildId: string, requestId: number) => `${API_BASE_URL}/api/guilds/${guildId}/join-requests/${requestId}/process/`,
  kickMember: (guildId: string, userId: number) => `${API_BASE_URL}/api/guilds/${guildId}/kick/${userId}/`,
  updateMemberRole: (guildId: string, userId: string) => `${API_BASE_URL}/api/guilds/${guildId}/members/${userId}/role/`,
} as const;

// --- Auth & Headers ---
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}
function createHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Error Handling ---
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any = {};
    let rawText = '';
    try { 
      const responseText = await response.text();
      rawText = responseText;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        // If not JSON, use raw text
      }
    } catch { 
      // If reading response fails
    }
    
    // Suppress console.error for user-facing validation errors
    if (response.status >= 500) {
      // Only log server errors
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData,
        rawText
      });
    }
    
    // More defensive error message handling
    let errorMessage = 'Unknown error';
    if (errorData && typeof errorData === 'object' && (errorData.error || errorData.message)) {
      errorMessage = errorData.error || errorData.message;
    } else if (rawText && rawText.trim()) {
      errorMessage = rawText;
    } else {
      errorMessage = `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
    }
    
    throw new Error(errorMessage);
  }
  return response.json();
}

// --- API Service ---
export const guildApi = {
  async getGuilds(params?: { search?: string; specialization?: string; max_level?: number }): Promise<Guild[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.specialization) searchParams.append('specialization', params.specialization);
    if (params?.max_level) searchParams.append('max_level', params.max_level.toString());
    const url = params ? `${API_ENDPOINTS.guilds}?${searchParams}` : API_ENDPOINTS.guilds;
    const response = await fetch(url, { method: 'GET', headers: createHeaders(false) });
    return handleResponse<Guild[]>(response);
  },
  async getGuildDetail(guildId: string): Promise<Guild> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const response = await fetch(API_ENDPOINTS.guildDetail(id), { method: 'GET', headers: createHeaders(false) });
    return handleResponse<Guild>(response);
  },
  async createGuild(guildData: CreateGuildData): Promise<Guild> {
    const allowedSpecializations = ['alchemy', 'development', 'writing', 'art', 'music', 'gaming'];
    let specialization = guildData.specialization;
    if (!allowedSpecializations.includes(specialization)) specialization = allowedSpecializations[0];
    let tags: string[] = [];
    if (Array.isArray(guildData.tags)) {
      tags = guildData.tags.map((tag: any) => typeof tag === 'string' ? tag : (tag.tag || tag.name || String(tag.id) || '')).filter(Boolean);
    }
    const cleanGuildData = { ...guildData, specialization, tags };
    const response = await fetch(API_ENDPOINTS.createGuild, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(cleanGuildData),
    });
    return handleResponse<Guild>(response);
  },
  async updateGuild(guildId: string, guildData: Partial<CreateGuildData>): Promise<Guild> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const formData = new FormData();
    Object.entries(guildData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'custom_emblem' && value instanceof File) formData.append(key, value);
        else if (key === 'tags' || key === 'social_links') formData.append(key, JSON.stringify(value));
        else formData.append(key, value.toString());
      }
    });
    const response = await fetch(API_ENDPOINTS.guildUpdate(id), {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      body: formData,
    });
    return handleResponse<Guild>(response);
  },
  async deleteGuild(guildId: string): Promise<void> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const response = await fetch(API_ENDPOINTS.guildDelete(id), { method: 'DELETE', headers: createHeaders() });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },
  async getMyGuilds(): Promise<Guild[]> {
    const response = await fetch(API_ENDPOINTS.myGuilds, { method: 'GET', headers: createHeaders() });
    return handleResponse<Guild[]>(response);
  },
  async getGuildMembers(guildId: string): Promise<GuildMembership[]> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const response = await fetch(API_ENDPOINTS.guildMembers(id), { method: 'GET', headers: createHeaders() });
    return handleResponse<GuildMembership[]>(response);
  },
  async joinGuild(guildId: string, message?: string): Promise<{ message: string; membership?: GuildMembership; join_request?: GuildJoinRequest }> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID. Please select a valid guild to join.');
    const url = API_ENDPOINTS.joinGuild(id);
    const headers: HeadersInit = createHeaders();
    const body = JSON.stringify({ message: message ?? '' });
    const response = await fetch(url, { method: 'POST', headers, body });
    if (!response.ok) {
      let errorMsg = 'Failed to join guild.';
      try {
        const errData = await response.json();
        // Handle both { error: ... }, { message: ... }, and { detail: ... }
        const msg = errData.message || errData.error || errData.detail;
        if (msg && msg.includes('pending request')) {
          errorMsg = '⏳ You already have a pending join request for this guild. Please wait for approval.';
        } else if (msg && msg.includes('token is expired')) {
          errorMsg = '🔒 Your session has expired. Please log in again.';
        } else if (msg) {
          errorMsg = msg;
        } else {
          errorMsg = JSON.stringify(errData) || errorMsg;
        }
      } catch {}
      throw new Error(errorMsg);
    }
    return await response.json();
  },
  async leaveGuild(guildId: string): Promise<{ message: string }> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const response = await fetch(API_ENDPOINTS.leaveGuild(id), { method: 'POST', headers: createHeaders() });
    return handleResponse(response);
  },
  async getGuildJoinRequests(guildId: string, type: 'pending' | 'processed' | 'all' = 'pending'): Promise<GuildJoinRequest[]> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const url = `${API_ENDPOINTS.guildJoinRequests(id)}?type=${type}`;
    const response = await fetch(url, { method: 'GET', headers: createHeaders() });
    return handleResponse<GuildJoinRequest[]>(response);
  },
  async processJoinRequest(guildId: string, requestId: number, action: 'approve' | 'reject'): Promise<{ message: string }> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const response = await fetch(API_ENDPOINTS.processJoinRequest(id, requestId), {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ action }),
    });
    return handleResponse(response);
  },
  async kickMember(guildId: string, userId: number): Promise<{ message: string }> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    const response = await fetch(API_ENDPOINTS.kickMember(id, userId), { method: 'POST', headers: createHeaders() });
    return handleResponse(response);
  },
  async updateMemberRole(guildId: string, userId: string, role: 'member' | 'admin'): Promise<{ message: string; membership: GuildMembership }> {
    const id = toUUIDString(guildId);
    if (!isValidUUID(id)) throw new Error('Invalid guild ID.');
    if (!isValidUUID(userId)) throw new Error('Invalid user ID.');
    
    const url = API_ENDPOINTS.updateMemberRole(id, userId);
    const payload = { role };
    const headers = createHeaders();
    
    console.log('DEBUG: Making API call to update member role', {
      url,
      method: 'PATCH',
      guildId: id,
      userId,
      role,
      payload,
      headers: Object.fromEntries(Object.entries(headers))
    });
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      
      console.log('DEBUG: API response received', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('DEBUG: API Error Response', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url
        });
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('DEBUG: API Success Response', result);
      return result;
    } catch (error) {
      console.error('DEBUG: API Request failed', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        url,
        payload
      });
      throw error;
    }
  },
};

// --- React Hook: useGuildApi ---
function getUserIdFromToken(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.id || null;
  } catch {
    return null;
  }
}

export const useGuildApi = () => {
  const [myGuilds, setMyGuilds] = useState<Guild[] | null>(null);

  // All public guilds
  const getGuilds = useCallback(guildApi.getGuilds, []);
  // My guilds (with cache)
  const getMyGuilds = useCallback(async () => {
    const guilds = await guildApi.getMyGuilds();
    setMyGuilds(guilds);
    return guilds;
  }, []);
  // Membership check
  const isGuildMember = useCallback(async (guildId: string) => {
    const userId = getUserIdFromToken();
    if (!userId) return false;
    try {
      const members = await guildApi.getGuildMembers(guildId);
      return members.some(m => String(m.user) === String(userId));
    } catch {
      return false;
    }
  }, []);
  // Pending join request check
  const hasPendingJoinRequest = useCallback(async (guildId: string) => {
    const userId = getUserIdFromToken();
    if (!userId) return false;
    try {
      const requests = await guildApi.getGuildJoinRequests(guildId, 'pending');
      return requests.some(r => String(r.user) === String(userId));
    } catch {
      return false;
    }
  }, []);
  // All members
  const getGuildMembers = useCallback(guildApi.getGuildMembers, []);
  // Safe detail fetch
  const getGuildSafe = useCallback(async (guildId: string) => {
    try { return await guildApi.getGuildDetail(guildId); } catch { return null; }
  }, []);
  // Expose all
  return useMemo(() => ({
    ...guildApi,
    getGuilds,
    getMyGuilds,
    myGuilds,
    isGuildMember,
    hasPendingJoinRequest,
    getGuildMembers,
    getGuildSafe,
  }), [getGuilds, getMyGuilds, myGuilds, isGuildMember, hasPendingJoinRequest, getGuildMembers, getGuildSafe]);
};

export default guildApi;

// ...existing code for new API and hook (from previous patch)...
