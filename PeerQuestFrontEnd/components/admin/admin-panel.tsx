"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, FileText, Flag, Home, X, Search, Trash2, AlertTriangle, Clock, ArrowUpDown, Star, Trophy } from "lucide-react";
import type { ActionLogEntry } from "@/lib/types";
import { ReportDetailsModal } from "@/components/modals/report-details-modal";
import type { User, Quest, Guild } from "@/lib/types";
import { QuestAPI } from "@/lib/api/quests";

// --- Helper: fetchWithAuth ---
// Handles token refresh for all API calls
const fetchWithAuth = async (url: string, options: any = {}, autoLogout = true) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  let token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
  const refresh = typeof window !== 'undefined' ? localStorage.getItem("refresh_token") : null;
  if (!token) throw new Error("No access token found");
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401 && refresh) {
    // Try to refresh token
    const refreshRes = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh })
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.access) {
        localStorage.setItem("access_token", data.access);
        token = data.access;
        // Retry original request
        res = await fetch(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } else if (autoLogout) {
      // Refresh failed, force logout
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (typeof window !== 'undefined' && window.alert) {
        window.alert("Session expired. Please log in again.");
      }
      throw new Error("Session expired");
    }
  }
  return res;
};

interface AdminPanelProps {
  currentUser: User | null
  users?: User[]
  quests?: Quest[]
  guilds?: Guild[]
  setUsers?: (users: User[]) => void
  setQuests?: (quests: Quest[]) => void
  setGuilds?: (guilds: Guild[]) => void
  showToast: (message: string, type?: string) => void
}

