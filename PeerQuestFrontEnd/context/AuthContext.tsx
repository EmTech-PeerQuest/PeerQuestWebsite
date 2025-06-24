'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { loginWithGoogle as apiLoginWithGoogle, logoutUser as apiLogoutUser } from '@/lib/api/auth'

interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  is_verified: boolean
  // Add other user fields as needed
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (code: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
        if (storedToken) {
          // Verify token and get user data
          const response = await axios.get('/api/auth/user/', {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          })
          setUser(response.data)
          setToken(storedToken)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        clearAuth()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const clearAuth = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const setAuth = (newToken: string, rememberMe: boolean = false) => {
    setToken(newToken)
    if (rememberMe) {
      localStorage.setItem('token', newToken)
    } else {
      sessionStorage.setItem('token', newToken)
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/auth/login/', { email, password })
      setUser(response.data.user)
      setAuth(response.data.access, rememberMe)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (code: string, rememberMe: boolean = false) => {
    setIsLoading(true)
    try {
      const { user, access } = await apiLoginWithGoogle(code)
      setUser(user)
      setAuth(access, rememberMe)
      router.push('/dashboard')
    } catch (error) {
      console.error('Google login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await apiLogoutUser()
      clearAuth()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh/', {
        refresh: localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
      })
      setAuth(response.data.access)
      return response.data.access
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  // Add axios response interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            const newToken = await refreshToken()
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`
            return axios(originalRequest)
          } catch (refreshError) {
            clearAuth()
            router.push('/login')
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}