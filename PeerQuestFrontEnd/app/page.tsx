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
import { UserSearch } from '@/components/search/user-search';
import Spinner from '@/components/ui/spinner';
import LoadingModal from '@/components/ui/loading-modal';

import type { User, Quest, Guild, GuildApplication } from "@/lib/types"
import { fetchInitialData } from '@/lib/api/init-data'

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("home");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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

  // Transform backend user data to match frontend User type
  const transformUserData = (backendUser: any): User => {
    return {
      id: backendUser.id,
      username: backendUser.username,
      displayName: backendUser.display_name || backendUser.username,
      email: backendUser.email,
      avatar: backendUser.avatar_url || "👤",
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
        
        // Transform user data from backend format
        const transformedUsers = data?.users ? data.users.map(transformUserData) : [];
        setUsers(transformedUsers);
        
        setGuildApplications(data?.guildApplications || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setQuests([]);
        setGuilds([]);
        setUsers([]); // No fallback to mock data
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

  // Simple toast implementation
  const showToast = (message: string, type: string = 'info') => {
    toast({ 
      title: message, 
      variant: type === 'error' ? 'destructive' : 'default',
      duration: 3000 
    });
  };

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
          <UserSearch
            users={users}
            quests={quests}
            guilds={guilds}
            currentUser={currentUser}
            showToast={showToast}
          />
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