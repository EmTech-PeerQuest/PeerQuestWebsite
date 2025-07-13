import { TokenInvalidError, BannedUserError } from './errors';
import { refreshToken, clearTokens, saveBanInfo } from './auth';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE + '/api/',
  withCredentials: false,
});

// Attach access token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for ban, token refresh, etc.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Ban enforcement
    if (
      error.response?.status === 403 &&
      error.response?.data?.ban_reason
    ) {
      if (typeof window !== 'undefined') {
        saveBanInfo(error.response.data.ban_reason, error.response.data.ban_expires_at);
        clearTokens();
        window.location.href = '/banned';
      }
      return Promise.reject(new BannedUserError(error.response.data.ban_reason, error.response.data.ban_expires_at));
    }
    // Don't handle 401 errors from login endpoints
    if (
      error.response?.status === 401 &&
      (originalRequest.url?.includes('/api/token/') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/google'))
    ) {
      return Promise.reject(error);
    }
    // Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshData = await refreshToken();
        localStorage.setItem('access_token', refreshData.access);
        if (originalRequest.headers)
          originalRequest.headers['Authorization'] = `Bearer ${refreshData.access}`;
        else
          originalRequest.headers = { Authorization: `Bearer ${refreshData.access}` };
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
          window.location.href = '/';
        }
        return Promise.reject(new TokenInvalidError('Token refresh failed'));
      }
    }
    return Promise.reject(error);
  }
);

// User search API functions
export const userSearchApi = {
  searchUsers: async (params: {
    q?: string;
    skills?: string;
    location?: string;
    min_level?: number;
    max_level?: number;
  }) => {
    try {
      const response = await api.get("/users/search/", { params });
      return response.data;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  getAllUsers: async () => {
    // Try /users/search/ with a real query, but if 400, fallback to /users/
    try {
      const response = await api.get("/users/search/", { params: { q: "adminpanel-list" } });
      return response.data;
    } catch (error: any) {
      // If 400 (bad request), try /users/ endpoint (admin only)
      if (error.response && error.response.status === 400) {
        try {
          const fallback = await api.get("/users/");
          return fallback.data;
        } catch (fallbackError: any) {
          if (fallbackError.response && fallbackError.response.status === 401) {
            console.warn("Not authorized to fetch all users. Returning empty list.");
            return [];
          }
          if (fallbackError.response && fallbackError.response.data) {
            console.error("Backend error fetching all users (fallback):", fallbackError.response.data);
          }
          console.error("Error fetching all users (fallback):", fallbackError);
          return [];
        }
      }
      if (error.response && error.response.status === 401) {
        console.warn("Not authorized to fetch all users. Returning empty list.");
        return [];
      }
      if (error.response && error.response.data) {
        console.error("Backend error fetching all users:", error.response.data);
      }
      console.error("Error fetching all users:", error);
      return [];
    }
  },
};

// Skills management API functions
export const skillsApi = {
  getSkills: async () => {
    try {
      const response = await api.get("/users/skills/");
      return response.data;
    } catch (error) {
      console.error("Error fetching skills:", error);
      throw error;
    }
  },

  getUserSkills: async () => {
    try {
      const response = await api.get("/users/skills/my-skills/");
      return response.data;
    } catch (error) {
      console.error("Error fetching user skills:", error);
      throw error;
    }
  },

  updateUserSkills: async (payload: { skills: any[] }) => {
    try {
      // The backend expects POST with { skills: [...] }, but expects each skill to have 'skill_id' as a UUID, not as a string
      // Ensure all skill_id values are strings (UUIDs)
      const fixedPayload = {
        skills: payload.skills.map(skill => ({
          ...skill,
          skill_id: String(skill.skill_id)
        }))
      };
      const response = await api.post("/users/skills/my-skills/", fixedPayload);
      return response.data;
    } catch (error: any) {
      // User-facing error handling only
      throw error;
    }
  },

  getSkillRecommendations: async () => {
    try {
      const response = await api.get("/users/skills/recommendations/");
      return response.data;
    } catch (error) {
      console.error("Error fetching skill recommendations:", error);
      throw error;
    }
  },
};

export default api;
