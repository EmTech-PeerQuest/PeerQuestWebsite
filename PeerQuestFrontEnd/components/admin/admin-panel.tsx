"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, FileText, Flag, Home, X, Search, Trash2, AlertTriangle, Clock, ArrowUpDown } from "lucide-react";
import type { ActionLogEntry } from "@/lib/types";
import { ReportDetailsModal } from "@/components/modals/report-details-modal";
import type { User, Quest, Guild } from "@/lib/types";
import { QuestAPI } from "@/lib/api/quests";

// --- Helper: fetchWithAuth ---
// Handles token refresh for all API calls
const fetchWithAuth = async (url: string, options: any = {}, autoLogout = true) => {
  const API_BASE = "http://localhost:8000";
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
  users: User[]
  quests: Quest[]
  guilds: Guild[]
  setUsers: (users: User[]) => void
  setQuests: (quests: Quest[]) => void
  setGuilds: (guilds: Guild[]) => void
  showToast: (message: string, type?: string) => void
}

function AdminPanel({
  currentUser,
  users,
  quests,
  guilds,
  setUsers,
  setQuests,
  setGuilds,
  showToast,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "quests" | "guilds" | "reports" | "appeals" | "actionlog" | "transactions" | "receipts">("overview")
  
  // Action Log State
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);
  const [actionLogsLoading, setActionLogsLoading] = useState(false);
  const [actionLogsError, setActionLogsError] = useState("");

  // Appeals search
  const [appealSearch, setAppealSearch] = useState("");
  
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

  // Filter and search reports
  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (reportTypeFilter === "user") filtered = filtered.filter((r) => r.type === "user" || !!r.reported_user);
    else if (reportTypeFilter === "quest") filtered = filtered.filter((r) => r.type === "quest" || !!r.reported_quest);
    if (reportSearch.trim()) {
      const q = reportSearch.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        return (
          (r.reported_user?.username?.toLowerCase?.().includes(q) || r.reported_user_username?.toLowerCase?.().includes(q)) ||
          (r.reported_quest_title?.toLowerCase?.().includes(q)) ||
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

  // Fetch quests for admin panel
  const fetchQuestsForAdmin = async () => {
    try {
      const data = await QuestAPI.getQuests();
      if (Array.isArray(data)) {
        setQuests(data);
      } else if (Array.isArray(data.results)) {
        setQuests(data.results);
      } else if (Array.isArray(data.value)) {
        setQuests(data.value);
      } else {
        setQuests([]);
      }
    } catch (err: any) {
      setQuests([]);
      if (showToast) showToast("Failed to fetch quests: " + (err?.message || err), "error");
    }
  };

  // Fetch action logs from backend
  const fetchActionLogs = async () => {
    setActionLogsLoading(true);
    setActionLogsError("");
    try {
      const API_BASE = "http://localhost:8000";
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
    try {
      const API_BASE = "http://localhost:8000";
      const res = await fetchWithAuth(`${API_BASE}/api/users/admin/reports/`);
      if (!res.ok) {
        const err = await res.text();
        setReportsError(err);
        setReports([]);
        setReportsLoading(false);
        return;
      }
      const data = await res.json();
      setReports(data);
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
      const API_BASE = "http://localhost:8000";
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

  // Fetch receipts from backend
  const fetchReceipts = async () => {
    setReceiptsLoading(true);
    setReceiptsError("");
    try {
      const API_BASE = "http://localhost:8000";
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
        
        // Debug: Log the first receipt to check receipt_image data
        if (data.receipts && data.receipts.length > 0) {
          console.log('Sample receipt data:', {
            id: data.receipts[0].id,
            receipt_image: data.receipts[0].receipt_image,
            user: data.receipts[0].user?.username
          });
        }
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
      const API_BASE = "http://localhost:8000";
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
      const API_BASE = "http://localhost:8000";
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

  useEffect(() => {
    if (activeTab === "actionlog") fetchActionLogs();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "quests") fetchQuestsForAdmin();
    if (activeTab === "transactions") fetchTransactions();
    if (activeTab === "receipts") fetchReceipts();
  }, [activeTab, receiptSearch, showFutureReceipts]);

  // Also fetch quests on mount (for overview stats)
  useEffect(() => {
    fetchQuestsForAdmin();
    // Also fetch receipt stats for overview
    if (receipts.length === 0) {
      fetchReceipts();
    }
  }, []);

  // Basic state variables
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReport, setSelectedReport] = useState<any>(null)

  // Filtered and searched users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const username = typeof user.username === 'string' ? user.username : String(user.username ?? '');
      const email = typeof user.email === 'string' ? user.email : String(user.email ?? '');
      const matchesSearch = searchTerm === "" || 
        username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchTerm]);

  // Count active and banned users
  const activeUsers = users.filter((user) => !user.isBanned).length
  const bannedUsers = users.filter((user) => user.isBanned).length

  // Count open, completed quests
  const safeQuests = Array.isArray(quests) ? quests : [];
  const openQuests = safeQuests.filter((quest) => quest.status === "open").length;
  const completedQuests = safeQuests.filter((quest) => quest.status === "completed").length;

  // Quest search state
  const [questSearch, setQuestSearch] = useState("");
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

  // Ban Appeals State
  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [appealsError, setAppealsError] = useState("");

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
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.transaction_id} className="hover:bg-gray-50">
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
                        {filteredReceipts.map((receipt) => (
                          <tr key={receipt.id} className="hover:bg-gray-50">
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

          {/* Other tabs placeholder */}
          {activeTab !== "overview" && activeTab !== "transactions" && activeTab !== "receipts" && (
            <div className="rounded-b-lg p-6 bg-white">
              <div className="text-center py-16">
                <h3 className="text-xl font-bold text-[#2C1A1D] mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h3>
                <p className="text-gray-600">This section is currently being developed.</p>
              </div>
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
          users={users}
          onResolve={() => {}}
          showToast={showToast}
        />
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
