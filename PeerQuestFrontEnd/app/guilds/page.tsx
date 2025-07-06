"use client"

import React, { useState } from 'react';
import { GuildHall } from '@/components/guilds/guild-hall';
import { EnhancedCreateGuildModal } from '@/components/guilds/enhanced-create-guild-modal';
import { useGuilds, useGuildActions } from '@/hooks/useGuilds';
import type { User, CreateGuildData } from '@/lib/types';
import { Toast } from '@/components/toast';

export default function GuildsPage() {
  // Mock user for testing - replace with real auth later
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    user_name: 'testuser',
    first_name: 'Test',
    email: 'test@test.com',
    gold: 5000, // Add enough gold for guild creation
    level: 10,
    xp: 1000
  });
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

  const handleApplyForGuild = async (guildId: number, message: string) => {
    if (!currentUser) {
      showToast("Please log in to apply for guilds", "error");
      return;
    }

    try {
      await joinGuild(guildId.toString(), message);
      await refetch(); // Refresh the guild list to show updated membership
      showToast("Guild application submitted successfully!", "success");
    } catch (error) {
      console.error('Error applying for guild:', error);
      showToast('Failed to apply for guild. Please try again.', "error");
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
