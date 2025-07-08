import type { User } from "./types"

// Mock users for demo purposes
const mockUsers = [
  {
    id: 1,
    username: "HeroicAdventurer",
    displayName: "HeroicAdventurer",
    email: "hero@example.com",
    password: "password123",
    avatar: "H",
    bio: "Experienced adventurer looking for challenging quests.",
    level: 10,
    xp: 5600,
    gold: 1200,
    completedQuests: 1,
    createdQuests: 0,
    guilds: ["Mystic Brewers Guild", "Tavern Defenders", "Creative Crafters"],
    roles: ["user"],
    createdAt: new Date("2023-01-15"),
    settings: {
      theme: "dark",
      language: "English",
      privacy: {
        showEmail: false,
        showBirthday: false,
        showGender: false,
      },
      notifications: {
        newQuests: true,
        questApplications: true,
        guildAnnouncements: true,
        directMessages: true,
        newsletter: false,
      },
      security: {
        twoFactorEnabled: false,
        twoFactorMethod: "email",
        backupCodesGenerated: false,
      },
    },
  },
  {
    id: 2,
    username: "TavernKeeper",
    displayName: "Tavern Keeper",
    email: "admin@example.com",
    password: "admin123",
    avatar: "T",
    bio: "Keeper of the PeerQuest Tavern. Administrator and moderator.",
    level: 50,
    xp: 25000,
    gold: 5000,
    completedQuests: 25,
    createdQuests: 15,
    guilds: ["Tavern Defenders"],
    roles: ["user", "admin"],
    createdAt: new Date("2022-10-01"),
    settings: {
      theme: "dark",
      language: "English",
      privacy: {
        showEmail: true,
        showBirthday: false,
        showGender: true,
      },
      notifications: {
        newQuests: true,
        questApplications: true,
        guildAnnouncements: true,
        directMessages: true,
        newsletter: true,
      },
      security: {
        twoFactorEnabled: true,
        twoFactorMethod: "authenticator",
        backupCodesGenerated: true,
      },
    },
  },
]

class AuthService {
  private currentUser: User | null = null

  constructor() {
    // Only access localStorage in the browser environment
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser)
        } catch (error) {
          console.error("Failed to parse stored user:", error)
          localStorage.removeItem("currentUser")
        }
      }
    }
  }

  async login(email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = mockUsers.find((u) => u.email === email && u.password === password)
    if (!user) {
      throw new Error("Invalid email or password")
    }

    // Don't include password in the returned user object
    const { password: _, ...userWithoutPassword } = user
    this.currentUser = userWithoutPassword as User

    // Generate a mock auth token based on user ID and timestamp
    const authToken = `mock_token_${user.id}_${Date.now()}`

    // Only access localStorage in the browser environment
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
      localStorage.setItem("authToken", authToken)
    }

    return this.currentUser
  }

  async register(username: string, email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check if user already exists
    if (mockUsers.some((u) => u.email === email)) {
      throw new Error("Email already in use")
    }

    // Create new user
    const newUser = {
      id: mockUsers.length + 1,
      username,
      displayName: username,
      email,
      password, // In a real app, this would be hashed
      avatar: username.charAt(0).toUpperCase(),
      bio: "",
      level: 1,
      xp: 0,
      gold: 100,
      completedQuests: 0,
      createdQuests: 0,
      guilds: [],
      roles: ["user"],
      createdAt: new Date(),
      settings: {
        theme: "dark",
        language: "English",
        privacy: {
          showEmail: false,
          showBirthday: false,
          showGender: false,
        },
        notifications: {
          newQuests: true,
          questApplications: true,
          guildAnnouncements: true,
          directMessages: true,
          newsletter: false,
        },
        security: {
          twoFactorEnabled: false,
          twoFactorMethod: "email",
          backupCodesGenerated: false,
        },
      },
    }

    mockUsers.push(newUser)

    // Don't include password in the returned user object
    const { password: _, ...userWithoutPassword } = newUser
    this.currentUser = userWithoutPassword as User

    // Generate a mock auth token based on user ID and timestamp
    const authToken = `mock_token_${newUser.id}_${Date.now()}`

    // Only access localStorage in the browser environment
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
      localStorage.setItem("authToken", authToken)
    }

    return this.currentUser
  }

  async forgotPassword(email: string): Promise<void> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = mockUsers.find((u) => u.email === email)
    if (!user) {
      throw new Error("No account found with this email")
    }

    // In a real app, this would send a password reset email
    console.log(`Password reset requested for ${email}`)
  }

  logout(): void {
    this.currentUser = null

    // Only access localStorage in the browser environment
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
      localStorage.removeItem("authToken") // Clear auth token on logout
      sessionStorage.removeItem("authToken") // Also clear from session storage
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100))
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return !!this.currentUser
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles?.includes(role) || false
  }
}

export const authService = new AuthService()
