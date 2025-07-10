"use client"

import { useState, useEffect } from "react"
import type { User, Quest, Guild } from "@/lib/types"
import { ChevronDown } from "lucide-react"
import { formatJoinDate } from "@/lib/date-utils"

// Type for props
type IntegratedProfileProps = {
  currentUser: User;
  quests: Quest[];
  guilds: Guild[];
  navigateToSection?: (section: string) => void;
  defaultTab?: "overview" | "quests" | "guilds" | "achievements";
};

// Import API for fetching user skills
import { skillsApi } from "@/lib/api"

export function IntegratedProfile({ currentUser, quests, guilds, navigateToSection, defaultTab = "overview" }: IntegratedProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements">(defaultTab);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  // Fetch user skills on mount
  useEffect(() => {
    const fetchSkills = async () => {
      setSkillsLoading(true);
      setSkillsError(null);
      try {
        const res = await skillsApi.getUserSkills();
        if (res && res.success && Array.isArray(res.skills)) {
          setUserSkills(res.skills);
        } else {
          setUserSkills([]);
        }
      } catch (err) {
        setSkillsError("Could not load skills.");
        setUserSkills([]);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
  }, [currentUser?.id]);


  // Filter quests by status (robust fallback)
  const activeQuests = Array.isArray(quests)
    ? quests.filter((q) => q.status === "in_progress" && Array.isArray(q.applicants) && q.applicants.some(app => app.userId === currentUser.id && app.status === "accepted"))
    : [];
  const createdQuests = Array.isArray(quests)
    ? quests.filter((q) => q.poster && q.poster.id === currentUser.id)
    : [];
  const completedQuests = Array.isArray(quests)
    ? quests.filter((q) => q.status === "completed" && Array.isArray(q.applicants) && q.applicants.some(app => app.userId === currentUser.id && app.status === "accepted"))
    : [];

  // Get user's guilds from currentUser.guilds or fallback to prop
  let userGuilds: Guild[] = [];
  if (Array.isArray(currentUser.guilds) && currentUser.guilds.length > 0) {
    // If currentUser.guilds is an array of guild objects or ids
    if (typeof currentUser.guilds[0] === 'object') {
      userGuilds = currentUser.guilds as Guild[];
    } else if (typeof currentUser.guilds[0] === 'number' || typeof currentUser.guilds[0] === 'string') {
      userGuilds = guilds.filter(g =>
        Array.isArray(currentUser.guilds) &&
        currentUser.guilds.some((id: any) => id === g.id)
      );
    }
  } else if (Array.isArray(guilds)) {
    // fallback: show all guilds if userGuilds is not available
    userGuilds = guilds;
  }

  // Robustly get avatar and join date from all possible backend fields
  const getAvatar = (u: any) => {
    let avatar = u?.avatar || u?.avatar_url;
    if (!avatar && typeof u?.avatar_data === 'string' && u.avatar_data.startsWith('data:')) {
      avatar = u.avatar_data;
    }
    if (typeof avatar !== 'string' || !(avatar.startsWith('http') || avatar.startsWith('data:'))) {
      avatar = '/default-avatar.png';
    }
    return avatar;
  };
  const getJoinDate = (u: any) => {
    let dateRaw = u.createdAt || u.dateJoined || u.date_joined;
    if (dateRaw && dateRaw !== 'null' && dateRaw !== 'undefined') {
      let dateStr = typeof dateRaw === 'string' ? dateRaw : String(dateRaw);
      try {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString();
        }
        return formatJoinDate(dateStr, { capitalizeFirst: true });
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  const avatar = getAvatar(currentUser);
  const joinDate = getJoinDate(currentUser);
  // Calculate XP progress
  const xpForNextLevel = 1000; // Example value
  const xpProgress = typeof currentUser.xp === 'number' && currentUser.xp > 0
    ? ((currentUser.xp % xpForNextLevel) / xpForNextLevel) * 100
    : 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "quests", label: "Quests" },
    { id: "guilds", label: "Guilds" },
    { id: "achievements", label: "Achievements" },
  ]

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#f4ecd6] via-[#f9f6f1] to-[#e7d6b7] font-serif">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-[#2C1A1D]/95 to-[#8B75AA]/90 text-white p-6 sm:p-8 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-[#CDAA7D] to-[#8B75AA] rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-bold flex-shrink-0 overflow-hidden relative shadow-2xl border-4 border-[#fff7e0]/20">
              {avatar && (avatar.startsWith('http') || avatar.startsWith('data:')) && !avatarError ? (
                <img
                  src={avatar}
                  alt={`${currentUser.username}'s avatar`}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-[#2C1A1D] select-none text-center drop-shadow-lg">
                  {currentUser.username?.[0]?.toUpperCase() || "👤"}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#fff7e0] drop-shadow-lg tracking-wide">{currentUser.username || "HeroicAdventurer"}</h2>
              <p className="text-[#CDAA7D] text-lg font-semibold mt-1 drop-shadow-sm">Novice Adventurer</p>

              {/* Level Bar */}
              <div className="mt-6 max-w-md mx-auto sm:mx-0">
                <div className="flex justify-between text-sm mb-2 text-[#fff7e0] font-medium">
                  <span>Level Progress</span>
                  <span>{currentUser.xp} XP</span>
                </div>
                <div className="w-full bg-[#2C1A1D]/60 rounded-2xl h-4 shadow-inner backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-[#CDAA7D] to-[#8B75AA] h-4 rounded-2xl shadow-lg transition-all duration-300" style={{ width: `${xpProgress}%` }}></div>
                </div>
              </div>
            </div>

            {/* Join Date */}
            <div className="text-center sm:text-right bg-[#fff7e0]/10 backdrop-blur-sm rounded-2xl p-4 border border-[#fff7e0]/20">
              <div className="text-sm text-[#CDAA7D] font-medium">Member since</div>
              <div className="text-[#fff7e0] font-semibold mt-1">
                {joinDate ? joinDate : <span className="text-gray-300">Unknown</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Dropdown */}
      <div className="sm:hidden border-b border-[#CDAA7D]/30 bg-[#fff7e0]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full px-6 py-4 flex items-center justify-between text-[#2C1A1D] font-semibold hover:bg-[#fff7e0]/90 transition-colors rounded-lg"
          >
            <span>{tabs.find((tab) => tab.id === activeTab)?.label}</span>
            <ChevronDown size={18} className={`transition-transform duration-300 ${showMobileMenu ? "rotate-180" : ""}`} />
          </button>
          {showMobileMenu && (
            <div className="border-t border-[#CDAA7D]/30 bg-[#fff7e0]/90 backdrop-blur-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    setShowMobileMenu(false)
                  }}
                  className={`w-full px-6 py-3 text-left font-medium transition-colors ${
                    activeTab === tab.id ? "bg-[#8B75AA] text-white" : "text-[#2C1A1D] hover:bg-[#fff7e0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block border-b border-[#CDAA7D]/30 bg-[#fff7e0]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-4 font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? "border-b-3 border-[#8B75AA] text-[#8B75AA] bg-[#fff7e0]/60"
                  : "text-[#2C1A1D] hover:text-[#8B75AA] hover:bg-[#fff7e0]/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Stats */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">📊</span>
                Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#fff7e0]/60 rounded-2xl p-3 border border-[#CDAA7D]/20">
                  <span className="font-medium text-[#2C1A1D]">Quests Completed:</span>
                  <span className="font-bold text-[#8B75AA] text-lg">{
                    Array.isArray(completedQuests) ? completedQuests.length : 0
                  }</span>
                </div>
                <div className="flex justify-between items-center bg-[#fff7e0]/60 rounded-2xl p-3 border border-[#CDAA7D]/20">
                  <span className="font-medium text-[#2C1A1D]">Quests Created:</span>
                  <span className="font-bold text-[#8B75AA] text-lg">{
                    Array.isArray(createdQuests) ? createdQuests.length : 0
                  }</span>
                </div>
                <div className="flex justify-between items-center bg-[#fff7e0]/60 rounded-2xl p-3 border border-[#CDAA7D]/20">
                  <span className="font-medium text-[#2C1A1D]">Guilds Joined:</span>
                  <span className="font-bold text-[#8B75AA] text-lg">{
                    Array.isArray(userGuilds) ? userGuilds.length : 0
                  }</span>
                </div>
                <div className="flex justify-between items-center bg-gradient-to-r from-[#CDAA7D]/20 to-[#8B75AA]/20 rounded-2xl p-3 border border-[#CDAA7D]/30">
                  <span className="font-medium text-[#2C1A1D]">Gold:</span>
                  <span className="font-bold text-[#CDAA7D] text-lg flex items-center">
                    <span className="mr-1">🪙</span>
                    {typeof currentUser.gold === 'number' ? currentUser.gold : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">📜</span>
                About
              </h3>
              <p className="text-[#2C1A1D] text-sm leading-relaxed bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">
                {currentUser.bio || "Experienced adventurer looking for challenging quests and meaningful connections in the tavern."}
              </p>
            </div>

            {/* Skills */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">⚔️</span>
                Skills
              </h3>
              {skillsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]"></div>
                  <span className="ml-2 text-[#2C1A1D]">Loading skills...</span>
                </div>
              ) : skillsError ? (
                <p className="text-red-500 text-sm bg-red-50 rounded-2xl p-3 border border-red-200">{skillsError}</p>
              ) : userSkills.length === 0 ? (
                <p className="text-[#2C1A1D]/60 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">No skills listed yet.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {userSkills.map((skill: any) => (
                    <span
                      key={skill.skill_id || skill.id}
                      className="px-4 py-2 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white rounded-2xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      title={skill.proficiency_level ? `Proficiency: ${skill.proficiency_level}, Years: ${skill.years_experience}` : undefined}
                    >
                      {skill.name || skill.skill_name || skill.skill?.name || skill.skill_id}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300 md:col-span-3">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">📖</span>
                Recent Activity
              </h3>
              <p className="text-[#2C1A1D]/60 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">No recent activity to display.</p>
            </div>
          </div>
        )}

        {/* Quests Tab */}
        {activeTab === "quests" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Active Quests */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">⚡</span>
                Active Quests
              </h3>
              {activeQuests.length > 0 ? (
                <div className="space-y-4">
                  {activeQuests.map((quest) => (
                    <div key={quest.id} className="bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20 hover:border-[#8B75AA]/40 transition-all duration-300">
                      <h4 className="font-bold text-[#2C1A1D] mb-2">{quest.title}</h4>
                      <p className="text-sm text-[#2C1A1D]/80 mb-3 leading-relaxed">{quest.description}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                        <span className="bg-[#CDAA7D]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Reward: {quest.reward} Gold</span>
                        <span className="bg-[#8B75AA]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Due: {quest.deadline ? new Date(quest.deadline).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#2C1A1D]/60 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">No active quests.</p>
              )}
            </div>

            {/* Created Quests */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">🛠️</span>
                Created Quests
              </h3>
              {createdQuests.length > 0 ? (
                <div className="space-y-4">
                  {createdQuests.map((quest) => (
                    <div key={quest.id} className="bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20 hover:border-[#8B75AA]/40 transition-all duration-300">
                      <h4 className="font-bold text-[#2C1A1D] mb-2">{quest.title}</h4>
                      <p className="text-sm text-[#2C1A1D]/80 mb-3 leading-relaxed">{quest.description}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                        <span className="bg-[#CDAA7D]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Reward: {quest.reward} Gold</span>
                        <span className="bg-[#8B75AA]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Status: {quest.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#2C1A1D]/60 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">No created quests.</p>
              )}
            </div>

            {/* Completed Quests */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">✅</span>
                Completed Quests
              </h3>
              {completedQuests.length > 0 ? (
                <div className="space-y-4">
                  {completedQuests.map((quest) => (
                    <div key={quest.id} className="bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20 hover:border-[#8B75AA]/40 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
                        <h4 className="font-bold text-[#2C1A1D]">{quest.title}</h4>
                        <span className="text-[#8B75AA] font-bold bg-[#8B75AA]/20 px-3 py-1 rounded-xl text-sm">{quest.xp} XP</span>
                      </div>
                      <p className="text-sm text-[#2C1A1D]/80 mb-3 leading-relaxed">
                        Looking for a skilled writer to create lore and stories about the PeerQuest Tavern's history.
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                        <span className="bg-[#CDAA7D]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Completed: {new Date(quest.completedAt || Date.now()).toLocaleDateString()}</span>
                        <button className="text-[#8B75AA] hover:text-[#CDAA7D] cursor-pointer font-medium bg-[#8B75AA]/10 hover:bg-[#8B75AA]/20 px-3 py-1 rounded-xl transition-all duration-300">VIEW DETAILS</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#2C1A1D]/60 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">No completed quests.</p>
              )}
            </div>
          </div>
        )}

        {/* Guilds Tab */}
        {activeTab === "guilds" && (
          <div>
            {userGuilds.length > 0 ? (
              <div className="space-y-6">
                {/* Mystic Brewers Guild */}
                <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl border-2 border-[#CDAA7D]/40 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2C1A1D] to-[#8B75AA] rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                        🧪
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-[#2C1A1D]">Mystic Brewers Guild</h3>
                        <p className="text-[#8B75AA] font-semibold bg-[#8B75AA]/10 px-3 py-1 rounded-xl text-sm inline-block">Alchemy</p>
                      </div>
                    </div>
                    <p className="text-[#2C1A1D]/80 text-sm leading-relaxed mb-4 bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">
                      A guild dedicated to the art of potion-making and alchemy. We share recipes, techniques, and
                      collaborate on complex brewing projects.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                      <span className="bg-[#CDAA7D]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">3 members</span>
                      <span className="bg-[#8B75AA]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Created: 4/15/2023</span>
                    </div>
                  </div>
                </div>

                {/* Tavern Defenders */}
                <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl border-2 border-[#CDAA7D]/40 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2C1A1D] to-[#8B75AA] rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                        🛡️
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-[#2C1A1D]">Tavern Defenders</h3>
                        <p className="text-[#8B75AA] font-semibold bg-[#8B75AA]/10 px-3 py-1 rounded-xl text-sm inline-block">Protection</p>
                      </div>
                    </div>
                    <p className="text-[#2C1A1D]/80 text-sm leading-relaxed mb-4 bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">
                      The official guild for those who help protect and maintain the PeerQuest Tavern. Members get
                      priority on tavern-related quests.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                      <span className="bg-[#CDAA7D]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">2 members</span>
                      <span className="bg-[#8B75AA]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Created: 2/10/2023</span>
                    </div>
                  </div>
                </div>

                {/* Creative Crafters */}
                <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl border-2 border-[#CDAA7D]/40 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2C1A1D] to-[#8B75AA] rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                        🎨
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-[#2C1A1D]">Creative Crafters</h3>
                        <p className="text-[#8B75AA] font-semibold bg-[#8B75AA]/10 px-3 py-1 rounded-xl text-sm inline-block">Art & Design</p>
                      </div>
                      <div className="bg-gradient-to-r from-[#CDAA7D] to-[#8B75AA] text-white text-xs px-3 py-2 rounded-2xl font-bold shadow-lg">Guild Master</div>
                    </div>
                    <p className="text-[#2C1A1D]/80 text-sm leading-relaxed mb-4 bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">
                      A guild for artists, designers, and creators of all kinds. We collaborate on creative projects and
                      share techniques.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                      <span className="bg-[#CDAA7D]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">1 member</span>
                      <span className="bg-[#8B75AA]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Created: 6/20/2023</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-[#CDAA7D]/40 text-center shadow-xl">
                <div className="text-6xl mb-4">🏰</div>
                <p className="text-[#2C1A1D]/60 mb-6 text-lg font-medium">No guilds joined yet</p>
                <p className="text-[#2C1A1D]/40 text-sm bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">Browse the Guild Hall to find and join guilds that match your interests!</p>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-[#CDAA7D]/40 text-center shadow-xl">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-[#2C1A1D]/60 text-lg font-medium">No achievements yet.</p>
            <p className="text-[#2C1A1D]/40 text-sm mt-4 bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">Complete quests and participate in guild activities to earn achievements!</p>
          </div>
        )}
      </div>
    </section>
  )
}
