"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  login as apiLogin,
  register as apiRegister,
  fetchUser as fetchUserApi,
  TokenInvalidError,
} from "@/lib/api/auth"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

interface AuthContextProps {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (data: {
    username: string
    email: string
    password: string
    confirmPassword?: string
  }) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize with null to prevent hydration mismatch
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Ensure component is mounted before accessing localStorage
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadUser = async (token: string) => {
    try {
      const apiUser = await fetchUserApi(token) as any

      const mappedUser: User = {
        id: apiUser.id?.toString() || apiUser.pk?.toString() || "",
        username: apiUser.username || "",
        email: apiUser.email || "",
        avatar: apiUser.avatar_url || apiUser.avatar,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        roles: apiUser.roles || [],
        createdAt: apiUser.created_at || apiUser.date_joined || new Date().toISOString(),
        level: apiUser.level || 1,
        xp: apiUser.xp || 0,
        gold: apiUser.gold || 0,
        bio: apiUser.bio || "",
      }

      setUser(mappedUser)
      if (mounted && typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(mappedUser))
      }
      setToken(token)
    } catch (err) {
      if (err instanceof TokenInvalidError) {
        if (mounted && typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("user")
        }
        setUser(null)
        setToken(null)
        toast({
          title: "Session expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        router.push("/")
      } else {
        console.error("Error loading user:", err)
        setUser(null)
        setToken(null)
        if (mounted && typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("user")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async ({ username, password }: { username: string; password: string }) => {
    try {
      const res = await apiLogin(username, password)
      const { access } = res


      if (!access) {
        throw new Error("No access token received from server")
      }

      if (mounted && typeof window !== "undefined") {
        localStorage.setItem("access_token", access)
      }
      await loadUser(access)
    } catch (err: any) {
      console.error("Login error:", err)
      toast({
        title: "Login failed",
        description: err?.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
      throw err
    }
  }

  const register = async (data: {
    username: string
    email: string
    password: string
    confirmPassword?: string
  }) => {
    try {
      await apiRegister(data)
      await login({ username: data.username, password: data.password })
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
      throw err
    }
  }

  const logout = () => {
    if (mounted && typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
    }
    setUser(null)
    setToken(null)
    router.push("/")
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      if (mounted && typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updatedUser))
      }
    }
  }

  // Only run after component is mounted to prevent hydration mismatch
  useEffect(() => {
    if (!mounted) return

    const initializeAuth = async () => {
      try {
        if (typeof window === "undefined") {
          setIsLoading(false)
          return
        }

        const savedToken = localStorage.getItem("access_token")
        const savedUser = localStorage.getItem("user")

        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser)
            setUser(parsedUser)
            setToken(savedToken)
          } catch (parseError) {
            console.warn("Failed to parse saved user data:", parseError)
            localStorage.removeItem("user")
          }

          await loadUser(savedToken)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [mounted])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
