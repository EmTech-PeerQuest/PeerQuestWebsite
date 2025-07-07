import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true, // Allow cookies for cross-origin requests if needed
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }
};

export default api;
