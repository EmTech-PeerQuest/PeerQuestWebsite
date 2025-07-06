"use client"

import { useState, useEffect } from "react"
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/ui/hero'
import { QuestBoard } from '@/components/quests/quest-board'
import { GuildHall } from '@/components/guilds/guild-hall'
import { About } from "@/components/about"
import { Footer } from '@/components/ui/footer'
import { ToastProvider } from '@/components/ui/toast'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext";
import { AIChatbot } from '@/components/ai/ai-chatbot';
import { AuthModal } from '@/components/auth/auth-modal';
import { useRouter } from 'next/navigation';
import { IntegratedProfile } from '@/components/profile/integrated-profile';
import { Settings } from '@/components/settings/settings';
import Spinner from '@/components/ui/spinner';
import LoadingModal from '@/components/ui/loading-modal';

import type { User, Quest, Guild, GuildApplication } from "@/lib/types"
import { fetchInitialData } from '@/lib/api/init-data'
import { Profile } from '@/components/auth/profile'
import { UserSearch } from "@/components/user-search"
import { MessagingSystem } from '@/components/messaging/messaging-system'
import { QuestManagement } from '@/components/quests/quest-management'
import { EnhancedGuildManagement } from '@/components/guilds/enhanced-guild-management'
import { AdminPanel } from '@/components/admin/admin-panel'
import { AIChatbot } from '@/components/ai/ai-chatbot'
import type { User, Quest, Guild, GuildApplication, CreateGuildData } from "@/lib/types"
import { mockUsers, mockQuests, mockGuilds } from "@/lib/mock-data"
import { authService } from "@/lib/auth-service"
import { addSpendingRecord } from "@/lib/spending-utils"
import { useGuilds, useGuildActions } from "@/hooks/useGuilds"

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
  const [guildApplications, setGuildApplications] = useState<GuildApplication[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Use guild hooks for backend integration
  const { guilds, loading: guildsLoading, error: guildsError, refetch: refetchGuilds } = useGuilds({ autoFetch: true })
  const { createGuild, joinGuild, loading: guildActionLoading, error: guildActionError } = useGuildActions()

  // Expose modal functions to window
  const [activeSection, setActiveSection] = useState<string>("home");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildApplications, setGuildApplications] = useState<GuildApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, login, register, logout } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const router = useRouter();

  // Ensure home section is shown after logout
  useEffect(() => {
    if (!currentUser) {
      setActiveSection("home");
    }
  }, [currentUser]);

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

  const handleGuildSubmit = async (guildData: any) => {
    if (!currentUser) return

    try {
      // Deduct gold from user for guild creation and add spending record
      if (guildData.guildCreationCost) {
        const updatedUser = addSpendingRecord(
          currentUser,
          guildData.guildCreationCost,
          "guild_creation",
          `Created guild: ${guildData.name}`,
        )
        setCurrentUser({ ...updatedUser, gold: (updatedUser.gold || 0) - guildData.guildCreationCost })
      }

      // Create guild data for API
      const createGuildData: CreateGuildData = {
        name: guildData.name || "Untitled Guild",
        description: guildData.description || "",
        specialization: guildData.specialization || "general",
        preset_emblem: guildData.emblem || "🏆",
        privacy: guildData.privacy || "public",
        welcome_message: guildData.welcomeMessage || "",
        tags: guildData.tags || [],
        custom_emblem: guildData.useCustomEmblem ? guildData.customEmblemFile : null,
        require_approval: guildData.requireApproval !== false,
        minimum_level: guildData.minimumLevel || 1,
        allow_discovery: guildData.allowDiscovery !== false,
        show_on_home_page: guildData.showOnHomePage !== false,
        who_can_post_quests: guildData.whoCanPost || 'all_members',
        who_can_invite_members: guildData.whoCanInvite || 'all_members',
        social_links: guildData.socialLinks || [],
      }

      await createGuild(createGuildData)
      await refetchGuilds() // Refresh the guild list
      setShowCreateGuildModal(false)
      showToast(`Guild created successfully!`, "success")
    } catch (error) {
      console.error('Error creating guild:', error)
      showToast('Failed to create guild. Please try again.', "error")
    }
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

  const handleApplyForGuild = async (guildId: number, message: string) => {
    if (!currentUser) {
      showToast("Please log in to apply for guilds", "error")
      setShowAuthModal(true)
      return
    }

    try {
      await joinGuild(guildId.toString(), message)
      await refetchGuilds() // Refresh the guild list to show updated membership
      showToast("Guild application submitted successfully!", "success")
    } catch (error) {
      console.error('Error applying for guild:', error)
      showToast('Failed to apply for guild. Please try again.', "error")
    }
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
    let isMounted = true;
    setLoading(true);
    fetchInitialData()
      .then((data) => {
        if (!isMounted) return;
        setQuests(data?.quests || []);
        setGuilds(data?.guilds || []);
        setGuildApplications(data?.guildApplications || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setQuests([]);
        setGuilds([]);
        setGuildApplications([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Only allow navigation to protected sections if currentUser exists
  const handleSectionChange = (section: string) => {
    const protectedSections = [
      "profile", "settings", "messages", "quest-management", "guild-management", "admin"
    ];
    if (protectedSections.includes(section)) {
      if (!currentUser) {
        toast({ title: "Login Required", description: "Please sign in with Google to access this section.", variant: "destructive" });
        return;
      }
    }
    setActiveSection(section);
  };

  // Memoize data loaded state for each section
  const questsLoaded = quests.length > 0 || !loading;
  const guildsLoaded = guilds.length > 0 || !loading;

  // Only show loading modal for initial data load (not after login/register)
  const showInitialLoading = loading && !currentUser;

  return (
    <ToastProvider>
      {showInitialLoading && <LoadingModal message="Loading your adventure..." />}
      <main className="min-h-screen bg-[#F4F0E6]">
        <Navbar
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          handleLogout={logout}
          openAuthModal={() => setShowAuthModal(true)}
          openGoldPurchaseModal={() => {}}
          openPostQuestModal={() => {}}
          openCreateGuildModal={() => {}}
        />

        {activeSection === "home" && (
          <Hero
            currentUser={currentUser}
            openAuthModal={() => setShowAuthModal(true)}
            openRegisterModal={() => setActiveSection("about")}
            navigateToSection={setActiveSection}
          />
        )}

        {activeSection === "quest-board" && (
          !questsLoaded ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner />
              <div className="mt-4 text-[#8B75AA] text-lg font-medium">Loading quests...</div>
            </div>
          ) : (
            <QuestBoard
              quests={quests}
              currentUser={currentUser}
              openQuestDetails={() => {}}
              openPostQuestModal={() => {}}
              openApplications={() => {}}
              openEditQuestModal={() => {}}
            />
          )
        )}

        {activeSection === "guild-hall" && (
          !guildsLoaded ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner />
              <div className="mt-4 text-[#8B75AA] text-lg font-medium">Loading guilds...</div>
            </div>
          ) : (
            <GuildHall
              guilds={guilds}
              currentUser={currentUser}
              openCreateGuildModal={() => {}}
              handleApplyForGuild={() => {}}
              showToast={() => {}}
            />
          )
        )}

        {activeSection === "search" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-[#8B75AA] text-lg font-medium">Search feature coming soon...</div>
          </div>
        )}

        {activeSection === "messages" && currentUser && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-[#8B75AA] text-lg font-medium">Messaging feature coming soon...</div>
          </div>
        )}

        {activeSection === "quest-management" && currentUser && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-[#8B75AA] text-lg font-medium">Quest management feature coming soon...</div>
          </div>
        )}

        {activeSection === "guild-management" && currentUser && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-[#8B75AA] text-lg font-medium">Guild management feature coming soon...</div>
          </div>
        )}

        {activeSection === "admin" && currentUser?.roles?.includes("admin") && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-[#8B75AA] text-lg font-medium">Admin panel feature coming soon...</div>
          </div>
        )}

        {activeSection === "about" && <About />}

        {activeSection === "profile" && currentUser && (
          <IntegratedProfile
            currentUser={currentUser}
            quests={quests}
            guilds={guilds}
          />
        )}

        {activeSection === "settings" && currentUser && (
          <Settings />
        )}

        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            mode={authMode}
            setMode={setAuthMode}
            onClose={() => setShowAuthModal(false)}
            onLogin={async (credentials) => {
              try {
                await login(credentials);
                setShowAuthModal(false);
                // No redirect, stay on homepage
              } catch (error) {
                // Don't close modal on login failure - let the modal handle the error
                // Re-throw the error so the modal can handle it
                throw error;
              }
            }}
            onRegister={async (data) => {
              try {
                await register(data);
                // Close modal after successful registration
                setShowAuthModal(false);
                // The AuthContext will handle the redirect to the success page
              } catch (error) {
                // Don't close modal on register failure - let the modal handle the error
                throw error;
              }
            }}
          />
        )}

        <AIChatbot currentUser={currentUser} />

        <Footer />
      </main>
    </ToastProvider>
  )
}