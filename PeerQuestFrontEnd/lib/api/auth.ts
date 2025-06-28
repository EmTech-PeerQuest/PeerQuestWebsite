import axios from "axios";

const API_BASE = "http://localhost:8000";

// JWT login
export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/token/`, { username, password });
    return response;
  } catch (error: any) {
    alert('Login API error: ' + (error?.response?.data?.detail || error?.message));
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
    alert('Register API error: ' + JSON.stringify(error?.response?.data?.errors || error?.response?.data?.detail || error?.response?.data || error?.message));
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
    alert('Fetch user API error: ' + (error?.response?.data?.detail || error?.message));
    throw error;
  }
};

// No server-side logout for JWT, just remove token client-side
export const logout = async () => {
  // No-op for JWT
};