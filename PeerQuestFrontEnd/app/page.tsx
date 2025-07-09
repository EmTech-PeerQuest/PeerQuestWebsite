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
import { AuthModal } from '@/components/auth/auth-modal';
import { useRouter } from 'next/navigation';
import { IntegratedProfile } from '@/components/profile/integrated-profile';
import { Settings } from '@/components/settings/settings';
import Spinner from '@/components/ui/spinner';
import LoadingModal from '@/components/ui/loading-modal';

import type { User, Quest, Guild, GuildJoinRequest, CreateGuildData } from "@/lib/types"
import { fetchInitialData } from '@/lib/api/init-data'
import { UserSearch } from "@/components/user-search"
import { MessagingSystem } from '@/components/messaging/messaging-system'
import { QuestManagement } from '@/components/quests/quest-management'
import { SimpleGuildManagement } from '@/components/guilds/simple-guild-management'
import { EnhancedGuildManagement } from '@/components/guilds/enhanced-guild-management'
import { GuildOverviewModal } from '@/components/guilds/guild-overview-modal'
import { EnhancedCreateGuildModal } from '@/components/guilds/enhanced-create-guild-modal'
import { AdminPanel } from '@/components/admin/admin-panel'
import { AIChatbot } from '@/components/ai/ai-chatbot'
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
  // Main state
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

  // Use guild hooks for backend integration
  const { guilds: guildData, loading: guildsLoading, error: guildsError, refetch: refetchGuilds } = useGuilds({ autoFetch: true })
  const { createGuild, joinGuild, loading: guildActionLoading, error: guildActionError } = useGuildActions()

  // Ensure home section is shown after logout
  useEffect(() => {
    if (!currentUser) {
      setActiveSection("home");
    }
  }, [currentUser]);

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
    if (!currentUser) return

    // Deduct gold from user for quest reward and add spending record
    if (questData.questCost) {
      const updatedUser = addSpendingRecord(
        currentUser,
        questData.questCost,
        "quest_posting",
        `Posted quest: ${questData.title}`,
      )
      // TODO: Update user gold through proper auth context method
      // setCurrentUser({ ...updatedUser, gold: updatedUser.gold - questData.questCost })
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
      createdAt: new Date().toISOString(),
      deadline: questData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      const result = await joinGuild(guildId.toString(), message)
      await refetchGuilds() // Refresh the guild list to show updated membership
      
      // Show appropriate message based on whether approval is required
      if (result?.join_request) {
        showToast("Request to Join Submitted! Waiting for guild master approval.", "success")
      } else if (result?.membership) {
        showToast("Successfully joined the guild!", "success")
      } else {
        showToast("Request to Join Submitted!", "success")
      }
    } catch (error) {
      console.error('Error applying for guild:', error)
      showToast('Failed to submit join request. Please try again.', "error")
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
              handleApplyForGuild={handleApplyForGuild}
              showToast={showToast}
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

        <Footer />
      </main>
    </ToastProvider>
  )
}