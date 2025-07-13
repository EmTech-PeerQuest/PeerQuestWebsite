"use client"

import { useState, useEffect } from "react"
import { reportUser } from "@/lib/api/user-report"
import { X, Mail, Calendar, MapPin, Star, Trophy, Users } from "lucide-react"
import type { User, Quest, Guild } from "@/lib/types"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  quests: Quest[]
  guilds: Guild[]
  currentUser: User | null
  showToast?: (message: string, type?: string) => void
}


// Extend User type to allow achievements for modal display
interface Achievement {
  id: string | number;
  achievement_type?: string;
  achievement_name?: string;
  name?: string;
  description?: string;
  earned_at?: string;
  icon?: string;
}
interface UserWithAchievements extends User {
  achievements?: Achievement[];
}

import api from "@/lib/api";


export function UserProfileModal({ isOpen, onClose, user, quests, guilds, currentUser }: UserProfileModalProps) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'skills' | 'badges' | 'quests' | 'guilds'>('about');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);

  // Fetch achievements when modal opens or user changes
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    setAchievementsLoading(true);
    setAchievementsError(null);
    const fetchAchievements = async () => {
      try {
        let res;
        try {
          res = await api.get(`/users/${user.id}/achievements-full/`);
        } catch (err) {
          res = await api.get(`/api/achievements/?user_id=${user.id}`);
        }
        // Accept both {owned: [], unowned: []} and flat array
        let owned: Achievement[] = [];
        if (Array.isArray(res.data?.owned)) {
          owned = res.data.owned;
        } else if (Array.isArray(res.data)) {
          owned = res.data;
        } else if (Array.isArray(res.data?.achievements)) {
          owned = res.data.achievements;
        }
        setAchievements(owned);
      } catch (err) {
        setAchievementsError("Could not load achievements.");
        setAchievements([]);
      } finally {
        setAchievementsLoading(false);
      }
    };
    fetchAchievements();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Get user's completed quests
  const userQuests = quests.filter(quest => 
    (quest.poster && quest.poster.id === user.id) || quest.status === 'completed'
  ).slice(0, 5); // Show only first 5

  // Get user's guilds
  const userGuilds = user.guilds?.slice(0, 3) || [];

  // Helper to get avatar initials (matches user grid logic)
  function getAvatarInitials(user: User) {
    if (user.displayName) {
      // Use first word (first name) or first two initials
      const words = user.displayName.trim().split(" ");
      if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return words[0].slice(0, 5).toUpperCase();
    }
    if (user.username) {
      // Use up to first 5 non-numeric chars
      const match = user.username.match(/[a-zA-Z]+/);
      return match ? match[0].slice(0, 5).toUpperCase() : user.username.slice(0, 2).toUpperCase();
    }
    return "?";
  }

  // Dynamic XP/Level logic from backend profile (supports both xp and experience_points fields)
  const userXp = typeof user.xp === 'number' ? user.xp : (typeof user.experience_points === 'number' ? user.experience_points : 0);
  // If backend provides level, use it, else calculate
  const userLevel = typeof user.level === 'number' && user.level > 0
    ? user.level
    : (userXp > 0 ? Math.floor(userXp / 1000) + 1 : 1);
  const xpForNextLevel = 1000;
  const xpThisLevel = userXp % xpForNextLevel;
  const xpProgress = (xpThisLevel / xpForNextLevel) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#CDAA7D] max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all">
        {/* Header/Profile Row */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-0 md:gap-6 bg-gradient-to-r from-[#CDAA7D] to-[#8B75AA] p-8 rounded-t-2xl relative">
          {/* Avatar Left */}
          <div className="flex-shrink-0 flex items-center justify-center md:items-start md:justify-start w-full md:w-48 mb-4 md:mb-0">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-[#8B75AA] flex items-center justify-center text-5xl text-white overflow-hidden">
              {typeof user.avatar_url === 'string' && user.avatar_url.match(/^https?:\//) ? (
                <img
                  src={user.avatar_url}
                  alt={user.displayName || user.username}
                  className="w-full h-full object-cover rounded-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span>{getAvatarInitials(user)}</span>
              )}
            </div>
          </div>
          {/* Info Right */}
          <div className="flex-1 flex flex-col items-center md:items-start w-full">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#2C1A1D] hover:text-[#fff] bg-white/40 hover:bg-[#CDAA7D] rounded-full p-1 transition"
              aria-label="Close"
            >
              <X size={28} />
            </button>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-sm text-center md:text-left">
              {user.displayName || user.username}
            </h2>
            <p className="text-white/80 text-lg mb-1">@{user.username}</p>
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="bg-[#8B75AA] text-white text-sm px-4 py-1 rounded-full font-semibold shadow">Level {userLevel}</span>
                <span className="bg-[#2C1A1D] text-white text-sm px-4 py-1 rounded-full font-semibold shadow">{xpThisLevel} / {xpForNextLevel} XP</span>
                {user.roleDisplay && (
                  <span className="bg-[#CDAA7D] text-[#2C1A1D] text-sm px-4 py-1 rounded-full font-semibold shadow">{user.roleDisplay}</span>
                )}
              </div>
              {/* XP Progress Bar */}
              <div className="w-full bg-[#2C1A1D] rounded-full h-2">
                <div className="bg-[#CDAA7D] h-2 rounded-full transition-all duration-300" style={{ width: `${xpProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E9E1F5] bg-[#F9F7F2] px-6 pt-2 gap-2">
          <button className={`py-2 px-4 font-semibold rounded-t-lg transition-colors ${activeTab === 'about' ? 'bg-white text-[#8B75AA]' : 'text-[#2C1A1D] hover:bg-[#F4F0E6]'}`} onClick={() => setActiveTab('about')}>About</button>
          <button className={`py-2 px-4 font-semibold rounded-t-lg transition-colors ${activeTab === 'skills' ? 'bg-white text-[#8B75AA]' : 'text-[#2C1A1D] hover:bg-[#F4F0E6]'}`} onClick={() => setActiveTab('skills')}>Skills</button>
          <button className={`py-2 px-4 font-semibold rounded-t-lg transition-colors ${activeTab === 'badges' ? 'bg-white text-[#8B75AA]' : 'text-[#2C1A1D] hover:bg-[#F4F0E6]'}`} onClick={() => setActiveTab('badges')}>Badges</button>
          <button className={`py-2 px-4 font-semibold rounded-t-lg transition-colors ${activeTab === 'quests' ? 'bg-white text-[#8B75AA]' : 'text-[#2C1A1D] hover:bg-[#F4F0E6]'}`} onClick={() => setActiveTab('quests')}>Quests</button>
          <button className={`py-2 px-4 font-semibold rounded-t-lg transition-colors ${activeTab === 'guilds' ? 'bg-white text-[#8B75AA]' : 'text-[#2C1A1D] hover:bg-[#F4F0E6]'}`} onClick={() => setActiveTab('guilds')}>Guilds</button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'about' && (
            <>
          {/* Report User Button & Form (only for non-staff/non-superusers) */}
          {currentUser && currentUser.id !== user.id && !(user.is_superuser || user.isSuperuser || user.is_staff) && (
            <div className="mb-6">
              {!showReportForm ? (
                <button
                  className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold"
                  onClick={() => setShowReportForm(true)}
                >
                  🏳️ Report User
                </button>
              ) : (
                <form
                  className="bg-[#F4F0E6] p-4 rounded-lg mt-4 flex flex-col gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    setReportSuccess(null);
                    setReportError(null);
                    try {
                      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                      if (!token) throw new Error('You must be logged in.');
                      const res = await reportUser({
                        reportedUser: user.id,
                        reporter: currentUser.id,
                        reason: reportReason,
                        message: reportMessage,
                      }, token);
                      if (res.success) {
                        setReportSuccess('User reported successfully.');
                        setShowReportForm(false);
                        setReportReason("");
                        setReportMessage("");
                      } else {
                        setReportError(res.message || 'Failed to report user.');
                      }
                    } catch (err: any) {
                      setReportError(err.message || 'Failed to report user.');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <label className="font-medium text-[#2C1A1D]">Reason</label>
                  <select
                    className="px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none"
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="spam">Spam or scam</option>
                    <option value="abuse">Abusive or inappropriate behavior</option>
                    <option value="cheating">Cheating or unfair play</option>
                    <option value="impersonation">Impersonation</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="font-medium text-[#2C1A1D]">Message (optional)</label>
                  <textarea
                    className="px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none"
                    value={reportMessage}
                    onChange={e => setReportMessage(e.target.value)}
                    rows={3}
                    placeholder="Add more details (optional)"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold disabled:opacity-60"
                      disabled={submitting || !reportReason}
                    >
                      {submitting ? 'Reporting...' : 'Submit Report'}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-semibold"
                      onClick={() => setShowReportForm(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                  {reportSuccess && <div className="text-green-600 mt-2">{reportSuccess}</div>}
                  {reportError && <div className="text-red-600 mt-2">{reportError}</div>}
                </form>
              )}
            </div>
          )}
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-[#F4F0E6] rounded-lg">
              <Trophy className="w-6 h-6 mx-auto text-[#CDAA7D] mb-2" />
              <div className="font-bold text-[#2C1A1D]">{user.completedQuests || 0}</div>
              <div className="text-sm text-[#8B75AA]">Quests</div>
            </div>
            <div className="text-center p-4 bg-[#F4F0E6] rounded-lg">
              <Users className="w-6 h-6 mx-auto text-[#CDAA7D] mb-2" />
              <div className="font-bold text-[#2C1A1D]">{user.guilds?.length || 0}</div>
              <div className="text-sm text-[#8B75AA]">Guilds</div>
            </div>
            <div className="text-center p-4 bg-[#F4F0E6] rounded-lg">
              <Star className="w-6 h-6 mx-auto text-[#CDAA7D] mb-2" />
              <div className="font-bold text-[#2C1A1D]">{user.badges?.length || 0}</div>
              <div className="text-sm text-[#8B75AA]">Badges</div>
            </div>
          </div>

          {/* About */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">About</h3>
            <p className="text-[#2C1A1D]">
              {user.bio || "This adventurer hasn't shared their story yet."}
            </p>
          </div>

          {/* Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Details</h3>
            <div className="space-y-2">
              {user.birthday && (
                <div className="flex items-center gap-2 text-[#2C1A1D]">
                  <Calendar size={16} className="text-[#8B75AA]" />
                  <span>Born {new Date(user.birthday).toLocaleDateString()}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-2 text-[#2C1A1D]">
                  <MapPin size={16} className="text-[#8B75AA]" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.email && currentUser && (
                <div className="flex items-center gap-2 text-[#2C1A1D]">
                  <Mail size={16} className="text-[#8B75AA]" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {activeTab === 'skills' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills?.length ? (
                  user.skills?.map((skill, index) => {
                    let label = '';
                    if (typeof skill === 'object' && skill !== null) {
                      if ('name' in skill && typeof skill.name === 'string') label = skill.name;
                      else if ('skill_name' in skill && typeof skill.skill_name === 'string') label = skill.skill_name;
                      else label = JSON.stringify(skill);
                    } else {
                      label = String(skill);
                    }
                    return (
                      <span
                        key={typeof skill === 'object' && skill !== null ? (('id' in skill && skill.id) || ('skill_name' in skill && skill.skill_name) || index) : index}
                        className="px-3 py-1 bg-[#8B75AA]/10 text-[#8B75AA] rounded-full text-sm"
                      >
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-500 italic">No skills listed</span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Achievements</h3>
              {achievementsLoading ? (
                <div className="text-sm text-gray-500 italic">Loading achievements...</div>
              ) : achievementsError ? (
                <div className="text-sm text-red-500 italic">{achievementsError}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Array.isArray(achievements) && achievements.length > 0 ? (
                    achievements.map((achievement: any, index: number) => (
                      <div
                        key={achievement.id || index}
                        className="flex items-center gap-3 p-3 bg-[#F4F0E6] rounded-lg"
                      >
                        <span className="text-2xl">{achievement.icon || "🏅"}</span>
                        <div>
                          <div className="font-medium text-[#2C1A1D]">{achievement.achievement_name || achievement.name}</div>
                          {achievement.description && (
                            <div className="text-sm text-[#8B75AA]">{achievement.description}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No achievements unlocked</span>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Recent Quests</h3>
              <div className="space-y-2">
                {userQuests.length > 0 ? (
                  userQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="p-3 bg-[#F4F0E6] rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-[#2C1A1D]">{quest.title}</div>
                        <div className="text-sm text-[#8B75AA]">{typeof quest.category === 'string' ? quest.category : (quest.category?.name || '')}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        quest.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : quest.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {quest.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No recent quests</span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guilds' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Guilds</h3>
              <div className="space-y-2">
                {userGuilds.length > 0 ? (
                  userGuilds.map((guild, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[#F4F0E6] rounded-lg flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-[#8B75AA] rounded-lg flex items-center justify-center text-white overflow-hidden">
                        {typeof guild.emblem === 'string' && guild.emblem.match(/^https?:\/\//) ? (
                          <img
                            src={guild.emblem}
                            alt={guild.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span>{guild.name[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[#2C1A1D]">{guild.name}</div>
                        {guild.specialization && (
                          <div className="text-sm text-[#8B75AA]">{guild.specialization}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No guilds joined</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
