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
          currentUser={currentUser}
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
            />
          )
        )}

        {activeSection === "settings" && currentUser && (
          <Settings
            user={currentUser}
            updateSettings={(updatedUser) => setCurrentUser({ ...currentUser, ...updatedUser })}
          />
        )}

        {activeSection === "search" && (
          <UserSearch
            users={[]}
            quests={quests}
            guilds={guilds}
            currentUser={currentUser}
          />
        )}

        {activeSection === "messages" && currentUser && (
          <MessagingSystem currentUser={currentUser} />
        )}

        {activeSection === "quest-management" && currentUser && (
          <QuestManagement
            quests={quests}
            currentUser={currentUser}
            onQuestStatusChange={() => {}}
            setQuests={setQuests}
          />
        )}

        {activeSection === "guild-management" && currentUser && (
          <EnhancedGuildManagement
            guilds={guilds}
            guildApplications={guildApplications}
            currentUser={currentUser}
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
          />
        )}

        {activeSection === "about" && <About />}

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
      </main>
    </ToastProvider>
  )
}