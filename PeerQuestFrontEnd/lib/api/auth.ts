import axios from "axios";

const API_BASE = "http://localhost:8000";

// Custom error for invalid/expired JWT
export class TokenInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenInvalidError";
  }
}

// JWT login
export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/token/`, { username, password });
    return response;
  } catch (error: any) {
    // User-friendly error for 401
    if (error?.response?.status === 401) {
      // Log which credential was incorrect (username or password)
      if (error?.response?.data?.detail?.toLowerCase().includes('no active account')) {
        console.warn(`Login failed: No active account found with username: '${username}'.`);
      } else if (error?.response?.data?.detail?.toLowerCase().includes('password')) {
        console.warn(`Login failed: Incorrect password for username: '${username}'.`);
      } else {
        console.warn(`Login failed for username: '${username}'. Detail:`, error?.response?.data?.detail);
      }
      throw new Error("Invalid username or password.");
    }
    // User-friendly error for backend validation
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

// Register
export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}) => {
  try {
    // TEMP: Log registration props for debugging
    console.warn("REGISTER ATTEMPT:", {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword
    });
    // Only send username, email, and password to backend
    const response = await axios.post(`${API_BASE}/api/users/register/`, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
    });
    // Only succeed if registration returns 201 Created
    if (response.status !== 201) {
      console.warn(`Registration failed: Unexpected response status ${response.status} for username: '${userData.username}', email: '${userData.email}'.`);
      throw new Error(`Registration failed: Unexpected response status ${response.status}`);
    }
    return response;
  } catch (error: any) {
    // Debug: log backend error response
    if (error?.response?.data) {
      console.error("Registration backend error:", error.response.data);
      // Prefer extracting from 'errors' key if present
      const errorData = error.response.data.errors ?? error.response.data;
      function extractMessages(val: any): string[] {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        if (Array.isArray(val)) return val.flatMap(extractMessages);
        if (typeof val === 'object') return Object.values(val).flatMap(extractMessages);
        return [];
      }
      const allMessages = extractMessages(errorData);
      if (allMessages.length) {
        throw new Error(allMessages.join(' | '));
      }
      // Fallback: show the whole error object
      console.warn(`Registration failed: ${JSON.stringify(error.response.data)}`);
      throw new Error(`Registration error: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Fetch user profile (JWT required)
export const fetchUser = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE}/api/users/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error: any) {
    // Detect JWT errors
    const detail = error?.response?.data?.detail || "";
    if (
      error?.response?.status === 401 &&
      (detail.includes("token not valid") || detail.includes("token has expired") || detail.includes("credentials were not provided"))
    ) {
      throw new TokenInvalidError(detail || "Token not valid");
    }
    throw error;
  }
};

// No server-side logout for JWT, just remove token client-side
export const logout = async () => {
  // No-op for JWT
};