"use client"

import { useState, useEffect } from "react"
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/ui/hero'
import { QuestBoard } from '@/components/quests/quest-board'
import { GuildHall } from '@/components/guilds/guild-hall'
import { Settings } from '@/components/settings/settings'
import { About } from "@/components/about"
import { AuthModal } from '@/components/auth/auth-modal'
import { PostQuestModal } from '@/components/quests/post-quest-modal'
import { EnhancedCreateGuildModal } from '@/components/guilds/enhanced-create-guild-modal'
import { QuestDetailsModal } from '@/components/quests/quest-details-modal'
import { ApplicationsModal } from '@/components/modals/applications-modal'
import { EditQuestModal } from '@/components/guilds/edit-quest-modal'
import { GoldSystemModal } from '@/components/gold/gold-system-modal'
import { Toast } from '@/components/ui/toast'
import { Footer } from '@/components/ui/footer'
import { Profile } from '@/components/auth/profile'
import { UserSearch } from "@/components/user-search"
import { MessagingSystem } from '@/components/messaging/messaging-system'
import { QuestManagement } from '@/components/quests/quest-management'
import { EnhancedGuildManagement } from '@/components/guilds/enhanced-guild-management'
import { AdminPanel } from '@/components/admin/admin-panel'
import { AIChatbot } from '@/components/ai/ai-chatbot'
import type { User, Quest, Guild, GuildApplication } from "@/lib/types"
import { mockUsers, mockQuests, mockGuilds } from "@/lib/mock-data"
import { authService } from "@/lib/auth-service"
import { addSpendingRecord } from "@/lib/spending-utils"

