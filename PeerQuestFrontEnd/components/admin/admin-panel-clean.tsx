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
import { Report, UserReport, GuildReport, QuestReport } from '../../lib/types';

// Type guards
const isUserReport = (report: Report): report is UserReport => {
  return 'banned_user_id' in report || 'flagged_user_id' in report || 'reported_user' in report;
};

const isGuildReport = (report: Report): report is GuildReport => {
  return 'guild_id' in report || 'reported_guild' in report;
};

const isQuestReport = (report: Report): report is QuestReport => {
  return 'quest_id' in report || 'reported_quest' in report;
};

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

interface ActionLog {
  id: number;
  action: string;
  target_type: string;
  target_id: number;
  admin_user: User;
  timestamp: string;
  details?: string;
  reason?: string;
}

interface AdminPanelProps {
  user: User | null;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ReportDetailsModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
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
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [guildsError, setGuildsError] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [actionLogsLoading, setActionLogsLoading] = useState(false);
  const [actionLogsError, setActionLogsError] = useState("");
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Helper functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const API_BASE = "http://localhost:8000";
    let token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
    const refresh = typeof window !== 'undefined' ? localStorage.getItem("refresh_token") : null;

    let res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (res.status === 401 && refresh && typeof window !== 'undefined') {
      const refreshRes = await fetch(`${API_BASE}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("access_token", data.access);
        token = data.access;
        
        res = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return res;
      }
    }

    return res;
  };

  // Fetch functions
  const fetchReports = async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const API_BASE = "http://localhost:8000";
      
      // Fetch user reports
      const userReportsRes = await fetchWithAuth(`${API_BASE}/api/reports/user/`);
      let userReports: UserReport[] = [];
      
      if (userReportsRes.ok) {
        userReports = await userReportsRes.json();
      } else {
        const err = await userReportsRes.text();
        console.error("Failed to fetch user reports:", err);
      }
      
      // Fetch guild reports
      const guildReportsRes = await fetchWithAuth(`${API_BASE}/api/reports/guild/`);
      let guildReports: GuildReport[] = [];
      
      if (guildReportsRes.ok) {
        guildReports = await guildReportsRes.json();
      } else {
        const err = await guildReportsRes.text();
        console.error("Failed to fetch guild reports:", err);
      }
      
      // Fetch quest reports
      const questReportsRes = await fetchWithAuth(`${API_BASE}/api/reports/quest/`);
      let questReports: QuestReport[] = [];
      
      if (questReportsRes.ok) {
        questReports = await questReportsRes.json();
      } else {
        const err = await questReportsRes.text();
        console.error("Failed to fetch quest reports:", err);
      }
      
      // Combine all reports
      const allReports: Report[] = [...userReports, ...guildReports, ...questReports];
      setReports(allReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReportsError("Failed to load reports");
    } finally {
      setReportsLoading(false);
    }
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:8000/api/users/admin/users/");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
        showToast("Failed to fetch users", "error");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Error fetching users", "error");
    }
  };

  const fetchGuilds = async () => {
    setGuildsLoading(true);
    setGuildsError("");
    try {
      const response = await fetchWithAuth("http://localhost:8000/api/guilds/");
      if (response.ok) {
        const data = await response.json();
        setGuilds(data);
      } else {
        setGuildsError('Failed to load guilds');
        showToast('Failed to load guilds', 'error');
      }
    } catch (error) {
      setGuildsError('Failed to load guilds');
      showToast('Failed to load guilds', 'error');
    } finally {
      setGuildsLoading(false);
    }
  };

  const fetchActionLogs = async () => {
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

  const fetchQuests = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:8000/api/quests/");
      if (response.ok) {
        const data = await response.json();
        setQuests(data);
      } else {
        console.error("Failed to fetch quests");
        showToast("Failed to fetch quests", "error");
      }
    } catch (error) {
      console.error("Error fetching quests:", error);
      showToast("Error fetching quests", "error");
    }
  };

  // Action handlers
  const handleBanUser = async (userId: string) => {
    try {
      // Implementation for banning user
      showToast('Ban user functionality will be implemented', 'info');
    } catch (error) {
      showToast('Error banning user', 'error');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      // Implementation for unbanning user
      showToast('Unban user functionality will be implemented', 'info');
    } catch (error) {
      showToast('Error unbanning user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Implementation for deleting user
      showToast('Delete user functionality will be implemented', 'info');
    } catch (error) {
      showToast('Error deleting user', 'error');
    }
  };

  const handleDeleteQuest = async (questId: number) => {
    try {
      // Implementation for deleting quest
      showToast('Delete quest functionality will be implemented', 'info');
    } catch (error) {
      showToast('Error deleting quest', 'error');
    }
  };

  const handleDeleteGuild = async (guildId: number) => {
    try {
      // Implementation for deleting guild
      showToast('Delete guild functionality will be implemented', 'info');
    } catch (error) {
      showToast('Error deleting guild', 'error');
    }
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      // Implementation for resolving report
      showToast('Resolve report functionality will be implemented', 'info');
    } catch (error) {
      showToast('Error resolving report', 'error');
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
        if (reportTypeFilter === "user") return isUserReport(report);
        if (reportTypeFilter === "guild") return isGuildReport(report);
        if (reportTypeFilter === "quest") return isQuestReport(report);
        return true;
      });
    }
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      filtered = filtered.filter((r) => {
        if (isUserReport(r)) {
          return r.reason?.toLowerCase().includes(q) || r.message?.toLowerCase().includes(q);
        }
        if (isGuildReport(r)) {
          return r.reason?.toLowerCase().includes(q) || r.message?.toLowerCase().includes(q);
        }
        if (isQuestReport(r)) {
          return r.reason?.toLowerCase().includes(q) || r.message?.toLowerCase().includes(q);
        }
        return false;
      });
    }
    return filtered;
  }, [reports, reportTypeFilter, reportSearch]);

  const activeUsers = users.filter(user => !user.isBanned).length;
  const bannedUsers = users.filter(user => user.isBanned).length;
  const openQuests = quests.filter(quest => quest.status === 'open').length;
  const completedQuests = quests.filter(quest => quest.status === 'completed').length;

  // Effects
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "guilds") {
      fetchGuilds();
    } else if (activeTab === "actionlog") {
      fetchActionLogs();
    } else if (activeTab === "reports") {
      fetchReports();
    } else if (activeTab === "quests") {
      fetchQuests();
    }
  }, [activeTab]);

  // Report Details Modal component
  const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({ report, isOpen, onClose }) => {
    if (!isOpen || !report) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold">Report Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {isUserReport(report) ? 'User Report' : isGuildReport(report) ? 'Guild Report' : 'Quest Report'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <p className="text-gray-900">{report.reason}</p>
              </div>
              {report.message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <p className="text-gray-900">{report.message}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  report.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.resolved ? 'Resolved' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {!report.resolved && (
                <button
                  onClick={() => handleResolveReport(report.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Mark as Resolved
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

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
                {reports.filter(r => !r.resolved).length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                    {reports.filter(r => !r.resolved).length}
                  </span>
                )}
              </button>
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
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="rounded-b-lg p-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Guilds</h3>
                    <Users size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{guilds.length}</div>
                </div>

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

          {activeTab === "users" && (
            <div className="rounded-b-lg p-6 bg-white">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B75AA] focus:border-transparent w-full"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Username</th>
                      <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Email</th>
                      <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                      <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Joined</th>
                      <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-gray-900">{userItem.username}</div>
                              {userItem.is_staff && (
                                <span className="text-xs text-purple-600 font-medium">Staff</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b text-gray-700">{userItem.email}</td>
                        <td className="py-3 px-4 border-b">
                          {userItem.isBanned ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-b text-gray-700">
                          {userItem.created_at || userItem.date_joined ? 
                            new Date(userItem.created_at || userItem.date_joined || '').toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                        <td className="py-3 px-4 border-b">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedUserDetails(userItem)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {userItem.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(String(userItem.id))}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Unban User"
                              >
                                <UserCheck size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowBanConfirm(String(userItem.id))}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Ban User"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => setShowDeleteUserConfirm(String(userItem.id))}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="rounded-b-lg p-6 bg-white">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B75AA] focus:border-transparent w-full"
                  />
                </div>
                <div className="relative">
                  <select
                    value={reportTypeFilter}
                    onChange={(e) => setReportTypeFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-[#8B75AA] focus:border-transparent"
                  >
                    <option value="all">All Reports</option>
                    <option value="user">User Reports</option>
                    <option value="guild">Guild Reports</option>
                    <option value="quest">Quest Reports</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {reportsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading reports...</div>
                </div>
              ) : reportsError ? (
                <div className="text-center py-8">
                  <div className="text-red-500">{reportsError}</div>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No reports found</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Type</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Reason</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Created</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {isUserReport(report) ? 'User' : isGuildReport(report) ? 'Guild' : 'Quest'}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b text-gray-700">
                            {report.reason}
                          </td>
                          <td className="py-3 px-4 border-b text-gray-700">
                            {new Date(report.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 border-b">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              report.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {report.resolved ? 'Resolved' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewReport(report)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {!report.resolved && (
                                <button
                                  onClick={() => handleResolveReport(report.id)}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Resolve Report"
                                >
                                  <UserCheck size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add other tab content here for quests, guilds, action logs etc. */}
        </div>
      </div>

      {/* Report Details Modal */}
      <ReportDetailsModal 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
      />
    </>
  );
};

export default AdminPanel;
