import axios from "axios"
import type { User } from "@/lib/types"

const API_BASE = "http://localhost:8000"

// Login: Obtain JWT tokens
export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/token/`, { username, password })
    console.log("Login response:", response.data)

    return {
      access: response.data.access,
      refresh: response.data.refresh,
      user: response.data.user, // optional: only if your backend includes user
    }
  } catch (error: any) {
    console.error("Login API error:", error.response?.data)

    if (error?.response?.status === 401) {
      throw new Error(error?.response?.data?.detail || "Invalid credentials")
    }

    throw new Error("Login failed. Please try again.")
  }
}

// Register: Create a new user
export const register = async (data: {
  username: string
  email: string
  password: string
}): Promise<any> => {
  try {
    // ✅ Corrected the endpoint path
    const response = await axios.post(`${API_BASE}/api/users/register/`, data)
    return response.data
  } catch (error: any) {
    console.error("Registration error:", error.response?.data)

    // Flatten validation errors if present
    if (error?.response?.data?.errors) {
      const messages = Array.isArray(error.response.data.errors)
        ? error.response.data.errors.join(", ")
        : error.response.data.errors
      throw new Error(messages || "Registration failed")
    }

    throw new Error(error?.response?.data?.detail || "Registration failed")
  }
}

// Fetch user profile by token
export const fetchUser = async (token: string): Promise<User> => {
  try {
    const response = await axios.get(`${API_BASE}/api/users/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    console.log("Fetch user response:", response.data)

    if (!response.data || !response.data.id) {
      throw new Error("Invalid user data")
    }

    return response.data
  } catch (error: any) {
    console.error("Fetch user API error:", error.response?.data)

    const detail = error?.response?.data?.detail || ""
    if (
      error?.response?.status === 401 &&
      (detail.includes("token not valid") ||
        detail.includes("token has expired") ||
        detail.includes("credentials were not provided"))
    ) {
      throw new TokenInvalidError(detail || "Token not valid")
    }

    throw new Error("Failed to fetch user")
  }
}

// Optional: Logout is a no-op unless you handle token revocation on the server
export async function logout(): Promise<void> {
  return Promise.resolve()
}

// Custom error for token issues
export class TokenInvalidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TokenInvalidError"
  }
}