declare global {
  interface Window {
    openPostQuestModal?: () => void
    openCreateGuildModal?: () => void
    openGoldPurchaseModal?: () => void
    openAuthModal?: () => void
    showToast?: (message: string, type?: string) => void
    updateCompletedQuests?: (quest: Quest) => void
    joinGuildTest?: (userId: number, guildName: string) => void
  }
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home")
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login")
  const [showPostQuestModal, setShowPostQuestModal] = useState<boolean>(false)
  const [showCreateGuildModal, setShowCreateGuildModal] = useState<boolean>(false)
  const [showQuestDetailsModal, setShowQuestDetailsModal] = useState<boolean>(false)
  const [showApplicationsModal, setShowApplicationsModal] = useState<boolean>(false)
  const [showEditQuestModal, setShowEditQuestModal] = useState<boolean>(false)
  const [showGoldPurchaseModal, setShowGoldPurchaseModal] = useState<boolean>(false)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers || [])
  const [quests, setQuests] = useState<Quest[]>(mockQuests || [])
  const [guilds, setGuilds] = useState<Guild[]>(mockGuilds || [])
  const [guildApplications, setGuildApplications] = useState<GuildApplication[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Expose modal functions to window
  useEffect(() => {
    window.openPostQuestModal = () => setShowPostQuestModal(true)
    window.openCreateGuildModal = () => setShowCreateGuildModal(true)
    window.openGoldPurchaseModal = () => setShowGoldPurchaseModal(true)
    window.openAuthModal = () => {
      setAuthMode("login")
      setShowAuthModal(true)
    }
    window.showToast = showToast

    return () => {
      // Clean up
      window.openPostQuestModal = undefined
      window.openCreateGuildModal = undefined
      window.openGoldPurchaseModal = undefined
      window.openAuthModal = undefined
      window.showToast = undefined
    }
  }, [])

  // Check for existing login
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          setCurrentUser(user)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true)
      const user = await authService.login(credentials.email, credentials.password)
      setCurrentUser(user)
      setShowAuthModal(false)
      showToast("Welcome back to the PeerQuest Tavern!", "success")
    } catch (error: any) {
      showToast(error.message || "Login failed. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (userData: {
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    try {
      setIsLoading(true)
      const user = await authService.register(userData.username, userData.email, userData.password)
      setCurrentUser(user)
      setShowAuthModal(false)
      showToast("Welcome to the PeerQuest Tavern! Your account has been created.", "success")
    } catch (error: any) {
      showToast(error.message || "Registration failed. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (email: string) => {
    try {
      setIsLoading(true)
      await authService.forgotPassword(email)
      showToast("Password reset instructions have been sent to your email.", "success")
      setAuthMode("login")
    } catch (error: any) {
      showToast(error.message || "Failed to send reset instructions. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setActiveSection("home")
    showToast("You have been logged out.", "info")
  }

  const showToast = (message: string, type = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const handleQuestSubmit = (questData: Partial<Quest> & { questCost?: number }) => {
    if (!currentUser) return

    // Deduct gold from user for quest reward and add spending record
    if (questData.questCost) {
      const updatedUser = addSpendingRecord(
        currentUser,
        questData.questCost,
        "quest_posting",
        `Posted quest: ${questData.title}`,
      )
      setCurrentUser({ ...updatedUser, gold: updatedUser.gold - questData.questCost })
    }

    const newQuest: Quest = {
      id: Date.now(),
      title: questData.title || "Untitled Quest",
      description: questData.description || "",
      category: questData.category || "misc",
      difficulty: questData.difficulty || "medium",
      reward: questData.reward || 100,
      xp: questData.xp || 50,
      status: "open",
      poster: currentUser,
      createdAt: new Date(),
      deadline: questData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      applicants: [],
      isGuildQuest: questData.isGuildQuest || false,
      guildId: questData.guildId,
      guildReward: questData.guildReward || 0,
    }

    setQuests([newQuest, ...quests])
    setShowPostQuestModal(false)
    showToast(`Quest posted! ${questData.questCost} gold deducted for reward pool.`, "success")
  }

  const handleGuildSubmit = (guildData: Partial<Guild> & { guildCreationCost?: number }) => {
    if (!currentUser) return

    // Deduct gold from user for guild creation and add spending record
    if (guildData.guildCreationCost) {
      const updatedUser = addSpendingRecord(
        currentUser,
        guildData.guildCreationCost,
        "guild_creation",
        `Created guild: ${guildData.name}`,
      )
      setCurrentUser({ ...updatedUser, gold: updatedUser.gold - guildData.guildCreationCost })
    }

    const newGuild: Guild = {
      id: Date.now(),
      name: guildData.name || "Untitled Guild",
      description: guildData.description || "",
      emblem: guildData.emblem || "🏆",
      specialization: guildData.specialization || "general",
      category: guildData.category || "Other",
      members: 1,
      membersList: [currentUser.id],
      poster: currentUser,
      admins: [currentUser.id],
      createdAt: new Date(),
      applications: [],
      funds: 0,
      settings: {
        joinRequirements: {
          manualApproval: true,
          minimumLevel: 1,
          requiresApplication: true,
        },
        visibility: {
          publiclyVisible: true,
          showOnHomePage: true,
          allowDiscovery: true,
        },
        permissions: {
          whoCanPost: "members",
          whoCanInvite: "members",
          whoCanKick: "admins",
        },
      },
      roles: [],
      socialLinks: [],
    }

    setGuilds([newGuild, ...guilds])
    setShowCreateGuildModal(false)
    showToast(`Guild created! ${guildData.guildCreationCost} gold deducted for guild registration.`, "success")
  }

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest)
    setShowQuestDetailsModal(true)
  }

  const handleEditQuest = (quest: Quest) => {
    setSelectedQuest(quest)
    setShowEditQuestModal(true)
  }

  const handleQuestSave = (updatedQuest: Quest) => {
    setQuests((prevQuests) => prevQuests.map((quest) => (quest.id === updatedQuest.id ? updatedQuest : quest)))
    setShowEditQuestModal(false)
  }

  const handleApplyForGuild = (guildId: number, message: string) => {
    if (!currentUser) {
      showToast("Please log in to apply for guilds", "error")
      setShowAuthModal(true)
      return
    }

    const newApplication: GuildApplication = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      message,
      status: "pending",
      appliedAt: new Date(),
    }

    // Add application to guild
    setGuilds((prevGuilds) =>
      prevGuilds.map((guild) => {
        if (guild.id === guildId) {
          return {
            ...guild,
            applications: [...(guild.applications || []), newApplication],
          }
        }
        return guild
      }),
    )

    setGuildApplications([...guildApplications, newApplication])
    showToast("Guild application submitted successfully!", "success")
  }

  const handleGoldPurchase = (amount: number) => {
    if (!currentUser) return

    const updatedUser = {
      ...currentUser,
      gold: (currentUser.gold || 0) + amount,
    }

    setCurrentUser(updatedUser)
    setShowGoldPurchaseModal(false)
    showToast(`Successfully purchased ${amount} gold!`, "success")
  }

  const handleQuestCompletion = (questId: number) => {
    const quest = quests.find((q) => q.id === questId)
    if (!quest || !currentUser) return

    // Update quest status
    setQuests((prevQuests) =>
      prevQuests.map((q) =>
        q.id === questId
          ? {
              ...q,
              status: "completed" as const,
              completedAt: new Date(),
            }
          : q,
      ),
    )

    // Handle guild quest rewards
    if (quest.isGuildQuest && quest.guildId && quest.guildReward) {
      setGuilds((prevGuilds) =>
        prevGuilds.map((guild) => {
          if (guild.id === quest.guildId) {
            return {
              ...guild,
              funds: (guild.funds || 0) + quest.guildReward!,
            }
          }
          return guild
        }),
      )

      showToast(
        `Quest completed! ${quest.reward} gold earned and ${quest.guildReward} gold added to guild funds!`,
        "success",
      )
    } else {
      showToast(`Quest completed! ${quest.reward} gold earned!`, "success")
    }

    // Update user gold and XP
    setCurrentUser((prevUser) => {
      if (!prevUser) return null
      return {
        ...prevUser,
        gold: prevUser.gold + quest.reward,
        xp: prevUser.xp + quest.xp,
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#F4F0E6]">
      <Navbar
        currentUser={currentUser}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        openAuthModal={() => {
          setAuthMode("login")
          setShowAuthModal(true)
        }}
        openGoldPurchaseModal={() => setShowGoldPurchaseModal(true)}
        openPostQuestModal={() => setShowPostQuestModal(true)}
        openCreateGuildModal={() => setShowCreateGuildModal(true)}
      />

      {activeSection === "home" && (
        <Hero
          currentUser={currentUser}
          openAuthModal={() => {
            setAuthMode("login")
            setShowAuthModal(true)
          }}
          openRegisterModal={() => {
            setAuthMode("register")
            setShowAuthModal(true)
          }}
          navigateToSection={setActiveSection}
        />
      )}

      {activeSection === "quest-board" && (
        <QuestBoard
          quests={quests}
          currentUser={currentUser}
          openQuestDetails={handleQuestClick}
          openPostQuestModal={() => setShowPostQuestModal(true)}
          openApplications={(quest) => {
            setSelectedQuest(quest)
            setShowApplicationsModal(true)
          }}
          openEditQuestModal={handleEditQuest}
        />
      )}

      {activeSection === "guild-hall" && (
        <GuildHall
          guilds={guilds}
          currentUser={currentUser}
          openCreateGuildModal={() => setShowCreateGuildModal(true)}
          handleApplyForGuild={handleApplyForGuild}
          showToast={showToast}
        />
      )}

      {activeSection === "profile" && currentUser && (
        <Profile currentUser={currentUser} quests={quests} guilds={guilds} navigateToSection={setActiveSection} />
      )}

      {activeSection === "guilds" && <div>{/* Placeholder for guilds section */}</div>}

      {activeSection === "settings" && currentUser && (
        <Settings
          user={currentUser}
          updateSettings={(updatedUser) => setCurrentUser({ ...currentUser, ...updatedUser })}
          showToast={showToast}
        />
      )}

      {activeSection === "about" && <About />}

      {activeSection === "search" && (
        <UserSearch users={users} quests={quests} guilds={guilds} currentUser={currentUser} showToast={showToast} />
      )}

      {activeSection === "messages" && currentUser && (
        <MessagingSystem currentUser={currentUser} showToast={showToast} />
      )}

      {activeSection === "quest-management" && currentUser && (
        <QuestManagement
          quests={quests}
          currentUser={currentUser}
          onQuestStatusChange={(questId, newStatus) => {
            if (newStatus === "completed") {
              handleQuestCompletion(questId)
            } else {
              const updatedQuests = quests.map((q) => (q.id === questId ? { ...q, status: newStatus } : q))
              setQuests(updatedQuests)
              showToast(`Quest status updated to ${newStatus}`, "success")
            }
          }}
          setQuests={setQuests}
          showToast={showToast}
        />
      )}

      {activeSection === "guild-management" && currentUser && (
        <EnhancedGuildManagement
          guilds={guilds}
          guildApplications={guildApplications}
          currentUser={currentUser}
          showToast={showToast}
          onViewGuild={(guild) => {
            showToast(`Viewing guild: ${guild.name}`, "info")
          }}
          onEditGuild={(guild) => {
            showToast(`Editing guild: ${guild.name}`, "info")
          }}
          onDeleteGuild={(guildId) => {
            setGuilds(guilds.filter((g) => g.id !== Number.parseInt(guildId)))
            showToast("Guild deleted successfully", "success")
          }}
          onApproveApplication={(applicationId) => {
            const application = guildApplications.find((app) => app.id.toString() === applicationId)
            if (application) {
              const updatedApplications = guildApplications.map((app) =>
                app.id.toString() === applicationId ? { ...app, status: "accepted" as const } : app,
              )
              setGuildApplications(updatedApplications)

              const updatedGuilds = guilds.map((guild) => ({
                ...guild,
                applications: guild.applications.map((app) =>
                  app.id.toString() === applicationId ? { ...app, status: "accepted" as const } : app,
                ),
              }))
              setGuilds(updatedGuilds)

              showToast("Application approved", "success")
            }
          }}
          onRejectApplication={(applicationId) => {
            const updatedApplications = guildApplications.map((app) =>
              app.id.toString() === applicationId ? { ...app, status: "rejected" as const } : app,
            )
            setGuildApplications(updatedApplications)

            const updatedGuilds = guilds.map((guild) => ({
              ...guild,
              applications: guild.applications.map((app) =>
                app.id.toString() === applicationId ? { ...app, status: "rejected" as const } : app,
              ),
            }))
            setGuilds(updatedGuilds)

            showToast("Application rejected", "success")
          }}
          onManageMembers={(guild) => {
            showToast(`Managing members for guild: ${guild.name}`, "info")
          }}
        />
      )}

      {activeSection === "admin" && currentUser && currentUser.roles && currentUser.roles.includes("admin") && (
        <AdminPanel
          currentUser={currentUser}
          users={users}
          quests={quests}
          guilds={guilds}
          setUsers={setUsers}
          setQuests={setQuests}
          setGuilds={setGuilds}
          showToast={showToast}
        />
      )}

      {/* AI Chatbot */}
      <AIChatbot currentUser={currentUser} />

      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onForgotPassword={handleForgotPassword}
      />

      <PostQuestModal
        isOpen={showPostQuestModal}
        onClose={() => setShowPostQuestModal(false)}
        currentUser={currentUser}
        onSubmit={handleQuestSubmit}
        guilds={guilds}
      />

      <EnhancedCreateGuildModal
        isOpen={showCreateGuildModal}
        onClose={() => setShowCreateGuildModal(false)}
        currentUser={currentUser}
        onSubmit={handleGuildSubmit}
        showToast={showToast}
      />

      {selectedQuest && (
        <QuestDetailsModal
          isOpen={showQuestDetailsModal}
          onClose={() => setShowQuestDetailsModal(false)}
          quest={selectedQuest}
          currentUser={currentUser}
          isAuthenticated={!!currentUser}
          setQuests={setQuests}
          showToast={showToast}
          setAuthModalOpen={setShowAuthModal}
          openEditQuestModal={handleEditQuest}
        />
      )}

      <ApplicationsModal
        isOpen={showApplicationsModal}
        onClose={() => setShowApplicationsModal(false)}
        quests={quests}
        currentUser={currentUser}
        setQuests={setQuests}
      />

      <EditQuestModal
        isOpen={showEditQuestModal}
        onClose={() => setShowEditQuestModal(false)}
        quest={selectedQuest}
        onSave={handleQuestSave}
        showToast={showToast}
      />

      <GoldSystemModal
        isOpen={showGoldPurchaseModal}
        onClose={() => setShowGoldPurchaseModal(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        showToast={showToast}
      />

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}
