"use client"

import { useState, useEffect } from "react"
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/ui/hero'
import { QuestBoard } from '@/components/quests/quest-board'
import { QuestManagement } from '@/components/quests/quest-management'
import { GuildHall } from '@/components/guilds/guild-hall'
import { About } from "@/components/about"
import { Footer } from '@/components/ui/footer'
import { ToastProvider } from '@/components/ui/toast'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext";
import { useGoldBalance } from "@/context/GoldBalanceContext";
import { AIChatbot } from '@/components/ai/ai-chatbot';
import { AuthModal } from '@/components/auth/auth-modal';
import { Settings } from '@/components/settings/settings';
import { GoldSystemModal } from '@/components/gold/gold-system-modal';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/spinner';
import LoadingModal from '@/components/ui/loading-modal';
import { IntegratedProfile } from '@/components/profile/integrated-profile';
import { UserSearch } from '@/components/search/user-search';
import type { User, Quest, Guild, GuildApplication } from "@/lib/types"
import { fetchInitialData } from '@/lib/api/init-data'

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildApplications, setGuildApplications] = useState<GuildApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshQuestBoard, setRefreshQuestBoard] = useState(0); // Trigger refresh without remounting
  const { user: currentUser, login, register, logout, refreshUser } = useAuth();
  const { refreshBalance } = useGoldBalance(); // Add gold balance refresh capability
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGoldSystemModal, setShowGoldSystemModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const router = useRouter();

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
      <main className="min-h-screen bg-[#F4F0E6]">
        <Navbar
          currentUser={currentUser}
          setActiveSection={handleSectionChange}
          handleLogout={logout}
          openAuthModal={() => setShowAuthModal(true)}
          openGoldPurchaseModal={() => {
            if (!currentUser) {
              toast({ 
                title: "Please log in to access the Gold Treasury", 
                variant: "destructive" 
              });
              setShowAuthModal(true);
            } else {
              setShowGoldSystemModal(true);
            }
          }}
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
            refreshUser={refreshUser}
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

        <AIChatbot currentUser={currentUser} />

        <Footer />
      </main>
    </ToastProvider>
  )
}