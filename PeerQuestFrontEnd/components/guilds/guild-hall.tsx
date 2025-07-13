"use client"
import { useState, useEffect, useCallback } from "react"
import { Flag } from "lucide-react"
import type { Guild, User, GuildMembership } from "@/lib/types"
import { GuildOverviewModal } from '@/components/guilds/guild-overview-modal'
import { GuildChatModal } from '@/components/guilds/guild-chat-modal'
import { GuildWarningModal } from '@/components/guilds/guild-warning-modal'
import { guildApi } from '@/lib/api/guilds'
import { usePresence } from '@/context/PresenceContext'
import { reportGuild } from '@/lib/api/guild-report'
import { getGuildWarningStatus } from '@/lib/utils/guild-moderation'

interface GuildHallProps {
  guilds: Guild[]
  currentUser: User | null
  openCreateGuildModal: () => void
  handleApplyForGuild: (guildId: string, message: string) => void
  showToast: (message: string, type?: string) => void
}

export function GuildHall({
  guilds,
  currentUser,
  openCreateGuildModal,
  handleApplyForGuild,
  showToast,
}: GuildHallProps) {
  // Debug: log all guilds and their IDs and types
  console.log('[GuildHall] guilds:', guilds.map(g => ({
    guild_id: g.guild_id,
    guild_id_type: typeof g.guild_id,
    id: g.id,
    id_type: typeof g.id,
    name: g.name
  })));
  // Presence context
  const { onlineUsers } = usePresence();
  // Filter out guilds with invalid guild_id (must be a valid UUID string)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const validGuilds = guilds.filter(g =>
    typeof g.guild_id === 'string' &&
    !!g.guild_id &&
    uuidRegex.test(g.guild_id)
  );
  const [showJoinModal, setShowJoinModal] = useState(false)
  // State for tracking join requests
  const [userJoinRequests, setUserJoinRequests] = useState<Record<string, 'pending' | 'approved' | 'declined' | null>>({})
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)
  const [joinMessage, setJoinMessage] = useState("")
  const [showOverviewModal, setShowOverviewModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null)
  const [userMemberships, setUserMemberships] = useState<{[guildId: string]: boolean}>({})
  const [showWarningModal, setShowWarningModal] = useState(false)

  // Report-related state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingGuild, setReportingGuild] = useState<Guild | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [reportMessage, setReportMessage] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)

  // Check user membership status for all guilds
  useEffect(() => {
    if (currentUser && guilds.length > 0) {
      checkUserMemberships()
      checkUserJoinRequests()
    }
  }, [currentUser, guilds])

  const checkUserMemberships = async () => {
    if (!currentUser) return
    
    const memberships: {[guildId: string]: boolean} = {}
    
    try {
      // Check each guild for user membership
      const membershipChecks = guilds.map(async (guild) => {
        try {
          const members = await guildApi.getGuildMembers(guild.guild_id)
          const isMember = members.some(membership => 
            String(membership.user.id) === String(currentUser.id) && 
            membership.status === 'approved' && 
            membership.is_active
          )
          memberships[guild.guild_id] = isMember
        } catch (error) {
          // If we can't fetch members, assume not a member
          memberships[guild.guild_id] = false
        }
      })
      
      await Promise.all(membershipChecks)
      setUserMemberships(memberships)
    } catch (error) {
      console.error('Failed to check user memberships:', error)
    }
  }

  // Helper function to check if user is a member of a guild
  const isUserMember = (guild: Guild, user: User | null): boolean => {
    if (!user) return false
    return userMemberships[guild.guild_id] || false
  }

  // Helper function to get join request status for a guild
  const getJoinRequestStatus = (guildId: string): 'pending' | 'approved' | 'declined' | null => {
    return userJoinRequests[guildId] || null
  }

  // Function to check user join requests for all guilds
  const checkUserJoinRequests = useCallback(async () => {
    if (!currentUser) {
      setUserJoinRequests({})
      return
    }

    try {
      // For each guild, check if the user has any join requests
      const requestStatuses: Record<string, 'pending' | 'approved' | 'declined' | null> = {}
      
      for (const guild of guilds) {
        try {
          const response = await fetch(`http://localhost:8000/api/guilds/${guild.guild_id}/join-requests/?user_id=${currentUser.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const requests = await response.json()
            const userRequest = requests.find((req: any) => 
              req.user.id === currentUser.id || req.user.username === currentUser.username
            )
            
            if (userRequest) {
              if (userRequest.is_approved === null) {
                requestStatuses[guild.guild_id] = 'pending'
              } else if (userRequest.is_approved === true) {
                requestStatuses[guild.guild_id] = 'approved'
              } else if (userRequest.is_approved === false) {
                requestStatuses[guild.guild_id] = 'declined'
              }
            }
          }
        } catch (error) {
          console.error(`Error checking join requests for guild ${guild.guild_id}:`, error)
        }
      }
      
      setUserJoinRequests(requestStatuses)
    } catch (error) {
      console.error('Error checking user join requests:', error)
    }
  }, [currentUser, guilds])

  const handleJoinClick = (guildId: string | number | undefined) => {
    // Extra debug log for join attempts
    console.log('[handleJoinClick] guildId:', guildId);
    // Always use only string UUIDs
    if (!guildId || typeof guildId !== 'string' || !uuidRegex.test(guildId)) {
      showToast('🚫 Invalid guild. Please check the guild and try again!', 'error');
      return;
    }
    if (!currentUser) {
      if (window.openAuthModal) window.openAuthModal();
      return;
    }
    // Only match by guild.guild_id (never fallback to id)
    const guild = guilds.find((g) => g.guild_id === guildId);
    if (!guild || typeof guild.guild_id !== 'string' || !uuidRegex.test(guild.guild_id)) {
      showToast('❓ Guild not found or has an invalid ID. Please refresh the page and try again.', 'error');
      return;
    }
    if (isUserMember(guild, currentUser)) {
      showToast('✅ You are already a member of this guild!', 'info');
      return;
    }
    setSelectedGuildId(guild.guild_id);
    setShowJoinModal(true);
  }

  const handleGuildCardClick = (guild: Guild) => {
    setSelectedGuild(guild)
    setShowOverviewModal(true)
  }

  const handleOpenChat = (guildId: string) => {
    if (!uuidRegex.test(guildId)) {
      console.warn('[handleOpenChat] Invalid UUID:', guildId)
      return
    }

    const guild = guilds.find((g) => g.guild_id === guildId)

    if (guild) {
      setSelectedGuild(guild)
      setShowChatModal(true)
      setShowOverviewModal(false)
    } else {
      console.warn('[handleOpenChat] No guild found for UUID:', guildId)
    }
  }



  const submitJoinRequest = async () => {
    // Strict validation for selectedGuildId
    if (!selectedGuildId || typeof selectedGuildId !== 'string' || !uuidRegex.test(selectedGuildId)) {
      console.error('[submitJoinRequest] Invalid selectedGuildId:', selectedGuildId, typeof selectedGuildId, selectedGuildId && selectedGuildId.length);
      showToast('🚫 Invalid guild. Please check the guild and try again!', 'error');
      setSelectedGuildId(null);
      setShowJoinModal(false);
      return;
    }
    try {
      // Extra debug: log the value and type
      console.log('[submitJoinRequest] Applying for guildId:', selectedGuildId, typeof selectedGuildId, selectedGuildId && selectedGuildId.length);
      if (selectedGuildId) {
        await handleApplyForGuild(selectedGuildId, joinMessage);
      }
      setShowJoinModal(false);
      setJoinMessage("");
      setSelectedGuildId(null);
      // Refresh membership status and join requests after joining
      await checkUserMemberships();
      await checkUserJoinRequests();
    } catch (error: any) {
      console.error('Failed to submit join request:', error);
      if (typeof showToast === 'function') {
        showToast('❌ ' + (error?.message || 'Failed to submit join request. Please try again.'), 'error');
      }
    }
  }

  const getSpecializationBadgeColor = (specialization: string) => {
    switch (specialization.toLowerCase()) {
      case "alchemy":
        return "bg-purple-500"
      case "development":
        return "bg-blue-500"
      case "writing":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Report handling functions
  const handleSubmitReport = async () => {
    if (!reportingGuild || !reportReason.trim()) {
      showToast('Please select a reason for reporting', 'error')
      return
    }

    if (!currentUser) {
      showToast('You must be logged in to report a guild', 'error')
      return
    }

    setReportSubmitting(true)
    
    try {
      await reportGuild({
        reportedGuild: reportingGuild.guild_id,
        reason: reportReason,
        message: reportMessage.trim() || undefined
      })
      
      showToast('Guild reported successfully. Our team will review it.', 'success')
      setShowReportModal(false)
      setReportingGuild(null)
      setReportReason('')
      setReportMessage('')
    } catch (error: any) {
      console.error('Error reporting guild:', error)
      showToast(error.message || 'Failed to report guild. Please try again.', 'error')
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <section className="bg-[#F4F0E6] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold text-[#2C1A1D] font-serif">Guild Hall</h2>
          <div className="flex gap-4">
            {currentUser && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  openCreateGuildModal();
                }}
                className="bg-[#8B75AA] text-white px-4 py-2 rounded hover:bg-[#7A6699] transition-colors"
              >
                Create a Guild
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-[#8B75AA] mb-8">
          JOIN OR CREATE A GUILD TO COLLABORATE WITH OTHER ADVENTURERS ON LARGER QUESTS.
        </p>

        {/* Guild Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {validGuilds && validGuilds.length > 0 ? (
            validGuilds.map((guild) => (
              <div
                key={guild.guild_id || guild.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#CDAA7D]/20 hover:border-[#8B75AA]/30 cursor-pointer group"
                onClick={() => handleGuildCardClick(guild)}
              >
              {/* Guild Header with Gradient */}
              <div className="bg-gradient-to-r from-[#CDAA7D] to-[#B8956D] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl shadow-lg">
                      {guild.custom_emblem && typeof guild.custom_emblem === 'string' && guild.custom_emblem.startsWith('http') ? (
                        <img src={guild.custom_emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-xl" />
                      ) : guild.preset_emblem && typeof guild.preset_emblem === 'string' && guild.preset_emblem.startsWith('http') ? (
                        <img src={guild.preset_emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-xl" />
                      ) : guild.emblem && typeof guild.emblem === 'string' && guild.emblem.startsWith('http') ? (
                        <img src={guild.emblem} alt="Guild emblem" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        guild.preset_emblem || guild.custom_emblem || guild.emblem || "🏆"
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-xl leading-tight font-serif mb-1">{guild.name}</h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${getSpecializationBadgeColor(guild.specialization)}`}
                        >
                          {guild.specialization.toUpperCase()}
                        </span>
                        
                        {/* Warning indicators */}
                        {guild.is_disabled && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                            DISABLED
                          </span>
                        )}
                        {!guild.is_disabled && guild.warning_count > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Warning badge clicked!', { 
                                guild: guild.name, 
                                currentUser: currentUser?.username,
                                guildOwner: guild.owner?.username,
                                isOwner: currentUser && guild.owner && String(guild.owner.id) === String(currentUser.id)
                              });
                              
                              // Check if current user is the guild owner
                              if (currentUser && guild.owner && String(guild.owner.id) === String(currentUser.id)) {
                                console.log('Opening warning modal for owner');
                                setSelectedGuild(guild);
                                setShowWarningModal(true);
                              } else {
                                console.log('User is not the owner');
                                showToast('Only guild owners can view warning details', 'info');
                              }
                            }}
                            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold rounded-full shadow-lg transition-colors"
                          >
                            ⚠️ {guild.warning_count}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guild Content */}
              <div className="p-6">
                <p className="text-[#2C1A1D] text-sm leading-relaxed mb-6 line-clamp-3">{guild.description}</p>

                {/* Guild Stats */}
                <div className="bg-gradient-to-r from-[#F4F0E6] to-[#F8F4EA] rounded-lg p-4 mb-6">                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-[#8B75AA] text-lg">👥</span>
                            <span className="text-[#2C1A1D] font-bold text-lg">{guild.member_count || guild.members || 0}</span>
                          </div>
                          <span className="text-[#8B75AA] text-xs uppercase tracking-wide">Members</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-yellow-500 text-lg">💰</span>
                            <span className="text-[#2C1A1D] font-bold text-lg">{guild.funds || 0}</span>
                          </div>
                          <span className="text-[#8B75AA] text-xs uppercase tracking-wide">Guild Gold</span>
                        </div>
                      </div>
                </div>

                {/* Specialization */}
                <div className="flex items-center gap-2 text-sm text-[#8B75AA] mb-6 bg-[#8B75AA]/5 rounded-lg p-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <span className="font-medium">Specialization: </span>
                    <span className="font-bold uppercase">{guild.specialization}</span>
                  </div>
                </div>

                {/* Guild Master */}
                <div className="flex items-center gap-3 mb-6 p-3 bg-[#CDAA7D]/5 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {guild.owner?.avatar || guild.poster?.avatar || "👤"}
                  </div>
                  <div>
                    <div className="font-semibold text-[#2C1A1D]">
                      {guild.owner?.username || guild.owner?.username || guild.poster?.username || "Guild Master"}
                    </div>
                    <div className="text-xs text-[#8B75AA] uppercase tracking-wide">Guild Master</div>
                  </div>
                </div>
              </div>

              {/* Guild Footer */}
              <div className="border-t border-[#CDAA7D]/20 p-6 bg-gradient-to-r from-[#F4F0E6] to-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-[#8B75AA]">
                    <span className={`w-2 h-2 rounded-full ${guild.is_disabled ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                    <span className="font-medium">{guild.is_disabled ? 'Disabled Guild' : 'Active Guild'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Report Button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setReportingGuild(guild);
                        setShowReportModal(true);
                      }}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                      title="Report Guild"
                    >
                      <Flag className="w-4 h-4" />
                    </button>                    {/* Join Button */}
                    {typeof guild.guild_id === 'string' && guild.guild_id && guild.guild_id !== 'NaN' && guild.guild_id !== 'undefined' ? (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleJoinClick(guild.guild_id);
                        }}
                        disabled={
                          guild.is_disabled ||
                          isUserMember(guild, currentUser) ||
                          getJoinRequestStatus(guild.guild_id) === 'pending'
                        }
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md ${
                          guild.is_disabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isUserMember(guild, currentUser)
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : getJoinRequestStatus(guild.guild_id) === 'pending'
                            ? "bg-yellow-200 text-yellow-700 cursor-not-allowed"
                            : getJoinRequestStatus(guild.guild_id) === 'declined'
                            ? "bg-red-100 border-2 border-red-300 text-red-700 hover:bg-red-200 hover:shadow-lg transform hover:-translate-y-0.5"
                            : "bg-[#8B75AA] text-white hover:bg-[#7A6699] hover:shadow-lg transform hover:-translate-y-0.5"
                        }`}
                      >
                        {guild.is_disabled
                          ? "GUILD DISABLED"
                          : isUserMember(guild, currentUser)
                          ? "✓ JOINED"
                          : getJoinRequestStatus(guild.guild_id) === 'pending'
                          ? (
                              <span className="inline-flex items-center gap-1">
                                <span role="img" aria-label="pending">⏳</span>
                                <span>Request Pending Approval</span>
                              </span>
                            )
                          : getJoinRequestStatus(guild.guild_id) === 'declined'
                          ? "🔄 REAPPLY"
                          : "JOIN GUILD"}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-6 py-2 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed shadow-md"
                      >
                        NOT AVAILABLE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center border border-[#CDAA7D]/20">
              <div className="text-6xl mb-4">🏰</div>
              <h3 className="text-2xl font-bold text-[#2C1A1D] mb-4">No Guilds Available</h3>
              <p className="text-[#8B75AA] mb-6 max-w-md mx-auto">
                Be the first to create a guild and start building your adventuring community! Click the "Create a Guild" button above to get started.
              </p>
              {currentUser && (
                <button
                  onClick={openCreateGuildModal}
                  className="bg-[#8B75AA] text-white px-6 py-3 rounded-lg hover:bg-[#7A6699] transition-colors font-medium"
                >
                  Create Your First Guild
                </button>
              )}
            </div>
          )}
        </div>

        {/* Join Guild Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#F4F0E6] rounded-lg w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">Join Guild</h3>
              <p className="text-[#2C1A1D] mb-4">
                Why do you want to join this guild? Please provide a brief message to the guild admins.
              </p>
              <textarea
                className="w-full px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA] h-24 resize-none mb-4"
                placeholder="I want to join because..."
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitJoinRequest}
                  className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guild Overview Modal */}
        {showOverviewModal && selectedGuild && (
          <GuildOverviewModal
            isOpen={true}
            onClose={() => {
              console.log('🔍 Guild overview modal closing')
              setShowOverviewModal(false)
              setSelectedGuild(null)
            }}
            guild={selectedGuild}
            currentUser={currentUser}
            onJoinGuild={(guildId, message) => handleApplyForGuild(guildId, message)}
            onOpenChat={handleOpenChat}
            showToast={showToast}
          />
        )}


        {showChatModal && selectedGuild && (
          <GuildChatModal
            isOpen={true}
            onClose={() => setShowChatModal(false)}
            guild={selectedGuild}
            currentUser={currentUser}
            showToast={showToast}
            userMemberships={{
              [selectedGuild.guild_id]: userMemberships[selectedGuild.guild_id] || false
            }}
            token={typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : ""}
          />
        )}

        {/* Guild Warning Modal */}
        {selectedGuild && showWarningModal && (
          <GuildWarningModal
            isOpen={showWarningModal}
            onClose={() => {
              console.log('Closing warning modal from Guild Hall');
              setShowWarningModal(false);
              setSelectedGuild(null);
            }}
            guild={selectedGuild}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {/* Report Guild Modal */}
        {showReportModal && reportingGuild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-[#2C1A1D] mb-2">Report Guild</h3>
                <p className="text-[#8B75AA]">Report "{reportingGuild.name}" for inappropriate content or behavior</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">
                    Reason for reporting *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA] focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="fake_information">Fake Information</option>
                    <option value="scam">Scam/Fraud</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    placeholder="Provide more details about the issue..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA] focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportingGuild(null);
                    setReportReason('');
                    setReportMessage('');
                  }}
                  className="px-4 py-2 text-[#8B75AA] hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={reportSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason.trim() || reportSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEBUG: Show modal state */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
            Modal State: {showWarningModal ? 'OPEN' : 'CLOSED'}<br/>
            Selected Guild: {selectedGuild?.name || 'NONE'}
          </div>
        )}

        {/* Features Section */}
        <section>
          <h2 className="text-4xl font-bold text-center mb-4 text-[#2C1A1D] font-serif">Why Join Our Tavern?</h2>
          <p className="text-center text-[#8B75AA] mb-12">
            PEERQUEST TAVERN OFFERS UNIQUE FEATURES TO ENHANCE YOUR COLLABORATIVE JOURNEY.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Skill Showcase */}
            <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#2C1A1D]">Skill Showcase</h3>
              <p className="text-[#8B75AA] leading-relaxed">
                DISPLAY YOUR TALENTS THROUGH COMPLETED QUESTS AND BUILD A PORTFOLIO THAT SHOWCASES YOUR ABILITIES TO
                POTENTIAL COLLABORATORS.
              </p>
            </div>

            {/* Guild System */}
            <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#2C1A1D]">Guild System</h3>
              <p className="text-[#8B75AA] leading-relaxed">
                JOIN SPECIALIZED GUILDS TO CONNECT WITH LIKE-MINDED INDIVIDUALS, SHARE RESOURCES, AND COLLABORATE ON
                LARGER PROJECTS.
              </p>
            </div>

            {/* Reputation System */}
            <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#2C1A1D]">Reputation System</h3>
              <p className="text-[#8B75AA] leading-relaxed">
                EARN BADGES AND INCREASE YOUR REPUTATION BY SUCCESSFULLY COMPLETING QUESTS AND RECEIVING POSITIVE
                FEEDBACK FROM OTHER ADVENTURERS.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
