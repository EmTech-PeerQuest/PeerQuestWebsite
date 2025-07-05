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
  birthday?: string | null;
  gender?: string | null;
}) => {
  try {
    // Prepare payload for backend
    const payload: any = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
    };
    
    // Only include birthday if provided
    if (userData.birthday) {
      payload.birthday = userData.birthday;
    }
    
    // Only include gender if provided
    if (userData.gender) {
      payload.gender = userData.gender;
    }
    
    const response = await axios.post(`${API_BASE}/api/users/register/`, payload);
    // Only succeed if registration returns 201 Created
    if (response.status !== 201) {
      throw new Error(`Registration failed: Unexpected response status ${response.status}`);
    }
    return response;
  } catch (error: any) {
    // Only log and handle actual errors, not successful responses
    if (error?.response?.status >= 400) {
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
      throw new Error(`Registration error: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Verify email
export const verifyEmail = async (token: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/users/verify-email/`, { token });
    return response;
  } catch (error: any) {
    if (error?.response?.data) {
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
    }
    throw error;
  }
};

// Resend verification email
export const resendVerificationEmail = async (email: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/users/resend-verification/`, { email });
    return response;
  } catch (error: any) {
    if (error?.response?.data) {
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
    
    console.log('👤 fetchUser response:', response.data);
    
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