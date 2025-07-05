"use client"

<<<<<<< HEAD
import { useState, useEffect, useRef } from "react"
=======
import { useState, useEffect } from "react"
>>>>>>> Profile/Settings
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/ui/hero'
import { QuestBoard } from '@/components/quests/quest-board'
import { GuildHall } from '@/components/guilds/guild-hall'
import { About } from "@/components/about"
import { Footer } from '@/components/ui/footer'
<<<<<<< HEAD
import { Toast, ToastProvider } from '@/components/ui/toast'
import { AuthModal } from '@/components/auth/auth-modal'
import { Profile } from '@/components/auth/profile'
import { Settings } from '@/components/settings/settings'
import { AdminPanel } from '@/components/admin/admin-panel'
import { UserSearch } from '@/components/user-search'
import { MessagingSystem } from '@/components/messaging/messaging-system'
import { QuestManagement } from '@/components/quests/quest-management'
import { EnhancedGuildManagement } from '@/components/guilds/enhanced-guild-management'
import { AIChatbot } from '@/components/ai/ai-chatbot'
import type { User, Quest, Guild, GuildApplication } from "@/lib/types"
import { authService } from '@/lib/auth-service'
import { fetchInitialData } from '@/lib/api/init-data'

declare global {
  interface Window {
    openAuthModal?: () => void
  }
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "foreground" | "background" } | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [guildApplications, setGuildApplications] = useState<GuildApplication[]>([])
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login")
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = (message: string, type?: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, type: (type as "foreground" | "background") || "foreground" })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    window.openAuthModal = () => {
      setAuthMode("login")
      setShowAuthModal(true)
    }
    return () => {
      window.openAuthModal = undefined
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await authService.getCurrentUser()
        const data = await fetchInitialData()
        if (user) setCurrentUser(user)
        if (data) {
          setQuests(data.quests || [])
          setGuilds(data.guilds || [])
          setGuildApplications(data.guildApplications || [])
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          authService.logout()
          setCurrentUser(null)
          showToast("Session expired. Please log in again.", "foreground")
        } else {
          console.error("Initialization failed", err)
          showToast("Failed to fetch initial data.", "foreground")
        }
      }
    }
    initialize()
  }, [])

  return (
    <ToastProvider>
      <main className="min-h-screen bg-[#F4F0E6]">
        <Navbar
          currentUser={currentUser}
          setActiveSection={setActiveSection}
          handleLogout={() => {
            authService.logout()
            setCurrentUser(null)
            setActiveSection("home")
            showToast("You have been logged out.", "foreground")
          }}
          openAuthModal={() => {
            setAuthMode("login")
            setShowAuthModal(true)
          }}
=======
import { ToastProvider } from '@/components/ui/toast'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext";
import GoogleLoginButton from "@/components/auth/GoogleAuthButton"
import { AIChatbot } from '@/components/ai/ai-chatbot';
import { AuthModal } from '@/components/auth/auth-modal';
import { Settings } from '@/components/settings/settings';
import { useRouter } from 'next/navigation';
import Profile from './profile/page';
import Spinner from '@/components/ui/spinner';
import LoadingModal from '@/components/ui/loading-modal';

import type { User, Quest, Guild, GuildApplication } from "@/lib/types"
import { fetchInitialData } from '@/lib/api/init-data'

export default function Home() {
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
>>>>>>> Profile/Settings
          openGoldPurchaseModal={() => {}}
          openPostQuestModal={() => {}}
          openCreateGuildModal={() => {}}
        />

        {activeSection === "home" && (
          <Hero
            currentUser={currentUser}
<<<<<<< HEAD
            openAuthModal={() => {
              setAuthMode("login")
              setShowAuthModal(true)
            }}
            openRegisterModal={() => {
              setAuthMode("register")
              setShowAuthModal(true)
            }}
=======
            openAuthModal={() => setShowAuthModal(true)}
            openRegisterModal={() => setActiveSection("about")}
>>>>>>> Profile/Settings
            navigateToSection={setActiveSection}
          />
        )}

        {activeSection === "quest-board" && (
<<<<<<< HEAD
          <QuestBoard
            quests={quests}
            currentUser={currentUser}
            openQuestDetails={() => {}}
            openPostQuestModal={() => {}}
            openApplications={() => {}}
            openEditQuestModal={() => {}}
          />
        )}

        {activeSection === "guild-hall" && (
          <GuildHall
            guilds={guilds}
            currentUser={currentUser}
            openCreateGuildModal={() => {}}
            handleApplyForGuild={() => {}}
            showToast={showToast}
          />
        )}

        {activeSection === "profile" && currentUser && (
          <Profile
            currentUser={currentUser}
            quests={quests}
            guilds={guilds}
            navigateToSection={setActiveSection}
          />
=======
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
            />
          )
>>>>>>> Profile/Settings
        )}

        {activeSection === "settings" && currentUser && (
          <Settings
            user={currentUser}
            updateSettings={(updatedUser) => setCurrentUser({ ...currentUser, ...updatedUser })}
<<<<<<< HEAD
            showToast={showToast}
=======
>>>>>>> Profile/Settings
          />
        )}

        {activeSection === "search" && (
          <UserSearch
            users={[]}
            quests={quests}
            guilds={guilds}
            currentUser={currentUser}
<<<<<<< HEAD
            showToast={showToast}
=======
>>>>>>> Profile/Settings
          />
        )}

        {activeSection === "messages" && currentUser && (
<<<<<<< HEAD
          <MessagingSystem currentUser={currentUser} showToast={showToast} />
=======
          <MessagingSystem currentUser={currentUser} />
>>>>>>> Profile/Settings
        )}

        {activeSection === "quest-management" && currentUser && (
          <QuestManagement
            quests={quests}
            currentUser={currentUser}
            onQuestStatusChange={() => {}}
            setQuests={setQuests}
<<<<<<< HEAD
            showToast={showToast}
=======
>>>>>>> Profile/Settings
          />
        )}

        {activeSection === "guild-management" && currentUser && (
          <EnhancedGuildManagement
            guilds={guilds}
            guildApplications={guildApplications}
            currentUser={currentUser}
<<<<<<< HEAD
            showToast={showToast}
=======
>>>>>>> Profile/Settings
            onViewGuild={() => {}}
            onEditGuild={() => {}}
            onDeleteGuild={() => {}}
            onApproveApplication={() => {}}
            onRejectApplication={() => {}}
            onManageMembers={() => {}}
          />
        )}

        {activeSection === "admin" && currentUser?.roles?.includes("admin") && (
          <AdminPanel
            currentUser={currentUser}
            users={[]}
            quests={quests}
            guilds={guilds}
            setUsers={() => {}}
            setQuests={setQuests}
            setGuilds={setGuilds}
<<<<<<< HEAD
            showToast={showToast}
=======
>>>>>>> Profile/Settings
          />
        )}

        {activeSection === "about" && <About />}

<<<<<<< HEAD
        <AIChatbot currentUser={currentUser} />

        <Footer />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          setMode={setAuthMode}
          onLogin={async (credentials) => {
            try {
              const user = await authService.login(credentials.email, credentials.password)
              setCurrentUser(user)
              setShowAuthModal(false)
              showToast("Welcome back to the PeerQuest Tavern!", "foreground")
            } catch (err: any) {
              showToast(err.message || "Login failed.", "foreground")
            }
          }}
          onRegister={async (data) => {
            try {
              const user = await authService.register(data.username, data.email, data.password)
              setCurrentUser(user)
              setShowAuthModal(false)
              showToast("Registration successful!", "foreground")
            } catch (err: any) {
              showToast(err.message || "Registration failed.", "foreground")
            }
          }}
          onForgotPassword={async (email) => {
            try {
              await authService.forgotPassword(email)
              showToast("Password reset email sent.", "foreground")
              setAuthMode("login")
            } catch (err: any) {
              showToast(err.message || "Password reset failed.", "foreground")
            }
          }}
        />

        {toast && <Toast variant={toast.type} title={toast.message} onClose={() => setToast(null)} />}
=======
        {activeSection === "profile" && currentUser && (
          <Profile currentUser={currentUser} quests={quests} guilds={guilds} />
        )}

        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            mode={authMode}
            setMode={setAuthMode}
            onClose={() => setShowAuthModal(false)}
            onLogin={async (credentials) => {
              await login(credentials);
              setShowAuthModal(false);
              // No redirect, stay on homepage
            }}
            onRegister={async (data) => {
              await register(data);
              setShowAuthModal(false);
              // No redirect, stay on homepage
            }}
          />
        )}

        <AIChatbot currentUser={currentUser} />

        <Footer />
>>>>>>> Profile/Settings
      </main>
    </ToastProvider>
  )
}