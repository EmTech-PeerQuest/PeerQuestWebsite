import type { User } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

class AuthService {
  private tokenKey = 'access_token'
  private userKey = 'user'

  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.tokenKey)
  }

  // Get stored user
  getUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem(this.userKey)
    return userStr ? JSON.parse(userStr) : null
  }

  // Store auth data
  private setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authResponse.token)
    localStorage.setItem(this.userKey, JSON.stringify(authResponse.user))
  }

  // Clear auth data
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const authResponse: AuthResponse = await response.json()
    this.setAuthData(authResponse)
    return authResponse
  }

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const authResponse: AuthResponse = await response.json()
    this.setAuthData(authResponse)
    return authResponse
  }

  // Logout
  async logout(): Promise<void> {
    const token = this.getToken()
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/users/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        })
      } catch (error) {
        console.error('Logout request failed:', error)
      }
    }

    this.clearAuthData()
  }

  // Get current user from API
  async getCurrentUser(): Promise<User> {
    const token = this.getToken()
    
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      headers: {
        'Authorization': `Token ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuthData()
        throw new Error('Session expired')
      }
      throw new Error('Failed to fetch user')
    }

    const user: User = await response.json()
    localStorage.setItem(this.userKey, JSON.stringify(user))
    return user
  }
}

export const authService = new AuthService()
