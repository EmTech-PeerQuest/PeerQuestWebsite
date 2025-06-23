"use client"

import { useState, useEffect } from "react"
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
import type { User, Quest, Guild, GuildApplication } from "@/lib/types"

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [guildApplications, setGuildApplications] = useState<GuildApplication[]>([])
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login")

  const showToast = (message: string, type = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
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

  return (
    <ToastProvider>
      <main className="min-h-screen bg-[#F4F0E6]">
        <Navbar
          currentUser={currentUser}
          setActiveSection={setActiveSection}
          handleLogout={() => {
            setCurrentUser(null)
            setActiveSection("home")
            showToast("You have been logged out.", "info")
          }}
          openAuthModal={() => {
            setAuthMode("login")
            setShowAuthModal(true)
          }}
          openGoldPurchaseModal={() => showToast("Gold purchase modal placeholder", "info")}
          openPostQuestModal={() => showToast("Post quest modal placeholder", "info")}
          openCreateGuildModal={() => showToast("Create guild modal placeholder", "info")}
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
            openQuestDetails={() => showToast("Quest details modal placeholder", "info")}
            openPostQuestModal={() => showToast("Post quest modal placeholder", "info")}
            openApplications={() => showToast("Applications modal placeholder", "info")}
            openEditQuestModal={() => showToast("Edit quest modal placeholder", "info")}
          />
        )}

        {activeSection === "guild-hall" && (
          <GuildHall
            guilds={guilds}
            currentUser={currentUser}
            openCreateGuildModal={() => showToast("Create guild modal placeholder", "info")}
            handleApplyForGuild={() => showToast("Apply to guild placeholder", "info")}
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
            onQuestStatusChange={() => showToast("Status changed", "success")}
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
            onViewGuild={() => showToast("View guild", "info")}
            onEditGuild={() => showToast("Edit guild", "info")}
            onDeleteGuild={() => showToast("Delete guild", "info")}
            onApproveApplication={() => showToast("Approve application", "success")}
            onRejectApplication={() => showToast("Reject application", "info")}
            onManageMembers={() => showToast("Manage members", "info")}
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

        <Footer />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          setMode={setAuthMode}
          onLogin={() => showToast("Login logic placeholder", "success")}
          onRegister={() => showToast("Register logic placeholder", "success")}
          onForgotPassword={() => showToast("Forgot password placeholder", "info")}
        />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </ToastProvider>
  )
} 
