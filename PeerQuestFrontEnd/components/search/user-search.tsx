"use client"

import { useState, useEffect } from "react"
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react"
import type { User, Quest, Guild } from "@/lib/types"
import { UserProfileModal } from "@/components/search/user-profile-modal"
import { MessagingModal } from "@/components/search/messaging-modal"

interface UserSearchProps {
  quests: Quest[];
  guilds: Guild[];
  currentUser: User | null;
  showToast: (message: string, type?: string) => void;
}

export function UserSearch({ quests, guilds, currentUser, showToast }: UserSearchProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"username" | "level" | "quests">("level");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedUserId, setExpandedUserId] = useState<string | number | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  const [messagingUser, setMessagingUser] = useState<User | null>(null);

  // Ensure props are arrays to prevent runtime errors
  const safeQuests = Array.isArray(quests) ? quests : [];
  const safeGuilds = Array.isArray(guilds) ? guilds : [];
  
  // Debug logging to track prop types
  if (process.env.NODE_ENV === 'development') {
    if (!Array.isArray(quests)) {
      console.warn('[UserSearch] quests prop is not an array:', typeof quests, quests);
    }
    if (!Array.isArray(guilds)) {
      console.warn('[UserSearch] guilds prop is not an array:', typeof guilds, guilds);
    }
  }

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      setUsersError(null);
      try {
        // Try Django backend first, fallback to Next.js API route if 404
        console.log("[UserSearch] Fetching users from:", "http://localhost:8000/api/users/search/");
        let res = await fetch("http://localhost:8000/api/users/search/");
        console.log("[UserSearch] Response status:", res.status);
        if (res.status === 404) {
          console.log("[UserSearch] Fallback to /api/users");
          res = await fetch("/api/users");
        }
        if (!res.ok) {
          console.error("[UserSearch] Failed to fetch users", res.status, res.statusText);
          throw new Error("Failed to fetch users");
        }
        const data = await res.json();
        // Defensive: handle both array and object API responses
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else if (Array.isArray(data.results)) {
          setUsers(data.results);
        } else {
          setUsers([]);
        }
      } catch (err: any) {
        setUsersError(err.message || "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Get all unique skills from users (deduplicated by skill_name)
  const skillMap = new Map<string, { id?: string; name: string; description?: string }>();
  users.forEach(user => {
    (user.skills || []).forEach((skill: any) => {
      // Support both {skill_name, category, ...} and {id, name, ...}
      const skillId = skill.id || skill.skill_id || skill.skill_name || skill.name;
      const skillName = skill.name || skill.skill_name;
      if (skillName && !skillMap.has(skillName)) {
        skillMap.set(skillName, {
          id: skillId,
          name: skillName,
          description: skill.description || '',
        });
      }
    });
  });
  const allSkills = Array.from(skillMap.values());

  // Filter users based on search query and selected skill, and exclude current user and staff/superusers
  const filteredUsers = users.filter((user) => {
    // Exclude current user
    if (currentUser && String(user.id) === String(currentUser.id)) return false;
    // Exclude staff and superusers
    if (user.is_superuser || user.isSuperuser || user.is_staff) return false;

    const matchesSearch =
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

    // Defensive: ensure user.skills is always an array of objects with id/skill_name and name
    const skillsArr = Array.isArray(user.skills)
      ? user.skills.filter(s => s && typeof s === 'object' && (('id' in s && 'name' in s) || ('skill_name' in s)))
      : [];

    const matchesSkill =
      selectedSkill === "all" ||
      skillsArr.some(skill => {
        // Accept both id and skill_name for matching
        if ('id' in skill && skill.id === selectedSkill) return true;
        if ('skill_name' in skill && skill.skill_name === selectedSkill) return true;
        return false;
      });

    return matchesSearch && matchesSkill;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any, bValue: any;

    if (sortField === "username") {
      aValue = a.username?.toLowerCase() || "";
      bValue = b.username?.toLowerCase() || "";
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (sortField === "level") {
      aValue = a.level || 0;
      bValue = b.level || 0;
    } else {
      aValue = typeof a.completedQuests === 'number' ? a.completedQuests : 0;
      bValue = typeof b.completedQuests === 'number' ? b.completedQuests : 0;
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const toggleSort = (field: "username" | "level" | "quests") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleViewProfile = (user: User) => {
    setSelectedUserProfile(user)
  }

  const handleSendMessage = (user: User) => {
    if (!currentUser) {
      showToast("Please log in to send messages", "error")
      return
    }
    setMessagingUser(user)
  }

  return (
    <section className="bg-[#F4F0E6] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#2C1A1D] font-serif mb-6">Find Adventurers</h2>
        <p className="text-center text-[#8B75AA] mb-8">
          DISCOVER SKILLED ADVENTURERS TO COLLABORATE WITH ON YOUR QUESTS.
        </p>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search adventurers..."
              className="w-full px-4 py-3 pl-10 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CDAA7D]" />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <Filter size={16} className="mr-2 text-[#8B75AA]" />
              <span className="text-[#2C1A1D] font-medium mr-2">Sort by:</span>
            </div>

            <button
              className="flex items-center px-3 py-1 border border-[#CDAA7D] rounded bg-white hover:bg-[#F4F0E6]"
              onClick={() => toggleSort("username")}
            >
              <span className={sortField === "username" ? "text-[#8B75AA] font-medium" : "text-[#2C1A1D]"}>
                Username
              </span>
              {sortField === "username" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </button>

            <button
              className="flex items-center px-3 py-1 border border-[#CDAA7D] rounded bg-white hover:bg-[#F4F0E6]"
              onClick={() => toggleSort("level")}
            >
              <span className={sortField === "level" ? "text-[#8B75AA] font-medium" : "text-[#2C1A1D]"}>Level</span>
              {sortField === "level" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </button>

            <button
              className="flex items-center px-3 py-1 border border-[#CDAA7D] rounded bg-white hover:bg-[#F4F0E6]"
              onClick={() => toggleSort("quests")}
            >
              <span className={sortField === "quests" ? "text-[#8B75AA] font-medium" : "text-[#2C1A1D]"}>
                Completed Quests
              </span>
              {sortField === "quests" && (
                <span className="ml-1">
                  {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </button>

            <div className="ml-auto">
              <select
                className="px-3 py-1 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="all">All Skills</option>
                {allSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {loadingUsers ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <span className="text-[#8B75AA] text-lg">Loading users...</span>
          </div>
        ) : usersError ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <span className="text-red-500 text-lg">{usersError}</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-[#CDAA7D] rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col"
                onClick={() => setSelectedUserProfile(user)}
                style={{ minHeight: 180 }}
              >
                {/* Top: Banner/Avatar/Name */}
                <div className="relative bg-gradient-to-r from-[#F4F0E6] to-[#E9E1F5] rounded-t-xl flex items-center gap-4 p-4 pb-2">
                  <div className="w-16 h-16 rounded-full border-4 border-[#CDAA7D] bg-[#8B75AA] flex items-center justify-center text-2xl text-white overflow-hidden shadow-md">
                    {typeof user.avatar_url === 'string' && user.avatar_url.match(/^https?:\//) ? (
                      <img
                        src={user.avatar_url}
                        alt={user.displayName || user.username}
                        className="w-full h-full object-cover rounded-full"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span>{(user.displayName || user.username || "?").slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-[#2C1A1D] text-lg md:text-xl leading-tight">{user.displayName || user.username}</h3>
                    <p className="text-sm text-[#8B75AA]">@{user.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-[#8B75AA] text-white text-xs px-2 py-1 rounded-full">LVL {user.level || 1}</span>
                      {user.roleDisplay && (
                        <span className="bg-[#2C1A1D] text-white text-xs px-2 py-1 rounded-full">
                          {user.roleDisplay}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Middle: Stats/Skills */}
                <div className="flex flex-row flex-wrap items-center justify-between gap-2 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#CDAA7D] font-medium"><span>🏆</span>{typeof user.completedQuests === 'number' ? user.completedQuests : 0} Quests</span>
                    <span className="flex items-center gap-1 text-[#8B75AA] font-medium"><span>👥</span>{user.guilds?.length || 0} Guilds</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(user.skills) && user.skills.length > 0 ? (
                      user.skills.slice(0, 3).map((skill: any, idx: number) => {
                        let label = '';
                        if (typeof skill === 'object' && skill !== null) {
                          if (typeof skill.name === 'string') label = skill.name;
                          else if (typeof skill.skill_name === 'string') label = skill.skill_name;
                          else label = JSON.stringify(skill);
                        } else {
                          label = String(skill);
                        }
                        return (
                          <span key={skill.id || skill.skill_name || idx} className="px-2 py-1 bg-[#8B75AA]/10 text-[#8B75AA] rounded text-xs">
                            {label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-gray-400 italic">No skills</span>
                    )}
                  </div>
                </div>
                {/* Bottom: Bio & Action */}
                <div className="flex flex-row items-end justify-between px-4 pb-4 pt-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#2C1A1D] truncate" title={user.bio || ''}>{user.bio || <span className='italic text-gray-400'>No bio</span>}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleSendMessage(user); }}
                    className="ml-2 px-3 py-1 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors text-sm shadow"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedUsers.length === 0 && (
          <div className="bg-white border border-[#CDAA7D] rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-[#CDAA7D] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-[#2C1A1D] mb-2">No Adventurers Found</h3>
            <p className="text-[#8B75AA]">
              Try adjusting your search criteria or check back later for new adventurers.
            </p>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <UserProfileModal
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          user={selectedUserProfile}
          quests={safeQuests}
          guilds={safeGuilds}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* Messaging Modal */}
      {messagingUser && currentUser && (
        <MessagingModal
          isOpen={!!messagingUser}
          onClose={() => setMessagingUser(null)}
          recipient={messagingUser}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </section>
  )
}
