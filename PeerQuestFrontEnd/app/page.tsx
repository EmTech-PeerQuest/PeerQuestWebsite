"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/ui/hero'
import { QuestBoard } from '@/components/quests/quest-board'
import { GuildHall } from '@/components/guilds/guild-hall'
import { About } from "@/components/about"
import { Footer } from '@/components/ui/footer'
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
          openGoldPurchaseModal={() => {}}
          openPostQuestModal={() => {}}
          openCreateGuildModal={() => {}}
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
        )}

        {activeSection === "settings" && currentUser && (
          <Settings
            user={currentUser}
            updateSettings={(updatedUser) => setCurrentUser({ ...currentUser, ...updatedUser })}
            showToast={showToast}
          />
        )}

        {activeSection === "search" && (
          <UserSearch
            users={[]}
            quests={quests}
            guilds={guilds}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {activeSection === "messages" && currentUser && (
          <MessagingSystem currentUser={currentUser} showToast={showToast} />
        )}

        {activeSection === "quest-management" && currentUser && (
          <QuestManagement
            quests={quests}
            currentUser={currentUser}
            onQuestStatusChange={() => {}}
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
            showToast={showToast}
          />
        )}

        {activeSection === "about" && <About />}

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
      </main>
    </ToastProvider>
  )
}