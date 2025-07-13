"use client"

import { useState, useEffect } from "react"
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/ui/hero'
import { QuestBoard } from '@/components/quests/quest-board-clean'
import { QuestManagement } from '@/components/quests/quest-management'
import { GuildHall } from '@/components/guilds/guild-hall'
import { UserSearch } from '@/components/search/user-search'
import MessagingSystem from '@/components/messaging/messaging-system'
import { EnhancedGuildManagement } from '@/components/guilds/enhanced-guild-management'
import { Footer } from '@/components/ui/footer'
import { ToastProvider } from '@/components/ui/toast'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import { useGoldBalance } from "@/context/GoldBalanceContext"
import { AIChatbot } from '@/components/ai/ai-chatbot'
import { AuthModal } from '@/components/auth/auth-modal'
import { Settings } from '@/components/settings/settings'
import { GoldSystemModal } from '@/components/gold/gold-system-modal'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/spinner'
import LoadingModal from '@/components/ui/loading-modal'
import IntegratedProfile from '@/components/profile/integrated-profile'
import type { User, Quest, Guild, GuildJoinRequest, CreateGuildData } from "@/lib/types"
import { fetchInitialData } from '@/lib/api/init-data'
import { SimpleGuildManagement } from '@/components/guilds/simple-guild-management'
import { GuildOverviewModal } from '@/components/guilds/guild-overview-modal'
import { EnhancedCreateGuildModal } from '@/components/guilds/enhanced-create-guild-modal'
import { addSpendingRecord } from "@/lib/spending-utils"
import { useGuilds, useGuildActions } from "@/hooks/useGuilds"
import { userSearchApi } from '@/lib/api'
import dynamic from 'next/dynamic';

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
const AdminPanel = dynamic(() => import('@/components/admin/admin-panel').then(mod => mod.default), { ssr: false });

// Helper to check admin status (same logic as AdminPanel)
const isAdmin = (user: any) => {
  if (!user) return false;
  return Boolean(
    user.is_staff === true || user.is_staff === 'true' ||
    user.isSuperuser === true || user.isSuperuser === 'true' ||
    user.is_superuser === true || user.is_superuser === 'true'
  );
};

