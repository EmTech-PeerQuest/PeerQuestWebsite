'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  FileText, 
  Flag, 
  Home, 
  Search, 
  AlertTriangle, 
  Trash2, 
  X,
  Eye,
  Ban,
  UserCheck,
  MessageSquare,
  AlertCircle,
  Shield,
  Clock,
  Calendar,
  Mail,
  User as UserIcon,
  Settings,
  Filter,
  ChevronDown
} from 'lucide-react';

// Types
interface User {
  id: string | number;
  username: string;
  email: string;
  is_staff?: boolean;
  isSuperuser?: boolean;
  is_superuser?: boolean;
  isBanned?: boolean;
  banReason?: string;
  banExpiration?: string;
  created_at?: string;
  date_joined?: string;
  avatar?: string;
  level?: number;
  xp?: number;
  gold?: number;
  bio?: string;
  completedQuests?: number;
  createdQuests?: number;
  joinedGuilds?: number;
  createdGuilds?: number;
}

interface Quest {
  id: string | number;
  title: string;
  description: string;
  category?: { name: string } | string;
  creator?: { username: string };
  poster?: { username: string; avatar?: string };
  created_at?: string;
  status: string;
  reward?: number;
  requirements?: string[];
  reports_count?: number;
}

interface Guild {
  id?: string | number;
  guild_id?: string | number;
  name: string;
  specialization: string;
  owner?: { username: string };
  privacy: string;
  member_count: number;
  is_disabled?: boolean;
  warning_count?: number;
  created_at?: string;
  custom_emblem?: string;
  preset_emblem?: string;
  description?: string;
  minimum_level?: number;
  require_approval?: boolean;
  allow_discovery?: boolean;
  welcome_message?: string;
  tags?: string[];
  social_links?: string[];
}

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  quests: Quest[];
  guilds: Guild[];
  setUsers: (users: User[]) => void;
  setQuests: (quests: Quest[]) => void;
  setGuilds: (guilds: Guild[]) => void;
  showToast: (message: string, type?: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  users,
  quests,
  guilds,
  setUsers,
  setQuests,
  setGuilds,
  showToast,
}) => {
  // State variables
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [guildSearch, setGuildSearch] = useState("");
  const [questSearch, setQuestSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);
  const [selectedQuestDetails, setSelectedQuestDetails] = useState<Quest | null>(null);
  const [selectedGuildDetails, setSelectedGuildDetails] = useState<Guild | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showBanConfirm, setShowBanConfirm] = useState<string | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState<string | null>(null);
  const [showDeleteQuestConfirm, setShowDeleteQuestConfirm] = useState<number | null>(null);
  const [showDeleteGuildConfirm, setShowDeleteGuildConfirm] = useState<number | null>(null);
  const [banReason, setBanReason] = useState("");
  const [customBanReason, setCustomBanReason] = useState("");
  const [banType, setBanType] = useState<"permanent" | "temporary">("permanent");
  const [banDuration, setBanDuration] = useState({ amount: 1, unit: "days" });
  const [deleteQuestReason, setDeleteQuestReason] = useState("");
  const [customDeleteQuestReason, setCustomDeleteQuestReason] = useState("");
  const [deleteGuildReason, setDeleteGuildReason] = useState("");
  const [customDeleteGuildReason, setCustomDeleteGuildReason] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [guildsError, setGuildsError] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [actionLogsLoading, setActionLogsLoading] = useState(false);
  const [actionLogsError, setActionLogsError] = useState("");
  const [appealsLoading, setAppealsLoading] = useState(false);

  // Helper functions
  const isInappropriateUsername = (username: string): boolean => {
    const inappropriateWords = ['fuck', 'shit', 'damn', 'bitch', 'ass', 'hell'];
    return inappropriateWords.some(word => username.toLowerCase().includes(word));
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Fetch functions
  const fetchGuildsForAdmin = async () => {
    setGuildsLoading(true);
    setGuildsError("");
    try {
      const response = await fetchWithAuth('http://localhost:8000/api/guilds/admin/');
      if (response.ok) {
        const data = await response.json();
        setGuilds(data);
      } else {
        setGuilds([]);
        setGuildsError('Failed to load guilds');
        showToast?.('Failed to load guilds', 'error');
      }
    } finally {
      setGuildsLoading(false);
    }
  };

  const fetchActionLogsForAdmin = async () => {
    setActionLogsLoading(true);
    setActionLogsError("");
    try {
      const response = await fetchWithAuth('http://localhost:8000/api/admin/action-logs/');
      if (response.ok) {
        const data = await response.json();
        setActionLogs(data);
      } else {
        setActionLogsError('Failed to load action logs');
        setActionLogs([]);
      }
    } catch (error) {
      setActionLogsError('Failed to load action logs');
      setActionLogs([]);
    } finally {
      setActionLogsLoading(false);
    }
  };

  // Computed values
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const query = searchTerm.toLowerCase();
    return users.filter((user) =>
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [users, searchTerm]);

  const filteredQuests = useMemo(() => {
    if (!questSearch.trim()) return quests;
    const query = questSearch.toLowerCase();
    return quests.filter((quest) =>
      quest.title.toLowerCase().includes(query) ||
      (typeof quest.category === 'string' ? quest.category : quest.category?.name || '').toLowerCase().includes(query) ||
      (quest.creator?.username || quest.poster?.username || '').toLowerCase().includes(query)
    );
  }, [quests, questSearch]);

  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (reportTypeFilter !== "all") {
      filtered = filtered.filter((report) => {
        if (reportTypeFilter === "user") return report.type === "user" || !!report.reported_user;
        if (reportTypeFilter === "quest") return report.type === "quest" || !!report.reported_quest;
        return true;
      });
    }
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      filtered = filtered.filter((r) =>
        (r.reporter?.username?.toLowerCase?.().includes(q) || r.reporter_username?.toLowerCase?.().includes(q)) ||
        (r.reason?.toLowerCase?.().includes(q)) ||
        (r.message?.toLowerCase?.().includes(q))
      );
    }
    return filtered;
  }, [reports, reportTypeFilter, reportSearch]);

  const activeUsers = users.filter(user => !user.isBanned).length;
  const bannedUsers = users.filter(user => user.isBanned).length;
  const openQuests = quests.filter(quest => quest.status === 'open').length;
  const completedQuests = quests.filter(quest => quest.status === 'completed').length;

  // Action handlers
  const handleBanUser = async (userId: string) => {
    // Implementation for banning user
    showToast('Ban user functionality needs implementation', 'info');
  };

  const handleUnbanUser = async (userId: string) => {
    // Implementation for unbanning user
    showToast('Unban user functionality needs implementation', 'info');
  };

  const handleDeleteUser = async (userId: string) => {
    // Implementation for deleting user
    showToast('Delete user functionality needs implementation', 'info');
  };

  const handleDeleteQuest = async (questId: number) => {
    // Implementation for deleting quest
    showToast('Delete quest functionality needs implementation', 'info');
  };

  const handleDeleteGuild = async (guildId: number) => {
    // Implementation for deleting guild
    showToast('Delete guild functionality needs implementation', 'info');
  };

  const handleResolveReport = async (reportId: number) => {
    // Implementation for resolving report
    showToast('Resolve report functionality needs implementation', 'info');
  };

  // Effects
  useEffect(() => {
    if (activeTab === "guilds") {
      fetchGuildsForAdmin();
    } else if (activeTab === "actionlog") {
      fetchActionLogsForAdmin();
    }
  }, [activeTab]);

  return (
    <>
      <div className="bg-[#F4F0E6] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-[#8B75AA] rounded-t-lg p-6">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-[#F4F0E6] opacity-80">Manage users, quests, guilds, and reports</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              <button
                onClick={() => setActiveTab("actionlog")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "actionlog"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <FileText size={18} className="mr-2" />
                Action Log
              </button>
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <Home size={18} className="mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "users"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <Users size={18} className="mr-2" />
                Users
              </button>
              <button
                onClick={() => setActiveTab("quests")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "quests"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <FileText size={18} className="mr-2" />
                Quests
              </button>
              <button
                onClick={() => setActiveTab("guilds")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "guilds"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <Users size={18} className="mr-2" />
                Guilds
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "reports"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <Flag size={18} className="mr-2" />
                Reports
                {appealsLoading ? (
                  <span className="ml-2 bg-gray-400 text-white text-xs px-1.5 rounded-full">...</span>
                ) : appeals.length > 0 ? (
                  <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">{appeals.length}</span>
                ) : null}
              </button>
              {/* Appeals Tab - only for staff/superusers */}
              {(currentUser.is_staff || currentUser.isSuperuser || currentUser.is_superuser) && (
                <button
                  onClick={() => setActiveTab("appeals")}
                  className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                    activeTab === "appeals"
                      ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                      : "text-gray-500 hover:text-[#8B75AA]"
                  }`}
                >
                  <Flag size={18} className="mr-2" />
                  Appeals
                  {appealsLoading ? (
                    <span className="ml-2 bg-gray-400 text-white text-xs px-1.5 rounded-full">...</span>
                  ) : appeals.length > 0 ? (
                    <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">{appeals.length}</span>
                  ) : null}
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Area */}
          {activeTab === "guilds" && (
            <div className="py-8">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">Guild Management</h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div></div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search guilds by name, specialization, or owner..."
                    value={guildSearch}
                    onChange={e => setGuildSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B75AA] focus:border-transparent w-full"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                {guildsLoading ? (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <span className="text-[#8B75AA] text-lg animate-pulse">Loading guilds...</span>
                  </div>
                ) : guildsError ? (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <span className="text-red-500 text-lg">{guildsError}</span>
                  </div>
                ) : guilds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[200px]">
                    <span className="text-gray-500 text-base">No guilds found.</span>
                    <span className="text-xs text-gray-400 mt-1">No guilds have been created yet.</span>
                  </div>
                ) : (
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Name</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Specialization</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Owner</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Privacy</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Members</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Created</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guilds
                        .filter(guild => {
                          const q = guildSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            guild.name.toLowerCase().includes(q) ||
                            guild.specialization.toLowerCase().includes(q) ||
                            (guild.owner?.username?.toLowerCase?.().includes(q) || "")
                          );
                        })
                        .map(guild => (
                          <tr key={guild.guild_id || guild.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b align-top min-w-[140px] cursor-pointer underline" onClick={() => setSelectedGuildDetails(guild)}>{guild.name}</td>
                            <td className="py-3 px-4 border-b align-top min-w-[120px]">{guild.specialization}</td>
                            <td className="py-3 px-4 border-b align-top min-w-[120px]">{guild.owner?.username || "Unknown"}</td>
                            <td className="py-3 px-4 border-b align-top min-w-[100px]">{guild.privacy}</td>
                            <td className="py-3 px-4 border-b align-top min-w-[80px]">{guild.member_count}</td>
                            <td className="py-3 px-4 border-b align-top min-w-[120px]">
                              {guild.is_disabled ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Disabled</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                              )}
                            </td>
                            <td className="py-3 px-4 border-b align-top min-w-[120px]">{guild.created_at ? new Date(guild.created_at).toLocaleDateString() : "N/A"}</td>
                            <td className="py-3 px-4 border-b align-top min-w-[120px]">
                              <div className="flex gap-2 flex-wrap">
                                {guild.is_disabled ? (
                                  <>
                                    <button
                                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                      onClick={async () => {
                                        if (window.confirm(`Re-enable guild "${guild.name}"?`)) {
                                          try {
                                            const response = await fetchWithAuth(`http://localhost:8000/api/guilds/${guild.guild_id || guild.id}/enable/`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                            });
                                            if (response.ok) {
                                              showToast(`Guild "${guild.name}" re-enabled.`, "success");
                                              fetchGuildsForAdmin();
                                            } else {
                                              throw new Error('Failed to re-enable guild');
                                            }
                                          } catch (error) {
                                            showToast(`Failed to re-enable guild: ${error}`, "error");
                                          }
                                        }
                                      }}
                                    >
                                      Re-enable
                                    </button>
                                    <button
                                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                                      onClick={async () => {
                                        if (window.confirm(`Reset warnings for guild "${guild.name}"?`)) {
                                          try {
                                            const response = await fetchWithAuth(`http://localhost:8000/api/guilds/${guild.guild_id || guild.id}/reset_warnings/`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                            });
                                            if (response.ok) {
                                              showToast(`Warnings reset for guild "${guild.name}".`, "success");
                                              fetchGuildsForAdmin();
                                            } else {
                                              throw new Error('Failed to reset warnings');
                                            }
                                          } catch (error) {
                                            showToast(`Failed to reset warnings: ${error}`, "error");
                                          }
                                        }
                                      }}
                                    >
                                      Reset Warnings
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    onClick={async () => {
                                      const reason = prompt("Enter reason for disabling guild:");
                                      if (reason && window.confirm(`Are you sure you want to disable the guild "${guild.name}"?`)) {
                                        try {
                                          const response = await fetchWithAuth(`http://localhost:8000/api/guilds/${guild.guild_id || guild.id}/disable/`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ reason })
                                          });
                                          if (response.ok) {
                                            showToast(`Guild "${guild.name}" has been disabled`, "success");
                                            fetchGuildsForAdmin();
                                          } else {
                                            throw new Error('Failed to disable guild');
                                          }
                                        } catch (error) {
                                          showToast(`Failed to disable guild: ${error}`, "error");
                                        }
                                      }
                                    }}
                                  >
                                    Disable
                                  </button>
                                )}
                                <button
                                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-xs"
                                  onClick={() => setShowDeleteGuildConfirm(Number(guild.guild_id || guild.id))}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Other tabs content would go here */}
          {activeTab === "overview" && (
            <div className="rounded-b-lg p-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Total Users */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Users</h3>
                    <Users size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{users.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium">{activeUsers} active</span> •{" "}
                    <span className="text-red-500">{bannedUsers} banned</span>
                  </div>
                </div>

                {/* Total Quests */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Quests</h3>
                    <FileText size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{quests.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium">{openQuests} open</span> •{" "}
                    <span className="text-green-500">{completedQuests} completed</span>
                  </div>
                </div>

                {/* Total Guilds */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Guilds</h3>
                    <Users size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{guilds.length}</div>
                </div>

                {/* Pending Reports */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Pending Reports</h3>
                    <Flag size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{reports.filter(r => !r.resolved).length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <button onClick={() => setActiveTab("reports")} className="text-[#8B75AA] hover:underline">
                      View reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
