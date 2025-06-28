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
    // Let other errors bubble up
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
    // Only send username, email, and password to backend
    const response = await axios.post(`${API_BASE}/api/users/register/`, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
    });
    return response;
  } catch (error: any) {
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