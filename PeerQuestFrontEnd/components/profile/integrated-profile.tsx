// Remove duplicate RecentActivity component definition (keep only one at the top of the file)
"use client"

import { useState, useEffect } from "react"
import { useGoldBalance } from "@/context/GoldBalanceContext";
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

// --- AchievementsSection and types ---

// ...existing code...
interface Achievement {
  id: string | number;
  achievement_type: string;
  achievement_name: string;
  description?: string;
  earned_at?: string;
}

function AchievementsSection({ userId }: { userId: string | number }) {
  const [owned, setOwned] = useState<Achievement[]>([]);
  const [unowned, setUnowned] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "owned" | "unowned">("all");

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use NEXT_PUBLIC_API_BASE_URL if set, else fallback to relative API route
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const achievementsUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/users/${userId}/achievements-full/` : `/users/${userId}/achievements-full/`;
        let res;
        try {
          res = await api.get(achievementsUrl);
        } catch (err) {
          // fallback endpoint if needed
          const fallbackUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/api/achievements/?user_id=${userId}` : `/api/achievements/?user_id=${userId}`;
          res = await api.get(fallbackUrl);
        }
        // Debug: log API response
        console.log('[Achievements] API response:', res.data);
        setOwned(Array.isArray(res.data?.owned) ? res.data.owned : []);
        setUnowned(Array.isArray(res.data?.unowned) ? res.data.unowned : []);
      } catch (err: any) {
        setError("Could not load achievements.");
        setOwned([]);
        setUnowned([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchAchievements();
  }, [userId]);

  // Filter/search logic
  const filterAchievements = (achievements: Achievement[]) => {
    return achievements.filter((ach) => {
      const searchLower = search.toLowerCase();
      return (
        ach.achievement_name.toLowerCase().includes(searchLower) ||
        (ach.description && ach.description.toLowerCase().includes(searchLower))
      );
    });
  };

  const filteredOwned = filterAchievements(owned);
  const filteredUnowned = filterAchievements(unowned);

  let showOwned = filter === "all" || filter === "owned";
  let showUnowned = filter === "all" || filter === "unowned";

  // Simple instructions for each locked achievement
  const getInstruction = (ach: Achievement) => {
    switch (ach.achievement_name) {
      case "First Quest":
        return "Complete any quest.";
      case "Quest Creator":
        return "Create a new quest.";
      case "Quest Streak":
        return "Complete 5 quests in a row.";
      case "Quest Master":
        return "Complete 20 quests.";
      case "Legendary Creator":
        return "Create 100 quests.";
      case "Guild Member":
        return "Join any guild.";
      case "Guild Leader":
        return "Create a guild.";
      case "Guild Contributor":
        return "Post a quest or message in your guild.";
      case "Legendary Guildmaster":
        return "Lead a guild with 20+ members.";
      case "Profile Complete":
        return "Fill out all profile fields.";
      case "Customizer":
        return "Change your profile avatar.";
      case "Skilled":
        return "Add your first skill.";
      case "XP Collector":
        return "Earn 100 XP.";
      case "XP Grinder":
        return "Earn 5000 XP.";
      case "Legendary XP":
        return "Earn 50000 XP.";
      case "Gold Digger":
        return "Earn 100 gold.";
      case "Gold Hoarder":
        return "Earn 1000 gold.";
      case "Legendary Gold":
        return "Earn 10000 gold.";
      case "Adventurer":
        return "Reach level 5.";
      case "Veteran":
        return "Reach level 10.";
      case "Legendary Adventurer":
        return "Reach level 50.";
      case "Social Butterfly":
        return "Send your first message.";
      case "Messenger":
        return "Send 10 messages.";
      case "Popular":
        return "Receive 10 messages.";
      case "Helper":
        return "Answer a question in the help forum.";
      case "Mentor":
        return "Share a tip in the community forum.";
      case "Reviewer":
        return "Leave your first comment on a quest.";
      case "Critic":
        return "Leave 10 comments on quests.";
      case "Legendary Reviewer":
        return "Leave 100 comments on quests.";
      case "Bug Finder":
        return "Report a bug or suggestion to the team.";
      case "Bug Smasher":
        return "Have a suggestion you made implemented.";
      case "Community Participant":
        return "Participate in a community poll or vote.";
      case "Community Winner":
        return "Win a community poll or be top voted in a discussion.";
      default:
        return "Unlock by being active on PeerQuest!";
    }
  };

  return (
    <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-[#CDAA7D]/40 shadow-xl">
      {/* Always show search/filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search achievements..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#CDAA7D]/40 bg-[#fff7e0]/80 text-[#2C1A1D] focus:outline-none focus:ring-2 focus:ring-[#8B75AA]/30 w-full sm:w-1/2"
        />
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            className={`px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${filter === "all" ? "bg-[#8B75AA] text-white border-[#8B75AA]" : "bg-[#fff7e0] text-[#2C1A1D] border-[#CDAA7D]/40"}`}
            onClick={() => setFilter("all")}
          >All</button>
          <button
            className={`px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${filter === "owned" ? "bg-[#8B75AA] text-white border-[#8B75AA]" : "bg-[#fff7e0] text-[#2C1A1D] border-[#CDAA7D]/40"}`}
            onClick={() => setFilter("owned")}
          >Unlocked</button>
          <button
            className={`px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${filter === "unowned" ? "bg-[#8B75AA] text-white border-[#8B75AA]" : "bg-[#fff7e0] text-[#2C1A1D] border-[#CDAA7D]/40"}`}
            onClick={() => setFilter("unowned")}
          >Locked</button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]" />
          <span className="ml-2 text-[#2C1A1D]">Loading achievements...</span>
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm bg-red-50 rounded-2xl p-3 border border-red-200">{error}</p>
      ) : !owned.length && !unowned.length ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center justify-center w-full">
            <span className="text-7xl sm:text-8xl mb-4 flex items-center justify-center">🏆</span>
          </div>
          <p className="text-[#2C1A1D]/60 text-lg font-medium text-center">No achievements yet.</p>
          <p className="text-[#2C1A1D]/40 text-sm mt-4 bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20 text-center">Complete quests and participate in guild activities to earn achievements!</p>
        </div>
      ) : (
        <>
          {/* Owned Achievements */}
          {showOwned && (
            <>
              <h4 className="text-lg font-bold text-[#8B75AA] mb-2">Unlocked Achievements</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {filteredOwned.length === 0 && <div className="col-span-2 text-[#2C1A1D]/60">No achievements unlocked yet.</div>}
                {filteredOwned.map((ach) => (
                  <div key={ach.id} className="bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20 text-left shadow hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🏅</span>
                      <span className="font-bold text-[#8B75AA] text-lg">{ach.achievement_name}</span>
                    </div>
                    <div className="text-[#2C1A1D] text-sm mb-1">{ach.description}</div>
                    <div className="text-xs text-[#CDAA7D]">{ach.earned_at ? `Earned: ${new Date(ach.earned_at).toLocaleDateString()}` : null}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Unowned Achievements */}
          {showUnowned && (
            <>
              <h4 className="text-lg font-bold text-[#CDAA7D] mb-2">Locked Achievements</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredUnowned.length === 0 && <div className="col-span-2 text-[#2C1A1D]/40">All achievements unlocked!</div>}
                {filteredUnowned.map((ach) => (
                  <div key={ach.id} className="bg-[#e0e0e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20 text-left shadow relative opacity-60 grayscale">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🏅</span>
                      <span className="font-bold text-[#8B75AA] text-lg">{ach.achievement_name}</span>
                    </div>
                    <div className="text-[#2C1A1D] text-sm mb-1">{ach.description}</div>
                    <div className="text-xs text-[#CDAA7D]">Locked</div>
                    <div className="text-xs text-[#2C1A1D]/70 mt-2 italic">How to unlock: {getInstruction(ach)}</div>
                    <div className="absolute inset-0 bg-[#fff] opacity-30 rounded-2xl pointer-events-none" />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}


// Import API for fetching user skills and achievements
import { skillsApi } from "@/lib/api";
import api from "@/lib/api";
import { guildApi } from "@/lib/api/guilds";
import { QuestAPI } from "@/lib/api/quests";
import React from "react";
import RecentActivity from "./RecentActivity";


function IntegratedProfile({ currentUser, quests: propQuests, guilds: propGuilds, navigateToSection, defaultTab = "overview" }: IntegratedProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "quests" | "guilds" | "achievements">(defaultTab);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  // --- GUILD/QUEST API STATE ---
  const [userGuilds, setUserGuilds] = useState<Guild[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [guildsError, setGuildsError] = useState<string | null>(null);
  const [allGuilds, setAllGuilds] = useState<Guild[]>([]);

  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [questsError, setQuestsError] = useState<string | null>(null);

  // --- Fetch user skills ---
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

  // --- Fetch all guilds and user's member guilds (API logic from enhanced-guild-management) ---
  useEffect(() => {
    const fetchGuilds = async () => {
      setGuildsLoading(true);
      setGuildsError(null);
      try {
        // Always fetch all guilds from API for freshest data
        let guildList: Guild[] = await guildApi.getGuilds();
        setAllGuilds(guildList);
        // Now, check membership for each guild using API data only
        const memberGuilds: Guild[] = [];
        await Promise.all(
          guildList.map(async (guild) => {
            try {
              // Ensure id is string
              const guildId = String((guild as any).guild_id ?? guild.id ?? "");
              if (!guildId) return;
              const members = await guildApi.getGuildMembers(guildId);
              const isMember = members.some((membership: any) =>
                String(membership.user.id) === String(currentUser.id) &&
                membership.status === 'approved' &&
                membership.is_active
              );
              if (isMember) {
                // Attach members count for member count (store as .members: number)
                memberGuilds.push({ ...guild, members: Array.isArray(members) ? members.length : 1 });
              }
            } catch (err) {
              // Ignore errors for individual guilds
            }
          })
        );
        setUserGuilds(memberGuilds);
      } catch (err) {
        setGuildsError("Could not load guilds.");
        setUserGuilds([]);
      } finally {
        setGuildsLoading(false);
      }
    };
    if (currentUser?.id) fetchGuilds();
  }, [currentUser?.id]);

  // --- Fetch all quests and filter by user (API logic from quest-management) ---
  useEffect(() => {
    const fetchQuests = async () => {
      setQuestsLoading(true);
      setQuestsError(null);
      try {
        let all: Quest[] = [];
        if (Array.isArray(propQuests) && propQuests.length > 0) {
          all = propQuests;
        } else {
          // Always fetch fresh from API for up-to-date data
          const questResponse = await QuestAPI.getQuests();
          if (Array.isArray(questResponse)) {
            all = questResponse;
          } else if (questResponse && Array.isArray(questResponse.results)) {
            all = questResponse.results;
          } else if (questResponse && Array.isArray(questResponse.value)) {
            all = questResponse.value;
          }
        }
        setAllQuests(all);
      } catch (err) {
        setQuestsError("Could not load quests.");
        setAllQuests([]);
      } finally {
        setQuestsLoading(false);
      }
    };
    if (currentUser?.id) fetchQuests();
  }, [currentUser?.id, propQuests]);

  // --- Filter quests by user (API logic from quest-management) ---
  const createdQuests = allQuests.filter((quest: any) => String(quest.creator?.id || quest.poster?.id) === String(currentUser?.id));
  const activeQuests = allQuests.filter((quest: any) => {
    if (String(quest.creator?.id || quest.poster?.id) === String(currentUser?.id)) return false;
    // Check participants_detail or applicants or assigned_to
    const isInParticipants = Array.isArray(quest.participants_detail)
      ? quest.participants_detail.some((p: any) => String(p.user?.id) === String(currentUser?.id))
      : false;
    const isAssignedTo = quest.assigned_to && String(quest.assigned_to.id) === String(currentUser?.id);
    const isApplicantAccepted = Array.isArray(quest.applicants)
      ? quest.applicants.some((app: any) => app.userId === currentUser.id && app.status === "accepted")
      : false;
    return (
      (quest.status === "in_progress" || quest.status === "active") && (isInParticipants || isAssignedTo || isApplicantAccepted)
    );
  });
  const completedQuests = allQuests.filter((quest: any) => {
    if (String(quest.creator?.id || quest.poster?.id) === String(currentUser?.id)) return false;
    const isInParticipants = Array.isArray(quest.participants_detail)
      ? quest.participants_detail.some((p: any) => String(p.user?.id) === String(currentUser?.id))
      : false;
    const isAssignedTo = quest.assigned_to && String(quest.assigned_to.id) === String(currentUser?.id);
    const isApplicantAccepted = Array.isArray(quest.applicants)
      ? quest.applicants.some((app: any) => app.userId === currentUser.id && app.status === "accepted")
      : false;
    return (
      quest.status === "completed" && (isInParticipants || isAssignedTo || isApplicantAccepted)
    );
  });

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
  // Fetch XP ONLY from Users table (top-level fields only, never from profile)
  const getInitialXp = (u: any) => {
    if (typeof u.xp === 'number') return u.xp;
    if (typeof u.experience_points === 'number') return u.experience_points;
    return 0;
  };

  const [userXp, setUserXp] = useState<number>(() => {
    const xp = getInitialXp(currentUser);
    return (typeof xp === 'number' && !isNaN(xp) && xp >= 0) ? xp : 0;
  });

  // Use global gold balance from context
  const { goldBalance, loading: goldLoading } = useGoldBalance();

  // When currentUser changes, only update userXp if the new value is valid (from Users table only)
  useEffect(() => {
    const xp = getInitialXp(currentUser);
    console.log('[Profile] currentUser XP on prop change:', xp, currentUser);
    if (typeof xp === 'number' && !isNaN(xp) && xp >= 0) {
      setUserXp(xp);
    }
    // Gold is now handled by context
  }, [currentUser]);
  const [xpLoading, setXpLoading] = useState(false);
  const [xpError, setXpError] = useState<string | null>(null);

  // Only update XP if the API returns a new value from Users table (never from profile)
  useEffect(() => {
    let isMounted = true;
    const fetchUserXp = async () => {
      setXpLoading(true);
      setXpError(null);
      try {
        const res = await api.get('/users/me/');
        const data = res && res.data ? res.data : res;
        // Only use top-level XP fields from Users table
        let xp = undefined;
        if (typeof data.xp === 'number') xp = data.xp;
        else if (typeof data.experience_points === 'number') xp = data.experience_points;
        console.log('[Profile] API XP:', xp, data);
        // Only update if xp is a valid non-negative number and not undefined/null/NaN
        if (isMounted && typeof xp === 'number' && !isNaN(xp) && xp >= 0 && xp !== userXp) {
          setUserXp(xp);
        } else if (isMounted && (typeof xp !== 'number' || isNaN(xp) || xp < 0)) {
          // Don't update, but warn for debugging
          console.warn('XP fetch: invalid or missing XP value from API (Users table only):', xp, data);
        }
        // Gold logic unchanged, but avoid redeclaration
        let gold;
        if (typeof data.gold === 'number') gold = data.gold;
        else if (typeof data.gold_balance === 'number') gold = Number(data.gold_balance);
        else if (data.profile && typeof data.profile.gold === 'number') gold = data.profile.gold;
        else if (data.profile && typeof data.profile.gold_balance === 'number') gold = Number(data.profile.gold_balance);
        // Gold is now handled by context, do not set or check userGold here
        // if (isMounted && typeof gold === 'number' && !isNaN(gold) && gold >= 0 && gold !== userGold) {
        //   setUserGold(gold);
        // } else if (isMounted && (typeof gold !== 'number' || isNaN(gold) || gold < 0)) {
        //   console.warn('Gold fetch: invalid or missing gold value from API:', gold, data);
        // }
      } catch (err) {
        if (isMounted) setXpError('Could not load XP/gold.');
      } finally {
        if (isMounted) setXpLoading(false);
      }
    };
    fetchUserXp();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

  // XP/Level calculation (robust: supports 1000 XP per level, fallback to 100 if needed)
  const xpForNextLevel = 1000;
  const userLevel = Math.floor(userXp / xpForNextLevel) + 1;
  const xpThisLevel = userXp % xpForNextLevel;
  const xpProgress = (xpThisLevel / xpForNextLevel) * 100;

  // Level title based on XP
  const getLevelTitle = (xp: number) => {
    if (xp >= 50000) return "Legendary Adventurer";
    if (xp >= 20000) return "Epic Adventurer";
    if (xp >= 10000) return "Veteran Adventurer";
    if (xp >= 5000) return "Seasoned Adventurer";
    if (xp >= 1000) return "Adventurer";
    if (xp >= 100) return "Rookie Adventurer";
    return "Novice Adventurer";
  };

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
              <p className="text-[#CDAA7D] text-lg font-semibold mt-1 drop-shadow-sm">{getLevelTitle(userXp)}</p>

              {/* Level Bar */}
              <div className="mt-6 max-w-md mx-auto sm:mx-0">
                <div className="flex justify-between text-sm mb-2 text-[#fff7e0] font-medium">
                  <span>Level {userLevel} Progress</span>
                  {xpLoading ? <span>Loading XP...</span> : <span>{userXp} XP</span>}
                </div>
                <div className="w-full bg-[#2C1A1D]/60 rounded-2xl h-4 shadow-inner backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-[#CDAA7D] to-[#8B75AA] h-4 rounded-2xl shadow-lg transition-all duration-300" style={{ width: `${xpProgress}%` }}></div>
                </div>
                {xpError && <div className="text-xs text-red-500 mt-1">{xpError}</div>}
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
                    {goldLoading ? "Loading..." : goldBalance}
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

            {/* Recent Activity (Dynamic, using notification logic) */}
            <div className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#CDAA7D]/40 shadow-xl hover:shadow-2xl transition-all duration-300 md:col-span-3">
              <h3 className="font-bold text-xl mb-6 text-[#2C1A1D] flex items-center">
                <span className="mr-2">📖</span>
                Recent Activity
              </h3>
              <RecentActivity userId={currentUser.id} />
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
            {guildsLoading ? (
              <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]" /><span className="ml-2 text-[#2C1A1D]">Loading guilds...</span></div>
            ) : guildsError ? (
              <div className="text-red-500 text-sm bg-red-50 rounded-2xl p-3 border border-red-200">{guildsError}</div>
            ) : userGuilds.length > 0 ? (
              <div className="space-y-6">
                {userGuilds.map((guild, idx) => (
                  <div key={guild.id || guild.guild_id || idx} className="bg-[#fff7e0]/90 backdrop-blur-sm rounded-3xl border-2 border-[#CDAA7D]/40 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#2C1A1D] to-[#8B75AA] rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                          {guild.emblem || "🏰"}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-[#2C1A1D]">{guild.name}</h3>
                          {guild.specialization && (
                            <p className="text-[#8B75AA] font-semibold bg-[#8B75AA]/10 px-3 py-1 rounded-xl text-sm inline-block">{guild.specialization}</p>
                          )}
                        </div>
                        {guild.owner && guild.owner.id === currentUser.id && (
                          <div className="bg-gradient-to-r from-[#CDAA7D] to-[#8B75AA] text-white text-xs px-3 py-2 rounded-2xl font-bold shadow-lg">Guild Master</div>
                        )}
                      </div>
                      <p className="text-[#2C1A1D]/80 text-sm leading-relaxed mb-4 bg-[#fff7e0]/60 rounded-2xl p-4 border border-[#CDAA7D]/20">
                        {guild.description || "No description provided."}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                        <span className="bg-[#CDAA7D]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">
                          {typeof guild.member_count === 'number' ? guild.member_count : (Array.isArray(guild.members) ? guild.members.length : 1)} member{((typeof guild.member_count === 'number' ? guild.member_count : (Array.isArray(guild.members) ? guild.members.length : 1)) !== 1 ? 's' : '')}
                        </span>
                        <span className="bg-[#8B75AA]/20 text-[#2C1A1D] px-3 py-1 rounded-xl font-medium">Created: {guild.created_at ? new Date(guild.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
          <AchievementsSection userId={currentUser.id} />
        )}
      </div>
    </section>
  );
}

export default IntegratedProfile;