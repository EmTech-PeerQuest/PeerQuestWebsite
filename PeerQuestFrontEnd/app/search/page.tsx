"use client"

import { useState, useEffect } from "react"
import { UserSearch } from "@/components/search/user-search"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useUserInfo } from "@/hooks/use-api-request"
import { userSearchApi } from "@/lib/api"
import type { User, Quest, Guild } from "@/lib/types"

export default function SearchPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fetchUserInfo } = useUserInfo()

  const showToast = (message: string, type?: string) => {
    // You can integrate with your existing toast system here
    if (type === "error") {
      alert(`Error: ${message}`)
    } else {
      alert(message)
    }
  }

  // Transform backend user data to match frontend User type
  const transformUserData = (backendUser: any): User => {
    return {
      id: backendUser.id,
      username: backendUser.username,
      displayName: backendUser.display_name || backendUser.username,
      email: backendUser.email,
      avatar: backendUser.avatar_url ? backendUser.avatar_url : "👤",
      level: backendUser.level || 1,
      xp: backendUser.experience_points || 0,
      bio: backendUser.bio || "",
      completedQuests: 0, // This would need to be calculated from quests
      skills: backendUser.user_skills ? backendUser.user_skills.map((skill: any) => skill.skill_name) : [],
      guilds: [], // This would need to be fetched from guilds API
      badges: [], // This would need to be fetched from achievements
      location: backendUser.location || "",
      birthday: backendUser.birthday || "",
      socialLinks: backendUser.social_links || {}
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Load current user info
        const userData = await fetchUserInfo()
        if (userData) {
          setCurrentUser(userData)
        }
        
        // Load all users for search
        const usersResponse = await userSearchApi.getAllUsers()
        if (usersResponse.success && usersResponse.results) {
          const transformedUsers = usersResponse.results.map(transformUserData)
          setUsers(transformedUsers)
        } else {
          setError("Failed to load users")
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Failed to load data")
        // Keep empty arrays - no fallback to mock data
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fetchUserInfo])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B75AA] mx-auto mb-4"></div>
          <p className="text-[#2C1A1D]">Loading adventurers...</p>
        </div>
      </div>
    )
  }

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#2C1A1D] mb-2">Failed to Load Users</h2>
          <p className="text-[#8B75AA] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F0E6]">
      <UserSearch
        users={users}
        quests={quests}
        guilds={guilds}
        currentUser={currentUser}
        showToast={showToast}
      />
    </div>
  )
}
