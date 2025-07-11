"use client"

import React, { useState } from 'react';
import { GuildHall } from '@/components/guilds/guild-hall';
import { EnhancedCreateGuildModal } from '@/components/guilds/enhanced-create-guild-modal';
import { useGuilds, useGuildActions } from '@/hooks/useGuilds';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/auth-modal';
import type { User, CreateGuildData } from '@/lib/types';
import { Toast } from '@/components/toast';

export default function GuildsPage() {
  // Use real authentication
  const { user: currentUser, login, register } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [showCreateGuildModal, setShowCreateGuildModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  // Use guild hooks for backend integration
  const { guilds, loading, error, refetch } = useGuilds({ autoFetch: true });
  const { createGuild, joinGuild, loading: actionLoading } = useGuildActions();

  const showToast = (message: string, type: string = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGuildSubmit = async (guildData: any) => {
    if (!currentUser) {
      showToast("Please log in to create a guild", "error");
      setShowAuthModal(true);
      return;
    }

    console.log('Creating guild with data:', guildData);
    
    try {
      // Create guild data for API - matching backend fields exactly
      const createGuildData: CreateGuildData = {
        name: guildData.name || "Untitled Guild",
        description: guildData.description || "",
        specialization: guildData.specialization || "development",
        preset_emblem: guildData.emblem || "🏆",
        privacy: guildData.privacy || "public",
        welcome_message: guildData.welcomeMessage || "",
        require_approval: guildData.requireApproval !== false,
        minimum_level: guildData.minimumLevel || 1,
        allow_discovery: guildData.allowDiscovery !== false,
        show_on_home_page: guildData.showOnHomePage !== false,
        who_can_post_quests: guildData.whoCanPost === 'members' ? 'all_members' : 'all_members',
        who_can_invite_members: guildData.whoCanInvite === 'members' ? 'all_members' : 'all_members',
        tags: guildData.tags || [],
        social_links: (guildData.socialLinks || []).map((link: any) => ({
          platform_name: link.platform,
          url: link.url
        })),
      };

      console.log('Sending to API:', createGuildData);
      const result = await createGuild(createGuildData);
      console.log('API Result:', result);
      
      await refetch(); // Refresh the guild list
      setShowCreateGuildModal(false);
      showToast("Guild created successfully! 🎉", "success");
    } catch (error) {
      console.error('Error creating guild:', error);
      showToast(`Failed to create guild: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const handleApplyForGuild = async (guildId: string | number, message: string) => {
    const guildIdStr = guildId.toString();
    console.log('🔍 handleApplyForGuild called with:', { guildId: guildIdStr, message, currentUser: currentUser?.username });
    
    if (!currentUser) {
      console.log('❌ No current user, showing auth modal');
      showToast("Please log in to apply for guilds", "error");
      setShowAuthModal(true);
      return;
    }

    try {
      console.log('🚀 Attempting to join guild:', guildIdStr);
      const result = await joinGuild(guildIdStr, message);
      console.log('✅ Join guild result:', result);
      
      await refetch(); // Refresh the guild list to show updated membership
      
      // Show appropriate message based on whether approval is required
      if (result?.join_request) {
        showToast("Request to Join Submitted! Waiting for guild master approval.", "success");
        console.log('📨 Join request created, awaiting approval');
      } else if (result?.membership) {
        showToast("Successfully joined the guild!", "success");
        console.log('🎉 Auto-joined guild successfully');
      } else {
        showToast("Request to Join Submitted!", "success");
        console.log('📋 Generic join request submitted');
      }
    } catch (error: any) {
      console.error('❌ Error applying for guild:', error);
      const errorMessage = error?.message || error?.response?.data?.detail || 'Failed to submit join request. Please try again.';
      showToast(`Error: ${errorMessage}`, "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B75AA] mx-auto"></div>
          <p className="mt-4 text-[#8B75AA]">Loading guilds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading guilds: {error}</p>
          <button
            onClick={() => refetch()}
            className="bg-[#8B75AA] text-white px-4 py-2 rounded hover:bg-[#7A6699] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F0E6]">
      {/* Debug user status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong>Debug Info:</strong> 
          {currentUser ? (
            <span className="text-green-600"> Logged in as {currentUser.username} (ID: {currentUser.id})</span>
          ) : (
            <span className="text-red-600"> Not logged in 
              <button 
                onClick={() => setShowAuthModal(true)}
                className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
              >
                Login
              </button>
            </span>
          )}
        </div>
      )}
      
      <GuildHall
        guilds={guilds}
        currentUser={currentUser}
        openCreateGuildModal={() => setShowCreateGuildModal(true)}
        handleApplyForGuild={handleApplyForGuild}
        showToast={showToast}
      />

      {showCreateGuildModal && (
        <EnhancedCreateGuildModal
          isOpen={showCreateGuildModal}
          onClose={() => setShowCreateGuildModal(false)}
          currentUser={currentUser}
          onSubmit={handleGuildSubmit}
          showToast={showToast}
        />
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
            } catch (error) {
              throw error;
            }
          }}
          onRegister={async (data) => {
            try {
              await register(data);
              setShowAuthModal(false);
            } catch (error) {
              throw error;
            }
          }}
        />
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
