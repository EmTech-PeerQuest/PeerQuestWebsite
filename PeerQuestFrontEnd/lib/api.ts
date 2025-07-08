import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true, // Allow cookies for cross-origin requests if needed
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post("http://localhost:8000/api/token/refresh/", {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);

          // Update the Authorization header and retry the request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          // Instead of redirecting, throw an error so the UI can handle it
          // Optionally, you can show a toast here if you have access
          // window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Instead of redirecting, throw an error so the UI can handle it
        // window.location.href = "/login";
      }
    }

    // Optionally, show a toast or set a global error state here
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
    try {
      const response = await api.get("/users/search/");
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Handle unauthorized error gracefully
        console.warn("Not authorized to fetch all users. Returning empty list.");
        return [];
      }
      console.error("Error fetching all users:", error);
      throw error;
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