function AdminPanel({
  currentUser,
  users = [],
  quests = [],
  guilds = [],
  setUsers = () => {},
  setQuests = () => {},
  setGuilds = () => {},
  showToast,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "quests" | "guilds" | "reports" | "appeals" | "actionlog" | "transactions" | "receipts">("overview")
  
  // Local state for data to ensure it's available even if props aren't working
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [localQuests, setLocalQuests] = useState<Quest[]>([]);
  const [localGuilds, setLocalGuilds] = useState<Guild[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0); // Force re-render after updates
  
  // Action Log State
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);
  const [actionLogsLoading, setActionLogsLoading] = useState(false);
  const [actionLogsError, setActionLogsError] = useState("");

  // Appeals search
  const [appealSearch, setAppealSearch] = useState("");
  
  // Quest search state
  const [questSearch, setQuestSearch] = useState("");
  
  // Ban Appeals State
  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [appealsError, setAppealsError] = useState("");
  
  // Basic state variables
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReport, setSelectedReport] = useState<any>(null)
  
  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all");
  const [transactionSearch, setTransactionSearch] = useState("");
  
  // Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");

  // Receipts State
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [showFutureReceipts, setShowFutureReceipts] = useState<boolean>(false);
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [receiptStats, setReceiptStats] = useState<any>({});
  const [batchInfo, setBatchInfo] = useState<any>({});
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

  // State for various modals and actions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showGuildModal, setShowGuildModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"user" | "quest" | "guild">("user");
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  // Safe array checks - use local state if props are empty
  const safeUsers = localUsers.length > 0 ? localUsers : (Array.isArray(users) ? users : []);
  const safeQuests = localQuests.length > 0 ? localQuests : (Array.isArray(quests) ? quests : []);
  const safeGuilds = localGuilds.length > 0 ? localGuilds : (Array.isArray(guilds) ? guilds : []);

  // Filter and search reports
  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (reportTypeFilter === "user") {
      filtered = filtered.filter((r: any) => 
        r.type === "user" || !!r.reported_user
      );
    } else if (reportTypeFilter === "quest") {
      filtered = filtered.filter((r: any) => 
        r.type === "quest" || !!r.reported_quest
      );
    } else if (reportTypeFilter === "guild") {
      filtered = filtered.filter((r: any) => 
        r.type === "guild" || !!r.reported_guild
      );
    }
    if (reportSearch.trim()) {
      const q = reportSearch.trim().toLowerCase();
      filtered = filtered.filter((r: any) => {
        return (
          (r.reported_user?.username?.toLowerCase?.().includes(q) || r.reported_user_username?.toLowerCase?.().includes(q)) ||
          (r.reported_quest_title?.toLowerCase?.().includes(q)) ||
          (r.reported_guild?.name?.toLowerCase?.().includes(q) || r.reported_guild_name?.toLowerCase?.().includes(q)) ||
          (r.reporter?.username?.toLowerCase?.().includes(q) || r.reporter_username?.toLowerCase?.().includes(q)) ||
          (r.reason?.toLowerCase?.().includes(q)) ||
          (r.message?.toLowerCase?.().includes(q))
        );
      });
    }
    return filtered;
  }, [reports, reportTypeFilter, reportSearch]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (transactionTypeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === transactionTypeFilter);
    }
    if (transactionSearch.trim()) {
      const q = transactionSearch.trim().toLowerCase();
      filtered = filtered.filter((t) => {
        return (
          (t.username?.toLowerCase?.().includes(q)) ||
          (t.quest_title?.toLowerCase?.().includes(q)) ||
          (t.type_display?.toLowerCase?.().includes(q))
        );
      });
    }
    return filtered;
  }, [transactions, transactionTypeFilter, transactionSearch]);

  // Filter and search receipts
  const filteredReceipts = useMemo(() => {
    let filtered = receipts;
    if (receiptSearch.trim()) {
      const q = receiptSearch.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        return (
          (r.user?.username?.toLowerCase?.().includes(q)) ||
          (r.payment_reference?.toLowerCase?.().includes(q)) ||
          (r.batch_id?.toLowerCase?.().includes(q))
        );
      });
    }
    return filtered;
  }, [receipts, receiptSearch]);

  // Debug function to test API connectivity
  // Fetch quests for admin panel
  const fetchQuestsForAdmin = async () => {
    try {
      const data = await QuestAPI.getQuests();
      let questArray: Quest[] = [];
      if (Array.isArray(data)) {
        questArray = data;
      } else if (Array.isArray(data.results)) {
        questArray = data.results;
      } else if (Array.isArray(data.value)) {
        questArray = data.value;
      } else {
        questArray = [];
      }
      
      // Set both local state and props
      setLocalQuests(questArray);
      setQuests?.(questArray);
    } catch (err: any) {
      setLocalQuests([]);
      setQuests?.([]);
      if (showToast) showToast("Failed to fetch quests: " + (err?.message || err), "error");
    }
  };

  // Fetch action logs from backend
  const fetchActionLogs = async () => {
    setActionLogsLoading(true);
    setActionLogsError("");
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/action-log/`);
      if (!res.ok) {
        const err = await res.text();
        setActionLogsError(err);
        setActionLogs([]);
        setActionLogsLoading(false);
        return;
      }
      const data = await res.json();
      setActionLogs(data);
    } catch (err: any) {
      setActionLogsError("Error fetching action logs: " + (err?.message || err));
      setActionLogs([]);
    }
    setActionLogsLoading(false);
  };

  // Fetch reports from backend
  const fetchReports = async () => {
    setReportsLoading(true);
    setReportsError("");
    setReports([]); // Clear existing reports to prevent duplication
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      // The main reports endpoint already returns all types (user, quest, guild)
      const res = await fetchWithAuth(`${API_BASE}/api/users/admin/reports/`);
      
      if (!res.ok) {
        const err = await res.text();
        setReportsError(err);
        setReports([]);
        setReportsLoading(false);
        return;
      }
      
      const allReports = await res.json();
      
      // Add unique keys but preserve backend type information
      const reportsWithKeys = allReports.map((report: any, index: number) => ({
        ...report,
        // Preserve backend type and add fallback report_type
        report_type: report.type || 'unknown',
        unique_key: `${report.type || 'unknown'}-${report.id}-${index}`
      }));
      
      setReports(reportsWithKeys);
    } catch (err: any) {
      setReportsError("Error fetching reports: " + (err?.message || err));
      setReports([]);
    }
    setReportsLoading(false);
  };

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    setTransactionsError("");
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/transactions/transactions/all_transactions/`);
      if (!res.ok) {
        const err = await res.text();
        setTransactionsError(err);
        setTransactions([]);
        setTransactionsLoading(false);
        return;
      }
      const data = await res.json();
      
      // Handle both paginated and non-paginated responses
      let transactionData = [];
      if (Array.isArray(data)) {
        transactionData = data;
      } else if (Array.isArray(data.results)) {
        transactionData = data.results;
      } else {
        transactionData = [];
      }
      
      setTransactions(transactionData);
    } catch (err: any) {
      setTransactionsError("Error fetching transactions: " + (err?.message || err));
      setTransactions([]);
    }
    setTransactionsLoading(false);
  };

  // Fetch appeals from backend
  const fetchAppeals = async () => {
    setAppealsLoading(true);
    setAppealsError("");
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/ban-appeals/`);
      if (!res.ok) {
        const err = await res.text();
        setAppealsError(`Failed to fetch appeals: ${res.status} - ${err}`);
        setAppeals([]);
        setAppealsLoading(false);
        return;
      }
      const data = await res.json();
      setAppeals(data);
    } catch (err: any) {
      setAppealsError("Error fetching appeals: " + (err?.message || err));
      setAppeals([]);
    }
    setAppealsLoading(false);
  };

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/admin/users/`);
      if (!res.ok) {
        if (showToast) showToast(`Failed to fetch users: ${res.status}`, "error");
        return;
      }
      const data = await res.json();
      let userArray: User[] = [];
      if (Array.isArray(data)) {
        userArray = data;
      } else if (Array.isArray(data.results)) {
        userArray = data.results;
      } else {
        userArray = [];
      }
      
      // Set both local state and props
      setLocalUsers(userArray);
      setUsers?.(userArray);
    } catch (err: any) {
      if (showToast) showToast("Error fetching users: " + (err?.message || err), "error");
    }
  };

  // Fetch guilds from backend
  const fetchGuilds = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/guilds/`);
      if (!res.ok) {
        if (showToast) showToast(`Failed to fetch guilds: ${res.status}`, "error");
        return;
      }
      const data = await res.json();
      let guildArray: Guild[] = [];
      if (Array.isArray(data)) {
        guildArray = data;
      } else if (Array.isArray(data.results)) {
        guildArray = data.results;
      } else {
        guildArray = [];
      }
      
      // Set both local state and props
      setLocalGuilds(guildArray);
      setGuilds?.(guildArray);
    } catch (err: any) {
      if (showToast) showToast("Error fetching guilds: " + (err?.message || err), "error");
    }
  };

  // Fetch receipts from backend
  const fetchReceipts = async () => {
    setReceiptsLoading(true);
    setReceiptsError("");
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const params = new URLSearchParams();
      if (receiptSearch.trim()) params.append("search", receiptSearch.trim());
      if (showFutureReceipts) params.append("show_future", "true");
      
      const url = `${API_BASE}/api/payments/admin/receipts/${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetchWithAuth(url);
      
      if (!res.ok) {
        const err = await res.text();
        setReceiptsError(err);
        setReceipts([]);
        setReceiptsLoading(false);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setReceipts(data.receipts || []);
        setReceiptStats(data.statistics || {});
        setBatchInfo(data.batch_info || {});
      } else {
        setReceiptsError(data.message || "Failed to fetch receipts");
        setReceipts([]);
      }
    } catch (err: any) {
      setReceiptsError("Error fetching receipts: " + (err?.message || err));
      setReceipts([]);
    }
    setReceiptsLoading(false);
  };

  // Handle individual receipt actions
  const handleReceiptAction = async (receiptId: number, action: string, notes: string = '') => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/payments/admin/receipts/${receiptId}/action/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes })
      });
      
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchReceipts(); // Refresh the list
      } else {
        showToast(data.message || "Failed to perform action", "error");
      }
    } catch (err: any) {
      showToast("Error performing action: " + (err?.message || err), "error");
    }
  };

  // Handle batch receipt actions
  const handleBatchAction = async (action: string, notes: string = '') => {
    if (selectedReceipts.length === 0) {
      showToast("Please select receipts to process", "error");
      return;
    }
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/payments/admin/receipts/batch-action/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          receipt_ids: selectedReceipts,
          notes 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setSelectedReceipts([]); // Clear selection
        fetchReceipts(); // Refresh the list
      } else {
        showToast(data.message || "Failed to perform batch action", "error");
      }
    } catch (err: any) {
      showToast("Error performing batch action: " + (err?.message || err), "error");
    }
  };

  // User management actions
  const handleBanUser = async (user: User, reason: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/admin/users/${user.id}/ban/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (res.ok) {
        showToast(`User ${user.username || user.id} has been banned`, "success");
        
        // Update user in local state immediately for better UX
        const updatedUser: User = { 
          ...user, 
          isBanned: true, 
          banned: true, 
          banReason: reason
        };
        
        // Update local users array immediately
        setLocalUsers(prev => {
          const newUsers = prev.map(u => u.id === user.id ? updatedUser : u);
          // Also update props users array with the new array
          setUsers?.(newUsers);
          return newUsers;
        });
        
        // Force re-render
        setRefreshCounter(prev => prev + 1);
        
        // Close modal and reset
        setShowBanModal(false);
        setBanReason("");
        setSelectedUser(null);
        
        // Fetch fresh data from server to ensure consistency (with shorter delay)
        setTimeout(() => fetchUsers(), 200);
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to ban user", "error");
      }
    } catch (err: any) {
      showToast("Error banning user: " + (err?.message || err), "error");
    }
  };

  const handleUnbanUser = async (user: User) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/admin/users/${user.id}/unban/`, {
        method: 'POST'
      });
      
      if (res.ok) {
        showToast(`User ${user.username || user.id} has been unbanned`, "success");
        
        // Update user in local state immediately for better UX
        const updatedUser: User = { 
          ...user, 
          isBanned: false, 
          banned: false, 
          banReason: undefined
        };
        
        // Update local users array immediately
        setLocalUsers(prev => {
          const newUsers = prev.map(u => u.id === user.id ? updatedUser : u);
          // Also update props users array with the new array
          setUsers?.(newUsers);
          return newUsers;
        });
        
        // Force re-render
        setRefreshCounter(prev => prev + 1);
        
        // Fetch fresh data from server to ensure consistency (with shorter delay)
        setTimeout(() => fetchUsers(), 200);
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to unban user", "error");
      }
    } catch (err: any) {
      showToast("Error unbanning user: " + (err?.message || err), "error");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/admin/users/${user.id}/delete/`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        showToast(`User ${user.username} has been deleted`, "success");
        fetchUsers(); // Refresh users list
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to delete user", "error");
      }
    } catch (err: any) {
      showToast("Error deleting user: " + (err?.message || err), "error");
    }
  };

  // Quest management actions
  const handleDeleteQuest = async (quest: Quest) => {
    if (!confirm(`Are you sure you want to delete quest "${quest.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/quests/admin/quests/${quest.slug}/`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        showToast(`Quest "${quest.title}" has been deleted`, "success");
        fetchQuestsForAdmin(); // Refresh quests list
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to delete quest", "error");
      }
    } catch (err: any) {
      showToast("Error deleting quest: " + (err?.message || err), "error");
    }
  };

  // Guild management actions
  const handleWarnGuild = async (guild: Guild, reason: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/guilds/${guild.guild_id || guild.id}/warn/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || `Guild ${guild.name} has been warned`, "success");
        fetchGuilds(); // Refresh guilds list
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to warn guild", "error");
      }
    } catch (err: any) {
      showToast("Error warning guild: " + (err?.message || err), "error");
    }
  };

  const handleDisableGuild = async (guild: Guild) => {
    if (!confirm(`Are you sure you want to disable guild ${guild.name}?`)) {
      return;
    }
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/guilds/${guild.guild_id || guild.id}/disable/`, {
        method: 'POST'
      });
      
      if (res.ok) {
        showToast(`Guild ${guild.name} has been disabled`, "success");
        fetchGuilds(); // Refresh guilds list
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to disable guild", "error");
      }
    } catch (err: any) {
      showToast("Error disabling guild: " + (err?.message || err), "error");
    }
  };

  const handleEnableGuild = async (guild: Guild) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/guilds/${guild.guild_id || guild.id}/enable/`, {
        method: 'POST'
      });
      
      if (res.ok) {
        showToast(`Guild ${guild.name} has been enabled`, "success");
        fetchGuilds(); // Refresh guilds list
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to enable guild", "error");
      }
    } catch (err: any) {
      showToast("Error enabling guild: " + (err?.message || err), "error");
    }
  };

  const handleResetGuildWarnings = async (guild: Guild) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/guilds/${guild.guild_id || guild.id}/reset-warnings/`, {
        method: 'POST'
      });
      
      if (res.ok) {
        showToast(`Warnings reset for guild ${guild.name}`, "success");
        fetchGuilds(); // Refresh guilds list
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to reset warnings", "error");
      }
    } catch (err: any) {
      showToast("Error resetting warnings: " + (err?.message || err), "error");
    }
  };

  // Report management actions
  const handleReportUser = async (user: User, reason: string, message: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/reports/user/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_user: user.id,
          reason,
          message
        })
      });
      
      if (res.ok) {
        showToast(`User ${user.username} has been reported`, "success");
        setShowReportModal(false);
        setReportReason("");
        setReportMessage("");
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to report user", "error");
      }
    } catch (err: any) {
      showToast("Error reporting user: " + (err?.message || err), "error");
    }
  };

  const handleReportQuest = async (quest: Quest, reason: string, message: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/reports/quest/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_quest: quest.id,
          reason,
          message
        })
      });
      
      if (res.ok) {
        showToast(`Quest "${quest.title}" has been reported`, "success");
        setShowReportModal(false);
        setReportReason("");
        setReportMessage("");
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to report quest", "error");
      }
    } catch (err: any) {
      showToast("Error reporting quest: " + (err?.message || err), "error");
    }
  };

  const handleReportGuild = async (guild: Guild, reason: string, message: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/guild-report/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_guild: guild.guild_id || guild.id,
          reason,
          message
        })
      });
      
      if (res.ok) {
        showToast(`Guild ${guild.name} has been reported`, "success");
        setShowReportModal(false);
        setReportReason("");
        setReportMessage("");
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to report guild", "error");
      }
    } catch (err: any) {
      showToast("Error reporting guild: " + (err?.message || err), "error");
    }
  };

  // Report resolution actions
  const handleResolveReport = async (report: any, action: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      // Use specific endpoints based on report type - all routes through users app
      let endpoint = "";
      if (report.type === 'user') {
        endpoint = `${API_BASE}/api/users/admin/reports/${report.id}/resolve/`;
      } else if (report.type === 'quest') {
        // Quest reports are also handled through the main reports endpoint
        endpoint = `${API_BASE}/api/users/admin/reports/${report.id}/resolve/`;
      } else if (report.type === 'guild') {
        endpoint = `${API_BASE}/api/users/admin/guild-reports/${report.id}/resolve/`;
      } else {
        // Fallback to main endpoint
        endpoint = `${API_BASE}/api/users/admin/reports/${report.id}/resolve/`;
      }
      
      const res = await fetchWithAuth(
        endpoint,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );
      
      if (res.ok) {
        showToast(`Report has been ${action}d successfully`, "success");
        
        // Remove the resolved report from the local state immediately for better UX
        setReports(prevReports => 
          prevReports.filter(r => r.id !== report.id)
        );
        
        // Also refresh the reports list to ensure consistency
        setTimeout(() => fetchReports(), 500);
      } else {
        const data = await res.json();
        showToast(data.detail || data.message || "Failed to resolve report", "error");
      }
    } catch (err: any) {
      showToast("Error resolving report: " + (err?.message || err), "error");
    }
  };

  // Appeals actions
  const handleApproveAppeal = async (appeal: any) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/ban-appeal/${appeal.id}/review/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          decision: 'lifted',
          comment: 'Appeal approved by admin'
        })
      });
      
      if (res.ok) {
        showToast("Appeal approved and user unbanned", "success");
        fetchAppeals(); // Refresh appeals list
        fetchUsers(); // Refresh users list to update ban status
      } else {
        const data = await res.json();
        showToast(data.detail || data.message || "Failed to approve appeal", "error");
      }
    } catch (err: any) {
      showToast("Error approving appeal: " + (err?.message || err), "error");
    }
  };

  const handleDenyAppeal = async (appeal: any) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/ban-appeal/${appeal.id}/review/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          decision: 'dismissed',
          comment: 'Appeal denied by admin'
        })
      });
      
      if (res.ok) {
        showToast("Appeal denied", "success");
        fetchAppeals(); // Refresh appeals list
      } else {
        const data = await res.json();
        showToast(data.detail || data.message || "Failed to deny appeal", "error");
      }
    } catch (err: any) {
      showToast("Error denying appeal: " + (err?.message || err), "error");
    }
  };

  useEffect(() => {
    if (activeTab === "actionlog") fetchActionLogs();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "quests") fetchQuestsForAdmin();
    if (activeTab === "transactions") fetchTransactions();
    if (activeTab === "receipts") fetchReceipts();
    if (activeTab === "appeals") fetchAppeals();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "guilds") fetchGuilds();
  }, [activeTab, receiptSearch, showFutureReceipts]);

  // Also fetch data on mount (for overview stats and initial load)
  useEffect(() => {
    if (isAdmin(currentUser)) {
      fetchQuestsForAdmin();
      fetchUsers();
      fetchGuilds();
      // Also fetch receipt stats for overview
      if (receipts.length === 0) {
        fetchReceipts();
      }
    }
  }, [currentUser]);

  // Filtered and searched users
  const filteredUsers = useMemo(() => {
    if (!safeUsers || !Array.isArray(safeUsers)) return [];
    return safeUsers.filter(user => {
      const username = typeof user.username === 'string' ? user.username : String(user.username ?? '');
      const email = typeof user.email === 'string' ? user.email : String(user.email ?? '');
      const matchesSearch = searchTerm === "" || 
        username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [safeUsers, searchTerm, refreshCounter]);

  // Count active and banned users
  const activeUsers = safeUsers.filter((user) => !user.isBanned).length
  const bannedUsers = safeUsers.filter((user) => user.isBanned).length

  // Count open, completed quests
  const openQuests = safeQuests.filter((quest) => quest.status === "open").length;
  const completedQuests = safeQuests.filter((quest) => quest.status === "completed").length;

  // Filtered and searched quests
  const filteredQuests = useMemo(() => {
    if (!questSearch.trim()) return safeQuests;
    const q = questSearch.trim().toLowerCase();
    return safeQuests.filter((quest: any) => {
      const title = (quest.title || "").toLowerCase();
      const author = (quest.creator?.username || "").toLowerCase();
      const category = (typeof quest.category === 'string' ? quest.category : quest.category?.name || "").toLowerCase();
      return (
        title.includes(q) ||
        author.includes(q) ||
        category.includes(q)
      );
    });
  }, [safeQuests, questSearch]);

  // Robust admin check
  const isAdmin = (user: any) => {
    if (!user) return false;
    return Boolean(
      user.is_staff === true || user.is_staff === 'true' ||
      user.isSuperuser === true || user.isSuperuser === 'true' ||
      user.is_superuser === true || user.is_superuser === 'true'
    );
  };

  if (currentUser === null || currentUser === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <span className="text-[#8B75AA] text-lg animate-pulse">Loading admin panel...</span>
      </div>
    );
  }

  if (!isAdmin(currentUser)) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#2C1A1D] mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">You do not have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#F4F0E6] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-[#8B75AA] rounded-t-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
                <p className="text-[#F4F0E6] opacity-80">Manage users, quests, guilds, and reports</p>
              </div>
            </div>
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
              </button>
              <button
                onClick={() => setActiveTab("appeals")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "appeals"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <AlertTriangle size={18} className="mr-2" />
                Appeals
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
              <button
                onClick={() => setActiveTab("transactions")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "transactions"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <ArrowUpDown size={18} className="mr-2" />
                Transactions
              </button>
              <button
                onClick={() => setActiveTab("receipts")}
                className={`flex items-center px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "receipts"
                    ? "border-b-2 border-[#8B75AA] text-[#8B75AA]"
                    : "text-gray-500 hover:text-[#8B75AA]"
                }`}
              >
                <FileText size={18} className="mr-2" />
                Receipts
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="rounded-b-lg p-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Total Users</h3>
                    <Users size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{safeUsers.length}</div>
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
                  <div className="text-3xl font-bold text-[#2C1A1D]">{safeQuests.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium">{openQuests} open</span> •{" "}
                    <span className="text-green-500">{completedQuests} completed</span>
                  </div>
                </div>

                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Reports</h3>
                    <Flag size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{reports.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium">Pending review</span>
                  </div>
                </div>

                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Transactions</h3>
                    <ArrowUpDown size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{transactions.length}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium">All time</span>
                  </div>
                </div>

                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#2C1A1D]">Receipts</h3>
                    <FileText size={18} className="text-[#8B75AA]" />
                  </div>
                  <div className="text-3xl font-bold text-[#2C1A1D]">{receiptStats.total || 0}</div>
                  <div className="text-sm text-[#8B75AA] mt-2">
                    <span className="font-medium text-yellow-600">{(receiptStats.queued_ready || 0) + (receiptStats.queued_future || 0)} total queued</span> •{" "}
                    <span className="font-medium text-green-600">{receiptStats.verified || 0} verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">All User Transactions</h3>
              
              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Transaction Type Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                    <select
                      value={transactionTypeFilter}
                      onChange={(e) => setTransactionTypeFilter(e.target.value)}
                      aria-label="Filter transactions by type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                    >
                      <option value="all">All Types</option>
                      <option value="PURCHASE">Purchase</option>
                      <option value="REWARD">Reward</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="REFUND">Refund</option>
                      <option value="CASHOUT">Cashout</option>
                    </select>
                  </div>
                  
                  {/* Search */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by user, quest..."
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {transactionsLoading && (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]"></div>
                  <span className="text-gray-500 mt-2">Loading transactions...</span>
                </div>
              )}

              {/* Error State */}
              {transactionsError && (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                  <span className="text-red-500 text-center">{transactionsError}</span>
                </div>
              )}

              {/* No Transactions */}
              {!transactionsLoading && !transactionsError && filteredTransactions.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <span className="text-gray-500 text-base">No transactions found.</span>
                  <span className="text-xs text-gray-400 mt-1">No transactions match your current filters.</span>
                </div>
              )}

              {/* Transactions Table */}
              {!transactionsLoading && !transactionsError && filteredTransactions.length > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">User</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Type</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Amount</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Commission</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Quest</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredTransactions || []).map((transaction) => (
                          <tr key={transaction?.transaction_id || Math.random()} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b align-top min-w-[120px]">
                              <div className="font-medium text-gray-900">{transaction.username || 'Unknown'}</div>
                            </td>
                            <td className="py-3 px-4 border-b align-top min-w-[100px]">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'PURCHASE' ? 'bg-blue-100 text-blue-800' :
                                transaction.type === 'REWARD' ? 'bg-green-100 text-green-800' :
                                transaction.type === 'TRANSFER' ? 'bg-purple-100 text-purple-800' :
                                transaction.type === 'REFUND' ? 'bg-yellow-100 text-yellow-800' :
                                transaction.type === 'CASHOUT' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.type_display || transaction.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 border-b align-top min-w-[100px]">
                              <div className={`font-medium ${parseFloat(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {parseFloat(transaction.amount) >= 0 ? '+' : ''}{transaction.amount} Gold
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b align-top min-w-[100px]">
                              {(() => {
                                // Handle commission fee - API returns string values like "5.00"
                                const commissionFee = transaction.commission_fee;
                                if (commissionFee && commissionFee !== '0.00' && commissionFee !== '0') {
                                  const commissionValue = parseFloat(commissionFee);
                                  if (!isNaN(commissionValue) && commissionValue > 0) {
                                    return (
                                      <div className="font-medium text-orange-600">
                                        {commissionValue.toFixed(2)} Gold
                                      </div>
                                    );
                                  }
                                }
                                return <span className="text-gray-400">-</span>;
                              })()}
                            </td>
                            <td className="py-3 px-4 border-b align-top min-w-[150px]">
                              {transaction.quest_title ? (
                                <div className="text-blue-600 text-sm font-medium">
                                  {transaction.quest_title}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 border-b align-top min-w-[150px]">
                              <div className="text-gray-600 text-sm">
                                {new Date(transaction.created_at).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Transaction Summary */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-b-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Total Transactions: </span>
                        <span className="text-gray-900">{filteredTransactions.length}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Total Commission: </span>
                        <span className="text-orange-600">
                          {filteredTransactions.reduce((sum, t) => {
                            const commissionFee = t.commission_fee;
                            if (commissionFee && commissionFee !== '0.00' && commissionFee !== '0') {
                              const commissionValue = parseFloat(commissionFee);
                              if (!isNaN(commissionValue) && commissionValue > 0) {
                                return sum + commissionValue;
                              }
                            }
                            return sum;
                          }, 0).toFixed(2)} Gold
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Receipts Tab */}
          {activeTab === "receipts" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">Gold Purchase Receipt Management</h3>
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-800">{receiptStats.queued_ready || 0}</div>
                  <div className="text-sm text-yellow-600">Ready for Review</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-800">{receiptStats.queued_future || 0}</div>
                  <div className="text-sm text-gray-600">Waiting for Batch</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-800">{receiptStats.verified || 0}</div>
                  <div className="text-sm text-green-600">Verified</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-800">{receiptStats.rejected || 0}</div>
                  <div className="text-sm text-red-600">Rejected</div>
                </div>
              </div>

              {/* Batch Info */}
              {batchInfo.next_batch_time && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-blue-800">Next Batch Processing</h4>
                      <p className="text-blue-600 text-sm">
                        {new Date(batchInfo.next_batch_time).toLocaleString()} ({batchInfo.next_batch_name})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-800">{receiptStats.queued_ready || 0}</div>
                      <div className="text-sm text-blue-600">Ready to Process</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Search and Actions */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by reference, user, batch ID..."
                        value={receiptSearch}
                        onChange={(e) => setReceiptSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                      />
                    </div>
                  </div>
                  
                  {/* Admin Debug Toggle */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={showFutureReceipts}
                        onChange={(e) => setShowFutureReceipts(e.target.checked)}
                        className="rounded"
                      />
                      Show future receipts (Debug)
                    </label>
                  </div>
                  
                  {/* Batch Actions */}
                  {selectedReceipts.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBatchAction('approve_batch')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Approve Selected ({selectedReceipts.length})
                      </button>
                      <button
                        onClick={() => handleBatchAction('reject_batch')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Reject Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {receiptsLoading && (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]"></div>
                  <span className="text-gray-500 mt-2">Loading receipts...</span>
                </div>
              )}

              {/* Error State */}
              {receiptsError && (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                  <span className="text-red-500 text-center">{receiptsError}</span>
                </div>
              )}

              {/* No Receipts */}
              {!receiptsLoading && !receiptsError && filteredReceipts.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <span className="text-gray-500 text-base">No receipts found.</span>
                  <span className="text-xs text-gray-400 mt-1">No receipts match your current filters.</span>
                </div>
              )}

              {/* Receipts Table */}
              {!receiptsLoading && !receiptsError && filteredReceipts.length > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 border-b text-left">
                            <input
                              type="checkbox"
                              checked={selectedReceipts.length === filteredReceipts.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReceipts(filteredReceipts.map(r => r.id));
                                } else {
                                  setSelectedReceipts([]);
                                }
                              }}
                              aria-label="Select all receipts"
                              className="rounded"
                            />
                          </th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">User</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Reference</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Package</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Batch</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Receipt</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Date</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredReceipts || []).map((receipt) => (
                          <tr key={receipt?.id || Math.random()} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b">
                              <input
                                type="checkbox"
                                checked={selectedReceipts.includes(receipt.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedReceipts([...selectedReceipts, receipt.id]);
                                  } else {
                                    setSelectedReceipts(selectedReceipts.filter(id => id !== receipt.id));
                                  }
                                }}
                                aria-label={`Select receipt ${receipt.payment_reference}`}
                                className="rounded"
                              />
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="font-medium text-gray-900">{receipt.user?.username || 'Unknown'}</div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-sm font-mono text-blue-600">{receipt.payment_reference}</div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-sm">
                                <div className="font-medium">{receipt.package_amount} Gold</div>
                                <div className="text-gray-500">₱{receipt.package_price}</div>
                                {receipt.bonus && (
                                  <div className="text-green-600 text-xs">{receipt.bonus}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                receipt.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                                receipt.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                receipt.status === 'verified' ? 'bg-green-100 text-green-800' :
                                receipt.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                 {receipt.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-sm">
                                {receipt.scheduled_batch && (
                                  <div className="capitalize">{receipt.scheduled_batch.replace('_', ' ')}</div>
                                )}
                                {receipt.next_processing_time && (
                                  <div className="text-gray-500 text-xs">
                                    {new Date(receipt.next_processing_time).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              {receipt.receipt_image ? (
                                <button
                                  onClick={() => {
                                    // Handle both relative and absolute URLs
                                    const imageUrl = receipt.receipt_image.startsWith('http') 
                                      ? receipt.receipt_image 
                                      : `http://localhost:8000${receipt.receipt_image}`;
                                    setSelectedReceiptImage(imageUrl);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                  View Receipt
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">No image</span>
                              )}
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-600 text-sm">
                                {new Date(receipt.created_at).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="flex gap-1">
                                {receipt.status === 'queued' || receipt.status === 'processing' ? (
                                  <>
                                    <button
                                      onClick={() => handleReceiptAction(receipt.id, 'approve')}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReceiptAction(receipt.id, 'reject')}
                                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : receipt.status === 'rejected' ? (
                                  <button
                                    onClick={() => handleReceiptAction(receipt.id, 'requeue')}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  >
                                    Requeue
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">No actions</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">User Management</h3>
              
              {/* User Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No users found. {safeUsers.length === 0 ? 'Data may not be loaded yet.' : 'Try adjusting your search.'}</p>
                    <button 
                      onClick={fetchUsers}
                      className="mt-2 px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6B9A] text-sm"
                    >
                      Retry Loading Users
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">User</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Email</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Joined</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredUsers || []).map((user) => (
                        <tr key={user?.id || Math.random()} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">
                            <div className="flex items-center">
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">{user.username}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-900">{user.email}</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (user.isBanned || user.banned) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {(user.isBanned || user.banned) ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-600 text-sm">
                              {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown'}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="flex gap-2">
                              {!(user.isBanned || user.banned) ? (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowBanModal(true);
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                  Ban
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnbanUser(user)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Unban
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-[#8B75AA] text-white text-sm font-medium rounded-md hover:bg-[#7A6B9A] focus:outline-none focus:ring-2 focus:ring-[#8B75AA] focus:ring-offset-1 transition-colors"
                              >
                                <Users size={14} className="mr-1" />
                                Details
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="px-3 py-1 bg-red-800 text-white rounded text-sm hover:bg-red-900"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>                        ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quests Tab */}
          {activeTab === "quests" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">Quest Management</h3>
              
              {/* Quest Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search quests by title, author, or category..."
                    value={questSearch}
                    onChange={(e) => setQuestSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                  />
                </div>
              </div>

              {/* Quests Table */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Quest</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Creator</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Category</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Reward</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Created</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredQuests || []).map((quest) => (
                        <tr key={quest?.id || Math.random()} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">
                            <div className="font-medium text-gray-900">{quest.title}</div>
                            <div className="text-sm text-gray-500">ID: {quest.id}</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-900">{quest.creator?.username || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-900">
                              {typeof quest.category === 'string' ? quest.category : quest.category?.name || 'Unknown'}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              quest.status === 'open' ? 'bg-green-100 text-green-800' :
                              quest.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              quest.status === 'in-progress' || quest.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {quest.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-900">{(quest as any).total_reward || (quest as any).reward || 0} Gold</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-600 text-sm">
                              {quest.created_at ? new Date(quest.created_at).toLocaleDateString() : 'Unknown'}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedQuest(quest);
                                  setShowQuestModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-[#8B75AA] text-white text-sm font-medium rounded-md hover:bg-[#7A6B9A] focus:outline-none focus:ring-2 focus:ring-[#8B75AA] focus:ring-offset-1 transition-colors"
                              >
                                <FileText size={14} className="mr-1" />
                                Details
                              </button>
                              <button
                                onClick={() => handleDeleteQuest(quest)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Guilds Tab */}
          {activeTab === "guilds" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">Guild Management</h3>
              
              {/* Guild Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search guilds by name or leader..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                  />
                </div>
              </div>

              {/* Guilds Table */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {safeGuilds.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No guilds found. Data may not be loaded yet.</p>
                    <button 
                      onClick={fetchGuilds}
                      className="mt-2 px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6B9A] text-sm"
                    >
                      Retry Loading Guilds
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Guild</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Leader</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Members</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Created</th>
                        <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(safeGuilds || []).map((guild) => (
                        <tr key={guild?.id || Math.random()} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">
                            <div className="font-medium text-gray-900">{guild.name}</div>
                            <div className="text-sm text-gray-500">ID: {guild.guild_id || guild.id}</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-900">{guild.owner?.username || (guild as any).leader_name || 'Unknown Quest Master'}</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-900">{guild.member_count || 0}</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              !guild.is_disabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {!guild.is_disabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="text-gray-600 text-sm">
                              {guild.created_at ? new Date(guild.created_at).toLocaleDateString() : 'Unknown'}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  const reason = prompt("Enter warning reason:");
                                  if (reason) handleWarnGuild(guild, reason);
                                }}
                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                              >
                                Warn
                              </button>
                              {!guild.is_disabled ? (
                                <button
                                  onClick={() => handleDisableGuild(guild)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                  Disable
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEnableGuild(guild)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Enable
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedGuild(guild);
                                  setShowGuildModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-[#8B75AA] text-white text-sm font-medium rounded-md hover:bg-[#7A6B9A] focus:outline-none focus:ring-2 focus:ring-[#8B75AA] focus:ring-offset-1 transition-colors"
                              >
                                <Users size={14} className="mr-1" />
                                Details
                              </button>
                              <button
                                onClick={() => handleResetGuildWarnings(guild)}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                              >
                                Reset Warnings
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">Report Management</h3>
              
              {/* Report Filters */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                    <select
                      value={reportTypeFilter}
                      onChange={(e) => setReportTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                    >
                      <option value="all">All Reports</option>
                      <option value="user">User Reports</option>
                      <option value="quest">Quest Reports</option>
                      <option value="guild">Guild Reports</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search reports..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading/Error States */}
              {reportsLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]"></div>
                </div>
              )}

              {reportsError && (
                <div className="text-red-600 text-center py-8">{reportsError}</div>
              )}

              {/* Reports Table */}
              {!reportsLoading && !reportsError && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Reporter</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Reported</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Type</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Reason</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Date</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredReports || []).map((report, index) => (
                          <tr key={report?.unique_key || `report-${index}`} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-900">
                                {report.reporter?.username || report.reporter_username || 'Unknown'}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-900">
                                {report.reported_user?.username || report.reported_user_username || 
                                 report.reported_guild?.name || report.reported_guild_name ||
                                 report.reported_quest_title || 'Unknown'}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                report.type === 'user' ? 'bg-blue-100 text-blue-800' : 
                                report.type === 'guild' ? 'bg-purple-100 text-purple-800' :
                                report.type === 'quest' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {report.type === 'user' ? 'User' : 
                                 report.type === 'guild' ? 'Guild' :
                                 report.type === 'quest' ? 'Quest' :
                                 'Unknown'}
                              </span>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-900 text-sm">{report.reason || 'No reason provided'}</div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                report.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-600 text-sm">
                                {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Unknown'}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => setSelectedReport(report)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                >
                                  View
                                </button>
                                {!report.resolved && (
                                  <>
                                    {report.type === 'user' && (
                                      <button
                                        onClick={() => handleResolveReport(report, 'ban')}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                      >
                                        Ban User
                                      </button>
                                    )}
                                    {report.type === 'quest' && (
                                      <button
                                        onClick={() => handleResolveReport(report, 'delete')}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                      >
                                        Delete Quest
                                      </button>
                                    )}
                                    {report.type === 'guild' && (
                                      <button
                                        onClick={() => handleResolveReport(report, 'warn')}
                                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                                      >
                                        Warn Guild
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleResolveReport(report, 'resolve')}
                                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                    >
                                      Resolve
                                    </button>
                                    <button
                                      onClick={() => handleResolveReport(report, 'dismiss')}
                                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                    >
                                      Dismiss
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appeals Tab */}
          {activeTab === "appeals" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">Ban Appeals Management</h3>
              
              {/* Appeal Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search appeals by username..."
                    value={appealSearch}
                    onChange={(e) => setAppealSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                  />
                </div>
              </div>

              {/* Loading/Error States */}
              {appealsLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]"></div>
                </div>
              )}

              {appealsError && (
                <div className="text-red-600 text-center py-8">{appealsError}</div>
              )}

              {/* Appeals Table */}
              {!appealsLoading && !appealsError && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">User</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Email</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Appeal Reason</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Status</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Submitted</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(appeals || []).map((appeal) => (
                          <tr key={appeal?.id || Math.random()} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b">
                              <div className="font-medium text-gray-900">{appeal.user?.username || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">ID: {appeal.user?.id}</div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-900 text-sm">
                                {appeal.user?.email || 'No email'}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-900 text-sm max-w-xs">
                                <div className="break-words">
                                  {appeal.message || appeal.appeal_reason || 'No reason provided'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                appeal.status === 'pending' || !appeal.reviewed ? 'bg-yellow-100 text-yellow-800' :
                                appeal.review_decision === 'lifted' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {appeal.reviewed ? 
                                  (appeal.review_decision === 'lifted' ? 'Approved' : 'Denied') : 
                                  'Pending'
                                }
                              </span>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-600 text-sm">
                                {appeal.created_at ? new Date(appeal.created_at).toLocaleDateString() : 'Unknown'}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              {(!appeal.reviewed || appeal.status === 'pending') && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveAppeal(appeal)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    Lift Ban
                                  </button>
                                  <button
                                    onClick={() => handleDenyAppeal(appeal)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                  >
                                    Deny
                                  </button>
                                </div>
                              )}
                              {appeal.reviewed && (
                                <div className="text-sm text-gray-500">
                                  {appeal.review_decision === 'lifted' ? 'Ban lifted' : 'Appeal denied'}
                                  {appeal.reviewed_at && (
                                    <div className="text-xs">
                                      {new Date(appeal.reviewed_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Log Tab */}
          {activeTab === "actionlog" && (
            <div className="rounded-b-lg p-6 bg-white">
              <h3 className="text-xl font-bold text-[#2C1A1D] mb-8 text-center">Administrator Action Log</h3>
              
              {/* Loading/Error States */}
              {actionLogsLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]"></div>
                </div>
              )}

              {actionLogsError && (
                <div className="text-red-600 text-center py-8">{actionLogsError}</div>
              )}

              {/* Action Logs Table */}
              {!actionLogsLoading && !actionLogsError && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Admin</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Action</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Target</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Details</th>
                          <th className="py-3 px-4 border-b text-left font-medium text-gray-900">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(actionLogs || []).map((log) => (
                          <tr key={log?.id || Math.random()} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b">
                              <div className="font-medium text-gray-900">{typeof log.admin === 'string' ? log.admin : (log as any).performer || 'Unknown'}</div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                log.action === 'ban' ? 'bg-red-100 text-red-800' :
                                log.action === 'unban' ? 'bg-green-100 text-green-800' :
                                log.action === 'delete' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-900">{typeof log.target_user === 'string' ? log.target_user : (log as any).target || 'Unknown'}</div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-900 text-sm max-w-xs truncate">
                                {log.details || (log as any).description || 'No details provided'}
                              </div>
                            </td>
                            <td className="py-3 px-4 border-b">
                              <div className="text-gray-600 text-sm">
                                {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetailsModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          report={selectedReport}
          users={safeUsers}
          onResolve={() => {}}
          showToast={showToast}
        />
      )}

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Ban User: {selectedUser.username || selectedUser.display_name || selectedUser.id}</h3>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                  setBanReason("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for ban
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter the reason for banning this user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setSelectedUser(null);
                    setBanReason("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBanUser(selectedUser, banReason)}
                  disabled={!banReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal - Profile-based Design */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#CDAA7D] max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-all">
            {/* Header/Profile Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-0 md:gap-6 bg-gradient-to-r from-[#CDAA7D] to-[#8B75AA] p-8 rounded-t-2xl relative">
              {/* Avatar */}
              <div className="flex-shrink-0 flex items-center justify-center md:items-start md:justify-start w-full md:w-48 mb-4 md:mb-0">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-[#8B75AA] flex items-center justify-center text-5xl text-white overflow-hidden">
                  {selectedUser.avatar && typeof selectedUser.avatar === 'string' && selectedUser.avatar.match(/^https?:\//) ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.displayName || selectedUser.username}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span>
                      {selectedUser.displayName 
                        ? selectedUser.displayName.charAt(0).toUpperCase()
                        : (selectedUser.username || selectedUser.id).charAt(0).toUpperCase()
                      }
                    </span>
                  )}
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 flex flex-col items-center md:items-start w-full">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="absolute top-4 right-4 text-[#2C1A1D] hover:text-[#fff] bg-white/40 hover:bg-[#CDAA7D] rounded-full p-1 transition"
                  aria-label="Close"
                >
                  <X size={28} />
                </button>
                
                <h2 className="text-3xl font-extrabold text-white drop-shadow-sm text-center md:text-left">
                  {selectedUser.displayName || selectedUser.username || selectedUser.id}
                </h2>
                <p className="text-white/80 text-lg mb-1">@{selectedUser.username || selectedUser.id}</p>
                
                <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <span className={`text-white text-sm px-4 py-1 rounded-full font-semibold shadow ${
                      selectedUser.isBanned ? 'bg-red-600' : 'bg-green-600'
                    }`}>
                      {selectedUser.isBanned ? 'Banned' : 'Active'}
                    </span>
                    <span className="bg-[#2C1A1D] text-white text-sm px-4 py-1 rounded-full font-semibold shadow">
                      ID: {selectedUser.id}
                    </span>
                    {selectedUser.is_staff && (
                      <span className="bg-[#CDAA7D] text-[#2C1A1D] text-sm px-4 py-1 rounded-full font-semibold shadow">
                        Staff
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="p-6">
              {/* Basic Information */}
              <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                  <Users size={20} className="mr-2 text-[#8B75AA]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Email</label>
                    <p className="text-[#2C1A1D] font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Date Joined</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Total Gold</label>
                    <p className="text-[#2C1A1D] font-medium">{(selectedUser as any).total_gold || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">XP Points</label>
                    <p className="text-[#2C1A1D] font-medium">{(selectedUser as any).xp || 0}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                  <Star size={20} className="mr-2 text-[#8B75AA]" />
                  Account Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Account Status</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedUser.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedUser.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">User Type</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedUser.is_staff ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.is_staff ? 'Staff Member' : 'Regular User'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Email Verified</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedUser.email_verified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedUser.email_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Last Seen</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ban Information */}
              {selectedUser.isBanned && (selectedUser as any).ban_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                    <AlertTriangle size={20} className="mr-2" />
                    Ban Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Ban Reason</label>
                    <p className="text-red-800 font-medium bg-red-100 p-3 rounded">
                      {(selectedUser as any).ban_reason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quest Details Modal - Revamped Design */}
      {showQuestModal && selectedQuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#CDAA7D] max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] p-6 rounded-t-2xl relative">
              <button
                onClick={() => {
                  setShowQuestModal(false);
                  setSelectedQuest(null);
                }}
                className="absolute top-4 right-4 text-white hover:text-[#2C1A1D] bg-white/20 hover:bg-white/80 rounded-full p-2 transition"
                aria-label="Close"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-2xl text-white font-bold">
                  {selectedQuest.title.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedQuest.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedQuest.status === 'open' ? 'bg-green-500 text-white' :
                      selectedQuest.status === 'completed' ? 'bg-blue-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {selectedQuest.status?.charAt(0).toUpperCase() + selectedQuest.status?.slice(1)}
                    </span>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ID: {selectedQuest.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Basic Information */}
              <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                  <FileText size={20} className="mr-2 text-[#8B75AA]" />
                  Quest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Creator</label>
                    <p className="text-[#2C1A1D] font-medium">{selectedQuest.creator?.username || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Category</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {typeof selectedQuest.category === 'string' ? selectedQuest.category : selectedQuest.category?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Reward</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {(selectedQuest as any).total_reward || (selectedQuest as any).reward || 0} Gold
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Created Date</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {selectedQuest.created_at ? new Date(selectedQuest.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                  <FileText size={20} className="mr-2 text-[#8B75AA]" />
                  Description
                </h3>
                <div className="bg-white p-4 rounded-lg border border-[#E9E1F5]">
                  <p className="text-[#2C1A1D] whitespace-pre-wrap">
                    {selectedQuest.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Quest Details */}
              <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                  <Trophy size={20} className="mr-2 text-[#8B75AA]" />
                  Quest Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Participants</label>
                    <p className="text-[#2C1A1D] font-medium">{(selectedQuest as any).participants_count || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Submissions</label>
                    <p className="text-[#2C1A1D] font-medium">{(selectedQuest as any).submissions_count || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Deadline</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {(selectedQuest as any).deadline ? new Date((selectedQuest as any).deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className={`rounded-lg p-4 border ${
                selectedQuest.status === 'open' ? 'bg-green-50 border-green-200' :
                selectedQuest.status === 'completed' ? 'bg-blue-50 border-blue-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <h3 className={`text-lg font-bold mb-2 flex items-center ${
                  selectedQuest.status === 'open' ? 'text-green-800' :
                  selectedQuest.status === 'completed' ? 'text-blue-800' :
                  'text-yellow-800'
                }`}>
                  <Star size={20} className="mr-2" />
                  Quest Status
                </h3>
                <p className={`font-medium ${
                  selectedQuest.status === 'open' ? 'text-green-700' :
                  selectedQuest.status === 'completed' ? 'text-blue-700' :
                  'text-yellow-700'
                }`}>
                  This quest is currently <strong>{selectedQuest.status}</strong>
                  {selectedQuest.status === 'open' && ' and accepting participants.'}
                  {selectedQuest.status === 'completed' && ' and no longer accepting participants.'}
                  {selectedQuest.status === 'in_progress' && ' with active participants working on it.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guild Details Modal - Revamped Design */}
      {showGuildModal && selectedGuild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#CDAA7D] max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] p-6 rounded-t-2xl relative">
              <button
                onClick={() => {
                  setShowGuildModal(false);
                  setSelectedGuild(null);
                }}
                className="absolute top-4 right-4 text-white hover:text-[#2C1A1D] bg-white/20 hover:bg-white/80 rounded-full p-2 transition"
                aria-label="Close"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-2xl text-white font-bold">
                  {selectedGuild.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedGuild.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      !selectedGuild.is_disabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {!selectedGuild.is_disabled ? 'Active' : 'Disabled'}
                    </span>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ID: {selectedGuild.guild_id || selectedGuild.id}
                    </span>
                    {(selectedGuild as any).warning_count > 0 && (
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {(selectedGuild as any).warning_count} Warning{(selectedGuild as any).warning_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Basic Information */}
              <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                  <Users size={20} className="mr-2 text-[#8B75AA]" />
                  Guild Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Quest Master (Leader)</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {selectedGuild.owner?.username || (selectedGuild as any).leader_name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Members</label>
                    <p className="text-[#2C1A1D] font-medium">{selectedGuild.member_count || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Specialization</label>
                    <p className="text-[#2C1A1D] font-medium">{(selectedGuild as any).specialization || 'General'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Created Date</label>
                    <p className="text-[#2C1A1D] font-medium">
                      {selectedGuild.created_at ? new Date(selectedGuild.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guild Description */}
              {selectedGuild.description && (
                <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                    <FileText size={20} className="mr-2 text-[#8B75AA]" />
                    Description
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-[#E9E1F5]">
                    <p className="text-[#2C1A1D] whitespace-pre-wrap">{selectedGuild.description}</p>
                  </div>
                </div>
              )}

              {/* Guild Settings */}
              <div className="bg-[#F9F7F2] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2C1A1D] mb-4 flex items-center">
                  <Star size={20} className="mr-2 text-[#8B75AA]" />
                  Guild Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Privacy</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      (selectedGuild as any).privacy === 'public' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {(selectedGuild as any).privacy === 'public' ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Minimum Level</label>
                    <p className="text-[#2C1A1D] font-medium">{(selectedGuild as any).minimum_level || 1}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Approval Required</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      (selectedGuild as any).require_approval ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {(selectedGuild as any).require_approval ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B75AA] mb-1">Allow Discovery</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      (selectedGuild as any).allow_discovery ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {(selectedGuild as any).allow_discovery ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderation Status */}
              <div className={`rounded-lg p-4 border ${
                !selectedGuild.is_disabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-lg font-bold mb-2 flex items-center ${
                  !selectedGuild.is_disabled ? 'text-green-800' : 'text-red-800'
                }`}>
                  <AlertTriangle size={20} className="mr-2" />
                  Moderation Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`font-medium ${
                      !selectedGuild.is_disabled ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Status: <strong>{!selectedGuild.is_disabled ? 'Active' : 'Disabled'}</strong>
                    </p>
                  </div>
                  <div>
                    <p className={`font-medium ${
                      !selectedGuild.is_disabled ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Warnings: <strong>{(selectedGuild as any).warning_count || 0}</strong>
                    </p>
                  </div>
                </div>
                {selectedGuild.is_disabled && (selectedGuild as any).disable_reason && (
                  <div className="mt-3 p-3 bg-red-100 rounded">
                    <label className="block text-sm font-medium text-red-700 mb-1">Disable Reason</label>
                    <p className="text-red-800">{(selectedGuild as any).disable_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Report {reportType === 'user' ? 'User' : reportType === 'quest' ? 'Quest' : 'Guild'}
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportTarget(null);
                  setReportReason("");
                  setReportMessage("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporting: {reportType === 'user' ? reportTarget.username : reportType === 'quest' ? reportTarget.title : reportTarget.name}
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                >
                  <option value="">Select a reason...</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="fraud">Fraud</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Provide additional details about this report..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B75AA]"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportTarget(null);
                    setReportReason("");
                    setReportMessage("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (reportType === 'user') {
                      handleReportUser(reportTarget, reportReason, reportMessage);
                    } else if (reportType === 'quest') {
                      handleReportQuest(reportTarget, reportReason, reportMessage);
                    } else {
                      handleReportGuild(reportTarget, reportReason, reportMessage);
                    }
                  }}
                  disabled={!reportReason}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {selectedReceiptImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Receipt Image</h3>
              <button
                onClick={() => setSelectedReceiptImage(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close receipt image"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedReceiptImage}
                alt="Payment Receipt"
                className="max-w-full h-auto rounded-lg shadow-lg max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminPanel;
