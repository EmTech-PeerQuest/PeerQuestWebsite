"use client"

import { useState, useEffect } from "react"
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/ui/hero'
import { QuestBoard } from '@/components/quests/quest-board-clean'
import { QuestManagement } from '@/components/quests/quest-management'
import { GuildHall } from '@/components/guilds/guild-hall'
import { About } from "@/components/about"
import { Footer } from '@/components/ui/footer'
import { ToastProvider } from '@/components/ui/toast'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext";
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
  const [refreshQuestBoard, setRefreshQuestBoard] = useState(0); // Trigger refresh without remounting
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

  // Handle quest creation from navbar - trigger refresh without remounting
  const handleQuestCreated = () => {
    setRefreshQuestBoard(prev => prev + 1); // Trigger refresh in QuestBoard
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
          !questsLoaded ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner />
              <div className="mt-4 text-[#8B75AA] text-lg font-medium">Loading quests...</div>
            </div>
          ) : (
            <QuestBoard
              currentUser={currentUser}
              refreshTrigger={refreshQuestBoard}
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
              showToast={(message: string, type?: string) => {
                toast({ title: message, variant: type === "error" ? "destructive" : "default" });
              }}
            />
          )
        )}

        {activeSection === "settings" && currentUser && (
          <Settings
            user={currentUser}
            updateSettings={(updatedUser) => {
              // Handle settings update - you might need to implement proper user update logic
              console.log('Settings updated:', updatedUser);
            }}
            showToast={(message: string, type?: string) => {
              toast({ title: message, variant: type === "error" ? "destructive" : "default" });
            }}
          />
        )}

        {activeSection === "search" && (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Search</h2>
            <p className="text-gray-600">User Search component is being developed...</p>
          </div>
        )}

        {activeSection === "messages" && currentUser && (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
            <p className="text-gray-600">Messaging system is being developed...</p>
          </div>
        )}

        {activeSection === "quest-management" && currentUser && (
          !questsLoaded ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner />
              <div className="mt-4 text-[#8B75AA] text-lg font-medium">Loading your quests...</div>
            </div>
          ) : (
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
          )
        )}

        {activeSection === "guild-management" && currentUser && (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Guild Management</h2>
            <p className="text-gray-600">Guild management is being developed...</p>
          </div>
        )}

        {activeSection === "admin" && currentUser && (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h2>
            <p className="text-gray-600">Admin panel is being developed...</p>
          </div>
        )}

        {activeSection === "about" && <About />}

        {activeSection === "profile" && currentUser && (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
            <p className="text-gray-600">Profile page is being developed...</p>
          </div>
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