// Simple About component to fix missing reference and blank page
export function About() {
  const teamMembers = [
    {
      name: "Jenel Esteron",
      role: "API/Database",
      avatar: "J",
      portfolio: "https://github.com/https://jenelportfolio.netlify.app",
      linkedin: "https://linkedin.com/in/https://www.linkedin.com/in/jenel-esteron-83459b2a2/",
    },
    {
      name: "Amry Judith Gutlay",
      role: "Middleware/Frontend",
      avatar: "A",
      portfolio: "https://gutlay-portfolio.vercel.app/",
      linkedin: "https://www.linkedin.com/in/amry-judith-gutlay-9829962b3/",
    },
    {
      name: "Michael Liam San Diego",
      role: "API/Frontend",
      avatar: "ML",
      portfolio: "https://sandiego-portfolio.vercel.app",
      linkedin: "https://www.linkedin.com/in/michael-liam-san-diego-5a18b7287/",
    },
    {
      name: "Mark John Wayne Yabes",
      role: "API/Database",
      avatar: "MJ",
      portfolio: "https://markyabesportfolio.netlify.app/",
      linkedin: "https://www.linkedin.com/in/mark-yabes-602026253/",
    },
    {
      name: "Tristan Von Ceazar Yanoria",
      role: "Documentation/Frontend",
      avatar: "T",
      portfolio: "http://insantics.netlify.app/#about",
      linkedin: "https://www.linkedin.com/in/tristan-von-ceazar-yanoria-57b133302/",
    },
    {
      name: "John Odysseus Lim",
      role: "Documentation/Middleware",
      avatar: "J",
      portfolio: "https://odysseus-droid.github.io/limportfolio",
      linkedin: "https://www.linkedin.com/in/jhndyssslm/",
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-4xl font-bold text-center mb-4 font-medieval">About PeerQuest Tavern</h2>
      <p className="text-center max-w-3xl mx-auto mb-8 text-tavern-brown/80">
        Learn more about our platform and the team behind it.
      </p>

      <div className="card mb-8">
        <div className="p-10">
          <h3 className="text-3xl font-bold mb-6 font-medieval">Our Story</h3>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="mb-5 leading-relaxed">
                PeerQuest Tavern is a fantasy-themed peer learning platform where coding and collaboration become an
                epic adventure. Our mission is to transform the often solitary experience of learning to code into a
                collaborative and engaging journey.
              </p>
              <p className="mb-5 leading-relaxed">
                In the world of PeerQuest, you're not just a developer - you're an adventurer, taking on quests, earning
                experience, and joining guilds of like-minded peers. Whether you're a novice apprentice or a seasoned
                archmage of code, there's a place for you at our tavern.
              </p>
              <p className="leading-relaxed">
                What started as casual meetups to review each other's code soon evolved into a structured system of
                "quests" and "rewards" - and the fantasy theme made the process more engaging and fun.
              </p>
            </div>
            <div className="text-center">
              <div className="w-50 h-50 bg-tavern-bronze rounded-full flex items-center justify-center mx-auto text-8xl">
                🏰
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-10">
          <h3 className="text-3xl font-bold mb-8 font-medieval text-center">The Team</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center bg-white border border-[#CDAA7D] rounded-lg p-6">
                <div className="avatar avatar-xl mx-auto mb-4">{member.avatar}</div>
                <h4 className="text-xl font-bold mb-2 font-medieval">{member.name}</h4>
                <p className="text-tavern-brown/70 mb-4">{member.role}</p>
                <div className="flex justify-center gap-3">
                  <a
                    href={member.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#CDAA7D] text-[#2C1A1D] px-3 py-1 rounded text-sm font-medium hover:bg-[#B8941F] transition-colors"
                  >
                    Portfolio
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#8B75AA] text-white px-3 py-1 rounded text-sm font-medium hover:bg-[#7A6699] transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  // Main state
  const debugToken = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
  const [refreshQuestBoard, setRefreshQuestBoard] = useState(0); // Trigger refresh without remounting
  const { refreshBalance } = useGoldBalance(); // Add gold balance refresh capability
  const [showGoldSystemModal, setShowGoldSystemModal] = useState(false);
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
  const [users, setUsers] = useState<User[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [guildApplications, setGuildApplications] = useState<GuildJoinRequest[]>([])
  const [guildReports, setGuildReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  // Guild management state
  const [showDetailedGuildManagement, setShowDetailedGuildManagement] = useState<boolean>(false)
  const [managingGuild, setManagingGuild] = useState<Guild | null>(null)
  
  // Guild overview modal state
  const [showGuildOverviewModal, setShowGuildOverviewModal] = useState<boolean>(false)
  const [viewingGuild, setViewingGuild] = useState<Guild | null>(null)
  const [isViewingOwnedGuild, setIsViewingOwnedGuild] = useState<boolean>(false)

  // Auth and hooks
  const { user: currentUser, login, register, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Add global error handlers to catch any issues that might cause refresh
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global error caught:', event.error);
      event.preventDefault(); // Prevent default error handling that might cause refresh
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection caught:', event.reason);
      event.preventDefault(); // Prevent default rejection handling
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Global event listeners to debug page reloads
  useEffect(() => {
    const clickLogger = (e: Event) => {
      sessionStorage.setItem('globalClickLog', `Global click at ${new Date().toISOString()} on ${(e.target as HTMLElement)?.outerHTML}`);
    };
    const beforeUnloadLogger = (e: BeforeUnloadEvent) => {
      sessionStorage.setItem('beforeUnloadLog', `Page reload at ${new Date().toISOString()}`);
    };
    document.addEventListener('click', clickLogger, true);
    window.addEventListener('beforeunload', beforeUnloadLogger);
    return () => {
      document.removeEventListener('click', clickLogger, true);
      window.removeEventListener('beforeunload', beforeUnloadLogger);
    };
  }, []);

  // Use guild hooks for backend integration
  const { guilds: guildData, loading: guildsLoading, error: guildsError, refetch: refetchGuilds } = useGuilds({ autoFetch: true })
  const { createGuild, joinGuild, loading: guildActionLoading, error: guildActionError } = useGuildActions()

  // Ensure home section is shown after logout
  useEffect(() => {
    if (!currentUser) {
      setActiveSection("home");
    }
  }, [currentUser]);

  // Transform backend user data to match frontend User type
  const transformUserData = (backendUser: any): User => {
    // Prefer avatar, then avatar_url, then avatar_data (base64), fallback to default
    let avatar = backendUser.avatar || backendUser.avatar_url;
    // If avatar_data is present and looks like base64 image, use it
    if (!avatar && typeof backendUser.avatar_data === 'string' && backendUser.avatar_data.startsWith('data:')) {
      avatar = backendUser.avatar_data;
    }
    // If avatar is not a valid image URL or data, fallback to default
    if (typeof avatar !== 'string' || !(avatar.startsWith('http') || avatar.startsWith('data:'))) {
      avatar = '/default-avatar.png'; // Make sure this file exists in your public/ folder
    }
    return {
      id: backendUser.id,
      username: backendUser.username,
      displayName: backendUser.display_name || backendUser.username,
      email: backendUser.email,
      avatar,
      level: backendUser.level || 1,
      xp: backendUser.experience_points || 0,
      bio: backendUser.bio || "",
      completedQuests: 0, // This would need to be calculated from quests
      createdQuests: 0,
      joinedGuilds: 0,
      gold: backendUser.gold_balance || 0,
      skills: backendUser.user_skills ? backendUser.user_skills.map((skill: any) => skill.skill_name) : [],
      guilds: [], // This would need to be fetched from guilds API
      badges: [], // This would need to be fetched from achievements
      location: backendUser.location || "",
      birthday: backendUser.birthday || "",
      socialLinks: backendUser.social_links || {}
    }
  }

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true)
      // Convert email-based login to username-based for AuthContext
      await login({ username: credentials.email, password: credentials.password })
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
      await register(userData)
      setShowAuthModal(false)
      showToast("Welcome to the PeerQuest Tavern! Your account has been created.", "success")
    } catch (error: any) {
      showToast(error.message || "Registration failed. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout() // Use the AuthContext logout function
    setActiveSection("home")
    showToast("You have been logged out.", "info")
  }

  const showToast = (message: string, type = "info") => {
    toast({
      title: type === "success" ? "Success" : type === "error" ? "Error" : "Info",
      description: message,
      variant: type === "error" ? "destructive" : "default"
    })
  }

  const handleQuestSubmit = (questData: Partial<Quest> & { questCost?: number }) => {
    if (!currentUser) return;

    // Deduct gold from user for quest reward and add spending record
    if (questData.questCost) {
      addSpendingRecord(
        currentUser,
        questData.questCost,
        "reward",
        `Posted quest: ${questData.title}`,
      );
    }

    // Fallbacks for category/difficulty
    const defaultCategory = { id: 0, name: "misc", description: "Miscellaneous" };
    const allowedDifficulties = ["initiate", "adventurer", "champion", "mythic"];
    const difficulty = allowedDifficulties.includes(questData.difficulty as any)
      ? questData.difficulty
      : "initiate";

    const now = new Date();
    const newQuest: Quest = {
      id: Date.now(),
      title: questData.title || "Untitled Quest",
      description: questData.description || "",
      category: typeof questData.category === 'string' 
        ? { id: 1, name: questData.category } 
        : questData.category || { id: 1, name: "misc" },
      difficulty: questData.difficulty || "adventurer",
      status: "open",
      xp_reward: questData.xp || 50,
      gold_reward: questData.reward || 100,
      creator: {
        id: currentUser.id ? parseInt(currentUser.id) : 0,
        username: currentUser.username || currentUser.email || "Unknown",
        email: currentUser.email || "",
        level: currentUser.level || 1,
        xp: currentUser.xp || 0
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: questData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      slug: `quest-${Date.now()}`,
      participant_count: 0,
      applications_count: 0,
      can_accept_participants: true,
      is_completed: false,
      // Legacy fields for compatibility
      reward: questData.reward || 100,
      xp: questData.xp || 50,
      poster: currentUser,
      deadline: questData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      applicants: [],
      isGuildQuest: questData.isGuildQuest || false,
      guildId: questData.guildId,
      guildReward: questData.guildReward || 0,
    };

    setQuests([newQuest, ...quests]);
    setShowPostQuestModal(false);
    showToast(`Quest posted! ${questData.questCost} gold deducted for reward pool.`, "success");
  };

  const handleGuildSubmit = async (guildData: any) => {
    if (!currentUser) return;

    try {
      // Create guild data for API
      const createGuildData = {
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
      };

      await createGuild(createGuildData);
      await refetchGuilds(); // Refresh the guild list
      setShowCreateGuildModal(false);
      showToast(`Guild created successfully!`, "success");
    } catch (error) {
      console.error('Error creating guild:', error);
      showToast('Failed to create guild. Please try again.', "error");
    }
  };

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

  const handleApplyForGuild = async (guildId: string, message: string) => {
    if (!currentUser) {
      showToast("Please log in to apply for guilds", "error")
      setShowAuthModal(true)
      return
    }

    try {
      const result = await joinGuild(String(guildId), message)
      await refetchGuilds() // Refresh the guild list to show updated membership
      // Show appropriate message based on whether approval is required
      if (result?.join_request) {
        showToast("Request to Join Submitted! Waiting for guild master approval.", "success")
      } else if (result?.membership) {
        showToast("Successfully joined the guild!", "success")
      } else {
        showToast(result?.message || "Request to Join Submitted!", "success")
      }
    } catch (error: any) {
      // Surface backend error details if available
      let errorMsg = error?.message || 'Failed to submit join request. Please try again.';
      if (error?.response && typeof error.response.json === 'function') {
        try {
          const data = await error.response.json();
          if (data?.message) errorMsg = data.message;
        } catch {}
      }
      // Only log unexpected errors, not friendly info
      if (errorMsg.includes('pending join request')) {
        showToast(errorMsg, 'info');
      } else {
        console.error('Error applying for guild:', error);
        showToast(errorMsg, 'error');
      }
    }
  }

  const handleGoldPurchase = (amount: number) => {
    if (!currentUser) return

    const updatedUser = {
      ...currentUser,
      gold: (currentUser.gold || 0) + amount,
    }

    // TODO: Update user gold through proper auth context method
    // setCurrentUser(updatedUser)
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
              completedAt: new Date().toISOString(),
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

    // TODO: Update user gold and XP through proper auth context method
    // setCurrentUser((prevUser) => {
    //   if (!prevUser) return null
    //   return {
    //     ...prevUser,
    //     gold: prevUser.gold + quest.reward,
    //     xp: prevUser.xp + quest.xp,
    //   }
    // })
  }

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetchInitialData(),
      userSearchApi.getAllUsers()
    ])
      .then(([data, usersData]) => {
        if (!isMounted) return;
        setQuests(data?.quests || []);
        setGuilds(data?.guilds || []);
        setGuildApplications(data?.guildApplications || []);
        setUsers(Array.isArray(usersData) ? usersData.map((u: any) => ({
          ...u,
          isBanned: u.is_banned,
          banReason: u.ban_reason,
          banExpiration: u.ban_expires_at,
          isSuperuser: u.is_superuser,
          createdAt: u.date_joined,
        })) : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setQuests([]);
        setGuilds([]);
        setGuildApplications([]);
        setUsers([]);
        console.error("Initialization failed", err);
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

  // Handle quest creation from navbar - trigger refresh without remounting
  const handleQuestCreated = () => {
    // Refresh quest board
    setRefreshQuestBoard(prev => prev + 1);
    
    // Refresh gold balance to show updated amount after quest creation
    refreshBalance();
    
    // Show success toast
    toast({
      title: "Quest created successfully!",
      description: "Your quest is now visible on the Quest Board.",
      variant: "default",
    });
  };

  // Memoize data loaded state for each section
  const questsLoaded = quests.length > 0 || !loading;
  const guildsLoaded = guilds.length > 0 || !loading;

  // Only show loading modal for initial data load (not after login/register)
  const showInitialLoading = loading && !currentUser;

  return (
    <ToastProvider>
      {showInitialLoading && <LoadingModal message="Loading your adventure..." />}
      <main
        className={`${
          activeSection === "messages"
            ? "h-screen overflow-hidden"
            : "min-h-screen overflow-auto"
        } bg-[#F4F0E6]`}
      >

        <Navbar
          setActiveSection={handleSectionChange}
          handleLogout={logout}
          openAuthModal={() => setShowAuthModal(true)}
          openGoldPurchaseModal={() => {
            console.log('🏆 openGoldPurchaseModal called in main page - SIMPLIFIED');
            
            if (!currentUser) {
              console.log('❌ No current user, showing auth modal');
              toast({ 
                title: "Please log in to access the Gold Treasury", 
                variant: "destructive" 
              });
              setShowAuthModal(true);
            } else {
              console.log('✅ User found, setting Gold System Modal to true');
              setShowGoldSystemModal(true);
            }
          }}
          openPostQuestModal={() => {}}
          openCreateGuildModal={() => setShowCreateGuildModal(true)}
          onQuestCreated={handleQuestCreated}
          activeSection={activeSection}
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
          <QuestBoard
            currentUser={currentUser}
            refreshTrigger={refreshQuestBoard}
          />
        )}

        {activeSection === "guild-hall" && (
          guildsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner />
              <div className="mt-4 text-[#8B75AA] text-lg font-medium">Loading guilds...</div>
            </div>
          ) : (
            <GuildHall
              guilds={guildData}
              currentUser={currentUser}
              openCreateGuildModal={() => setShowCreateGuildModal(true)}
              handleApplyForGuild={(guildId, message) => handleApplyForGuild(guildId, message)}
              showToast={(message: string, type?: string) => {
                toast({ title: message, variant: type === "error" ? "destructive" : "default" });
              }}
            />
          )
        )}

        {activeSection === "settings" && currentUser && !showAuthModal && !showGoldSystemModal && (
          <Settings />
        )}

        {activeSection === "search" && (
          <UserSearch
            quests={quests}
            guilds={guilds}
            currentUser={currentUser}
            showToast={(message: string, type?: string) => {
              toast({ title: message, variant: type === "error" ? "destructive" : "default" });
            }}
          />
        )}

        {activeSection === "messages" && currentUser && debugToken &&(
          <MessagingSystem
            currentUser={currentUser}
            showToast={showToast}
            token={debugToken}
            onlineUsers={new Map()}   // Replace with actual onlineUsers map if available
          />
        )}

        {activeSection === "quest-management" && currentUser && (
          <QuestManagement
            currentUser={currentUser}
            setQuests={setQuests}
            onQuestStatusChange={(questId, newStatus) => {
              setQuests(prev => prev.map(q => 
                q.id === questId ? { ...q, status: newStatus as Quest['status'] } : q
              ));
            }}
            showToast={(message: string, type?: string) => {
              toast({ title: message, variant: type === "error" ? "destructive" : "default" });
            }}
          />
        )}

        {activeSection === "guild-management" && currentUser && (
          <>
            {!showDetailedGuildManagement ? (
              <SimpleGuildManagement
                guilds={guildData}
                currentUser={currentUser}
                showToast={showToast}
                onViewGuild={(guild) => {
                  // Check if this is an owned guild to determine management capabilities
                  const isOwned = guild.owner?.id === currentUser?.id || 
                                 guild.poster?.username === currentUser?.username
                  setViewingGuild(guild)
                  setIsViewingOwnedGuild(isOwned)
                  setShowGuildOverviewModal(true)
                }}
                onManageGuild={(guild) => {
                  setManagingGuild(guild)
                  setShowDetailedGuildManagement(true)
                }}
                onEditGuild={(guild) => {
                  setSelectedGuild(guild)
                  // Edit guild functionality - could open edit modal
                }}
                onDeleteGuild={(guildId) => {
                  // Delete guild functionality
                  console.log('Delete guild:', guildId)
                }}
              />
            ) : (
              <EnhancedGuildManagement
                guilds={guildData}
                guildApplications={guildApplications}
                currentUser={currentUser}
                selectedGuild={managingGuild}
                showToast={showToast}
                onViewGuild={(guild) => {
                  setSelectedGuild(guild)
                }}
                onEditGuild={(guild) => {
                  setSelectedGuild(guild)
                }}
                onDeleteGuild={(guildId) => {
                  console.log('Delete guild:', guildId)
                }}
                onApproveApplication={(applicationId) => {
                  console.log('Approve application:', applicationId)
                }}
                onRejectApplication={(applicationId) => {
                  console.log('Reject application:', applicationId)
                }}
                onManageMembers={(guild) => {
                  console.log('Manage members for guild:', guild.name)
                }}
                onBack={() => {
                  setShowDetailedGuildManagement(false)
                  setManagingGuild(null)
                }}
                onDataChanged={async () => {
                  // Refresh guild data when join requests are processed
                  await refetchGuilds()
                }}
              />
            )}
          </>
        )}

        {activeSection === "admin" && (
          (() => {
            const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
            if (!currentUser || !token) {
              return (
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                  <h2 className="text-2xl font-bold text-[#2C1A1D] mb-4">Admin Login Required</h2>
                  <p className="text-gray-600 mb-6">You must be logged in as an admin to access the admin panel.</p>
                  {process.env.NODE_ENV !== "production" && (
                    <div className="bg-amber-50 text-purple-600 p-3 mt-6 border border-amber-300 rounded-lg">
                      <strong>DEBUG:</strong> currentUser = {JSON.stringify(currentUser)}<br />
                      access_token = {token || 'n/a'}
                    </div>
                  )}
                </div>
              );
            }
            if (!isAdmin(currentUser)) {
              return (
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                  <h2 className="text-2xl font-bold text-[#2C1A1D] mb-4">Access Denied</h2>
                  <p className="text-gray-600 mb-6">You do not have permission to access the admin panel.</p>
                  {process.env.NODE_ENV !== "production" && (
                    <div className="bg-amber-50 text-purple-600 p-3 mt-6 border border-amber-300 rounded-lg">
                      <strong>DEBUG:</strong> currentUser = {JSON.stringify(currentUser)}<br />
                      access_token = {token || 'n/a'}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <AdminPanelDynamic
                currentUser={currentUser}
                showToast={(message: string, type?: string) => {
                  toast({ title: message, variant: type === "error" ? "destructive" : "default" });
                }}
              />
            );
          })()
        )}

        {activeSection === "about" && <About />}

        {activeSection === "profile" && currentUser && (
          <IntegratedProfile
            currentUser={currentUser}
            quests={quests}
            guilds={guilds}
            navigateToSection={setActiveSection}
          />
        )}



        {showGoldSystemModal && (
          <GoldSystemModal
            isOpen={showGoldSystemModal}
            onClose={() => setShowGoldSystemModal(false)}
            currentUser={currentUser}
            refreshUser={async () => { 
              console.log('🔃 refreshUser called in GoldSystemModal');
              console.log('🔃 About to call refreshBalance()');
              // Refresh user balance using the gold balance context
              refreshBalance();
              console.log('🔃 refreshBalance() completed');
            }}
            showToast={(message: string, type?: string) => {
              toast({ title: message, variant: type === "error" ? "destructive" : "default" });
            }}
          />
        )}

        {/* Remove duplicate Settings render */}

        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            mode={authMode}
            setMode={setAuthMode}
            onClose={() => setShowAuthModal(false)}
            onLogin={async (credentials: { username: string; password: string }) => {
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
            onRegister={async (data: { username: string; email: string; password: string; confirmPassword: string }) => {
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

        {showCreateGuildModal && (
          <EnhancedCreateGuildModal
            isOpen={showCreateGuildModal}
            onClose={() => setShowCreateGuildModal(false)}
            currentUser={currentUser}
            onSubmit={handleGuildSubmit}
            showToast={showToast}
          />
        )}

        {showGuildOverviewModal && viewingGuild && (
          <GuildOverviewModal
            isOpen={showGuildOverviewModal}
            onClose={() => {
              setShowGuildOverviewModal(false)
              setViewingGuild(null)
              setIsViewingOwnedGuild(false)
            }}
            guild={viewingGuild}
            currentUser={currentUser}
            onJoinGuild={async (guildId, message) => {
              try {
                setIsLoading(true)
                const result = await joinGuild(String(guildId), message)
                
                // Show appropriate message based on whether approval is required
                if (result?.join_request) {
                  showToast("Request to Join Submitted! Waiting for guild master approval.", "success")
                } else if (result?.membership) {
                  showToast("Successfully joined the guild!", "success")
                } else {
                  showToast(result.message || "Request to Join Submitted!", "success")
                }
                
                // Close the modal
                setShowGuildOverviewModal(false)
                setViewingGuild(null)
                
                // Refresh guild data to get updated membership status
                await refetchGuilds()
              } catch (error: any) {
                showToast(error.message || "Failed to join guild. Please try again.", "error")
              } finally {
                setIsLoading(false)
              }
            }}
            onOpenChat={(guildId) => {
              // Handle chat open
              console.log('Open chat for guild:', guildId)
            }}
            onManageGuild={(guild) => {
              // Close overview modal and open management
              setShowGuildOverviewModal(false)
              setViewingGuild(null)
              setManagingGuild(guild)
              setShowDetailedGuildManagement(true)
            }}
            showToast={showToast}
            isOwnedGuild={isViewingOwnedGuild}
          />
        )}

        <AIChatbot currentUser={currentUser} />

        {activeSection !== "messages" && <Footer />}
      </main>
    </ToastProvider>
  )
}