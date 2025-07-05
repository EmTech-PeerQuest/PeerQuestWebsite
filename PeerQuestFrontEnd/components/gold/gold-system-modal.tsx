"use client"

import { useState, useEffect } from "react"
import { X, Coins, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"
import type { User } from "@/lib/types"
import { KYCVerificationModal } from '@/components/auth/kyc-verification-modal'
import { TransactionAPI, Transaction } from '@/lib/api/transactions'

interface GoldSystemModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser?: User | null
  setCurrentUser?: (user: User | ((prev: User) => User)) => void
  showToast?: (message: string, type?: string) => void
}

export function GoldSystemModal({ isOpen, onClose, currentUser, setCurrentUser, showToast }: GoldSystemModalProps) {
  const [activeTab, setActiveTab] = useState<"purchase" | "transactions" | "goldex">("transactions")
  const [transactionFilter, setTransactionFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all-time")
  const [cashoutAmount, setCashoutAmount] = useState("")
  const [cashoutMethod, setCashoutMethod] = useState("gcash")
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user transactions from backend
  // SECURITY: This endpoint ensures all users (adventurers, quest makers, moderators, admins)
  // can only see their own transactions, preventing unauthorized access to other users' data
  const fetchTransactions = async () => {
    if (!currentUser?.id) {
      setError('Please log in to view transactions')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Use the existing TransactionAPI which handles authentication properly
      const transactionsData = await TransactionAPI.getMyTransactions()
      setTransactions(transactionsData || [])
      setError(null) // Clear any previous errors on success
    } catch (error) {
      console.error('Error fetching transactions:', error)
      
      let errorMessage = 'Failed to load transaction history'
      let toastMessage = 'Failed to load transaction history'
      
      if (error instanceof Error) {
        // Use the improved error messages from the API
        if (error.message.includes('Authentication required') || 
            error.message.includes('log in')) {
          errorMessage = 'Please log in to view your transactions'
          toastMessage = 'Please log in to view your transaction history'
        } else if (error.message.includes('Access denied') || 
                   error.message.includes('permission')) {
          errorMessage = 'You do not have permission to view transactions'
          toastMessage = 'Access denied - please contact support if this persists'
        } else if (error.message.includes('Server error') || 
                   error.message.includes('try again later')) {
          errorMessage = 'Server temporarily unavailable'
          toastMessage = 'Server error - please try again in a few moments'
        } else if (error.message.length > 0 && error.message !== 'Failed to get transactions') {
          // Use the specific error message from the API
          errorMessage = error.message
          toastMessage = error.message
        }
      }
      
      setError(errorMessage)
      if (showToast) {
        showToast(toastMessage, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch transactions when modal opens or user changes
  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchTransactions()
    }
  }, [isOpen, currentUser?.id])

  if (!isOpen) return null

  // If modal is open but user is not authenticated, show login prompt
  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#F4F0E6] rounded-lg w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-bold text-[#2C1A1D] mb-4">Authentication Required</h2>
          <p className="text-[#8B75AA] mb-6">Please log in to access the Gold Treasury and view your transactions.</p>
          <button
            onClick={onClose}
            className="bg-[#8B75AA] text-white px-6 py-2 rounded hover:bg-[#7A6699] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Mock purchase statistics - in real app, this would come from API
  const packagePurchaseStats = [
    { amount: 500, purchaseCount: 1250 },
    { amount: 2800, purchaseCount: 3420 }, // Most purchased
    { amount: 6500, purchaseCount: 890 },
    { amount: 14500, purchaseCount: 340 },
  ]

  // Find the most popular package based on purchase count
  const mostPopularAmount = packagePurchaseStats.reduce((prev, current) => 
    prev.purchaseCount > current.purchaseCount ? prev : current
  ).amount

  const goldPackages = [
    { amount: 500, price: 70, usd: 1.25, rate: 0.14, popular: mostPopularAmount === 500, bonus: "" },
    { amount: 2800, price: 350, usd: 6.25, rate: 0.125, popular: mostPopularAmount === 2800, bonus: "+300 bonus coins" },
    { amount: 6500, price: 700, usd: 12.50, rate: 0.108, popular: mostPopularAmount === 6500, bonus: "+1000 bonus coins" },
    { amount: 14500, price: 1500, usd: 26.79, rate: 0.103, popular: mostPopularAmount === 14500, bonus: "+2500 bonus coins" },
  ]

  const purchaseGold = (amount: number, price: number) => {
    if (setCurrentUser && currentUser) {
      setCurrentUser((prev) => ({
        ...prev,
        gold: (prev.gold || 0) + amount,
      }))
      if (showToast) {
        showToast(`Successfully purchased ${amount} gold for ₱${price}!`)
      }
      // Refresh transactions to show the new purchase
      fetchTransactions()
    }
  }

  const handleCashOut = () => {
    if (!currentUser || !cashoutAmount) return

    const amount = Number.parseInt(cashoutAmount)
    const minimumCashout = 5000 // 5,000 coins minimum as per suggestions

    if (amount < minimumCashout) {
      if (showToast) {
        showToast(`Minimum cashout is ${minimumCashout.toLocaleString()} coins`, "error")
      }
      return
    }

    if (amount > (currentUser.gold || 0)) {
      if (showToast) {
        showToast("Insufficient gold balance", "error")
      }
      return
    }

    // Check if KYC is required for large amounts (₱1000+)
    const cashoutValue = amount * 0.07
    if (cashoutValue >= 1000) {
      setShowKYCModal(true)
      return
    }

    processCashout(amount)
  }

  const processCashout = (amount: number) => {
    const cashoutValue = (amount * 0.07).toFixed(2)

    if (setCurrentUser) {
      setCurrentUser((prev) => ({
        ...prev,
        gold: (prev.gold || 0) - amount,
      }))
    }

    if (showToast) {
      showToast(
        `Successfully requested cashout of ${amount.toLocaleString()} coins (₱${cashoutValue}) via ${cashoutMethod.toUpperCase()}. Processing time: 24-72 hours.`,
        "success",
      )
    }

    setCashoutAmount("")
  }

  // Helper functions to map backend transaction types to UI categories
  const getTransactionType = (transaction: Transaction): "incoming" | "outgoing" => {
    // PURCHASE & REFUND = incoming (user gains gold)
    // REWARD & TRANSFER = outgoing (user spends/loses gold)
    // Note: REWARD type includes both quest creation (outgoing) and quest completion (incoming)
    // We determine direction by the amount sign: negative = outgoing, positive = incoming
    if (transaction.type === "PURCHASE" || transaction.type === "REFUND") {
      return "incoming"
    } else if (transaction.type === "REWARD" || transaction.type === "TRANSFER") {
      // For REWARD type, check the amount to determine direction
      const amount = Number(transaction.amount)
      return amount < 0 ? "outgoing" : "incoming"
    } else {
      // Fallback: use amount sign
      const amount = Number(transaction.amount)
      return amount < 0 ? "outgoing" : "incoming"
    }
  }

  const getTransactionCategory = (transaction: Transaction): string => {
    switch (transaction.type) {
      case "PURCHASE":
        // PURCHASE type is only for actual gold package purchases from Buy Gold tab
        if (transaction.description?.includes("Gold Package") || 
            transaction.description?.includes("Purchased") ||
            transaction.description?.includes("gold addition") ||
            transaction.description?.toLowerCase().includes("purchase")) {
          return "Gold Package Purchase"
        } else {
          return "Gold Purchase"
        }
      case "REWARD":
        // REWARD type covers both quest creation and quest completion
        if (transaction.description?.includes("Quest creation:")) {
          return "Quest Creation"
        } else if (transaction.description?.includes("Manual reward") || transaction.description?.includes("completing:")) {
          return "Quest Completion Reward"
        } else {
          return "Quest Reward"
        }
      case "TRANSFER":
        return "Transfer"
      case "REFUND":
        if (transaction.description?.includes("Quest deletion refund:")) {
          return "Quest Deletion Refund"
        } else {
          return "Refund"
        }
      default:
        return transaction.type_display || transaction.type
    }
  }

  // Filter transactions based on date range
  const filterTransactionsByDate = (transactions: Transaction[]): Transaction[] => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (dateRange) {
      case "past-30-days":
        cutoffDate.setDate(now.getDate() - 30)
        break
      case "past-90-days":
        cutoffDate.setDate(now.getDate() - 90)
        break
      case "all-time":
      default:
        return transactions
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at)
      return transactionDate >= cutoffDate
    })
  }

  // Apply date filter first, then transaction type filter
  const dateFilteredTransactions = filterTransactionsByDate(transactions)
  
  // Define transactions that represent actual gold flow (incoming/outgoing)
  const REAL_GOLD_FLOW_TYPES = ['PURCHASE', 'REWARD', 'REFUND', 'TRANSFER']
  
  const filteredTransactions = dateFilteredTransactions.filter((transaction) => {
    if (transactionFilter === "all") {
      // "All Transactions" should only show transactions with real gold flow
      // Excludes internal/system-only transactions that don't represent actual gold movement
      return REAL_GOLD_FLOW_TYPES.includes(transaction.type)
    }
    
    // Filter by incoming/outgoing gold direction
    if (transactionFilter === "incoming") {
      return REAL_GOLD_FLOW_TYPES.includes(transaction.type) && getTransactionType(transaction) === "incoming"
    }
    
    if (transactionFilter === "outgoing") {
      return REAL_GOLD_FLOW_TYPES.includes(transaction.type) && getTransactionType(transaction) === "outgoing"
    }
    
    // Filter by specific transaction type
    if (transactionFilter === "PURCHASE") {
      // Only show actual gold package purchases from the "BUY GOLD" tab
      // These should be PURCHASE type AND have descriptions indicating they're gold purchases
      return transaction.type === "PURCHASE" && 
             (transaction.description?.includes("Gold Package") || 
              transaction.description?.includes("Purchased") ||
              transaction.description?.includes("gold addition") ||
              transaction.description?.toLowerCase().includes("purchase"))
    }
    
    if (transactionFilter === "REWARD") {
      // Show all REWARD transactions (quest creation and quest completion)
      return transaction.type === "REWARD"
    }
    
    return transaction.type === transactionFilter
  })

  // Calculate totals based on currently applied filters (date + type)
  // For "incoming" filter: show all incoming gold (purchases + refunds)
  // For "outgoing" filter: show all outgoing gold (rewards + transfers)
  // For specific transaction types: only show totals relevant to that type
  let totalPurchased = 0
  let totalSpent = 0

  if (transactionFilter === "incoming") {
    // For incoming filter, only count actual gold package purchases and refunds
    // No quest rewards - those are internal platform transactions
    const actualGoldPurchases = filteredTransactions
      .filter((t) => t.type === "PURCHASE" && 
              (t.description?.includes("Gold Package") || 
               t.description?.includes("Purchased") ||
               t.description?.includes("gold addition") ||
               t.description?.toLowerCase().includes("purchase")))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    
    const refunds = filteredTransactions
      .filter((t) => t.type === "REFUND")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    
    totalPurchased = actualGoldPurchases + refunds    } else if (transactionFilter === "outgoing") {
    // Sum all outgoing gold transactions (REWARD with negative amounts and TRANSFER)
    totalSpent = filteredTransactions
      .filter((t) => (t.type === "REWARD" && Number(t.amount) < 0) || t.type === "TRANSFER")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
  } else if (transactionFilter === "PURCHASE") {
    // Only show purchased gold for actual gold package purchases from Buy Gold tab
    totalPurchased = filteredTransactions
      .filter((t) => t.type === "PURCHASE" && 
              (t.description?.includes("Gold Package") || 
               t.description?.includes("Purchased") ||
               t.description?.includes("gold addition") ||
               t.description?.toLowerCase().includes("purchase")))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    // No totalSpent for purchase filter
  } else if (transactionFilter === "REWARD") {
    // For REWARD filter, show both spent (quest creation) and earned (quest completion)
    const rewardTransactions = filteredTransactions.filter((t) => t.type === "REWARD")
    totalSpent = rewardTransactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    totalPurchased = rewardTransactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
  } else if (transactionFilter === "REFUND") {
    // Refunds count as "purchased" (gold gained back)
    totalPurchased = filteredTransactions
      .filter((t) => t.type === "REFUND")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    // No totalSpent for refund filter
  } else if (transactionFilter === "TRANSFER") {
    // Transfers count as "spent" (gold sent away)
    totalSpent = filteredTransactions
      .filter((t) => t.type === "TRANSFER")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    // No totalPurchased for transfer filter
  } else {
    // Default behavior for "all" transactions
    // Gold Purchased = Only actual gold package PURCHASE transactions (from Buy Gold tab)
    totalPurchased = filteredTransactions
      .filter((t) => t.type === "PURCHASE" && 
              (t.description?.includes("Gold Package") || 
               t.description?.includes("Purchased") ||
               t.description?.includes("gold addition") ||
               t.description?.toLowerCase().includes("purchase")))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
    
    // Gold Spent = REWARD transactions with negative amounts (quest creation)
    totalSpent = filteredTransactions
      .filter((t) => t.type === "REWARD" && Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#CDAA7D] px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#2C1A1D]">Gold Treasury</h2>
          <button onClick={onClose} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#CDAA7D]">
          <button
            onClick={() => setActiveTab("purchase")}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === "purchase"
                ? "text-[#2C1A1D] border-b-2 border-[#2C1A1D] bg-[#CDAA7D]/20"
                : "text-[#8B75AA] hover:text-[#2C1A1D]"
            }`}
          >
            <Coins size={16} className="inline mr-2" />
            BUY GOLD
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === "transactions"
                ? "text-[#2C1A1D] border-b-2 border-[#2C1A1D] bg-[#CDAA7D]/20"
                : "text-[#8B75AA] hover:text-[#2C1A1D]"
            }`}
          >
            <ArrowUpDown size={16} className="inline mr-2" />
            MY TRANSACTIONS
          </button>
          <button
            onClick={() => setActiveTab("goldex")}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === "goldex"
                ? "text-[#2C1A1D] border-b-2 border-[#2C1A1D] bg-[#CDAA7D]/20"
                : "text-[#8B75AA] hover:text-[#2C1A1D]"
            }`}
          >
            <TrendingUp size={16} className="inline mr-2" />
            GOLDEX
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Purchase Tab */}
          {activeTab === "purchase" && (
            <div>
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-[#2C1A1D] mb-2">Purchase Gold Coins</h3>
                <p className="text-[#8B75AA]">Choose a package to enhance your questing experience</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {goldPackages.map((pkg) => (
                  <div
                    key={pkg.amount}
                    className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                      pkg.popular ? "border-[#8B75AA] bg-[#8B75AA]/5" : "border-[#CDAA7D] hover:border-[#8B75AA]/50"
                    }`}
                    onClick={() => purchaseGold(pkg.amount, pkg.price)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#8B75AA] text-white px-3 py-1 rounded-full text-xs font-bold">
                        MOST POPULAR
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <Coins size={32} className="text-[#CDAA7D]" />
                        <div>
                          <div className="text-xl font-bold text-[#2C1A1D]">{pkg.amount.toLocaleString()} Gold</div>
                          <div className="text-sm text-[#8B75AA]">₱{pkg.price.toLocaleString()}</div>
                        </div>
                      </div>
                      {pkg.bonus && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#8B75AA] bg-[#CDAA7D]/20 px-2 py-1 rounded">
                            {pkg.bonus}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[#8B75AA] text-center">
                      ₱{(pkg.price / pkg.amount).toFixed(2)} per gold
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#2C1A1D] mb-4">My Transactions</h3>
                <div className="flex items-center gap-2 text-sm text-[#8B75AA] mb-4">
                  <Coins size={16} className="text-[#CDAA7D]" />
                  <span>My Balance: {currentUser?.gold || 0} Gold</span>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <select
                    className="px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                    value={transactionFilter}
                    onChange={(e) => setTransactionFilter(e.target.value)}
                  >
                    <option value="all">All Transactions (Real Gold Flow)</option>
                    <option value="incoming">Incoming Gold (Purchases & Refunds Only)</option>
                    <option value="outgoing">Outgoing Gold (Quest Creation & Transfers Only)</option>
                    <option value="PURCHASE">Gold Package Purchases Only (From Buy Gold Tab)</option>
                    <option value="REWARD">Quest Transactions Only (Creation & Completion)</option>
                    <option value="TRANSFER">Transfers Only</option>
                    <option value="REFUND">Refunds Only</option>
                  </select>
                  <select
                    className="px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="past-30-days">Past 30 Days</option>
                    <option value="past-90-days">Past 90 Days</option>
                    <option value="all-time">All Time</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-green-600" />
                    <span className="font-bold text-green-800">
                      {transactionFilter === "incoming" ? "Gold Gained" : 
                       transactionFilter === "outgoing" ? "No Gold Gained" : 
                       "Gold Purchased"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-800">{totalPurchased.toLocaleString()}</div>
                  <div className="text-sm text-green-600">
                    {totalPurchased === 0 ? 
                      (transactionFilter === "incoming" ? "No gold purchases or refunds yet" : "No gold purchases yet") : 
                     transactionFilter === "all" ? "Gold from purchases & rewards" : 
                     transactionFilter === "incoming" ? "Gold from purchases & refunds only" :
                     transactionFilter === "outgoing" ? "No gold gained from outgoing transactions" :
                     "Filtered gold gained"}
                    {dateRange !== "all-time" && totalPurchased > 0 && (
                      <span className="block text-xs">
                        ({dateRange === "past-30-days" ? "Last 30 days" : "Last 90 days"})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={20} className="text-red-600" />
                    <span className="font-bold text-red-800">
                      {transactionFilter === "outgoing" ? "Gold Spent" : 
                       transactionFilter === "incoming" ? "No Gold Spent" : 
                       "Gold Spent"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-800">{totalSpent.toLocaleString()}</div>
                  <div className="text-sm text-red-600">
                    {totalSpent === 0 ? 
                      (transactionFilter === "outgoing" ? "No gold spent yet" : "No gold spent yet") :
                     transactionFilter === "all" ? "Gold spent on quest creation" : 
                     transactionFilter === "outgoing" ? "Gold spent on quest creation & transfers" :
                     transactionFilter === "incoming" ? "No gold spent on incoming transactions" :
                     "Filtered gold spending"}
                    {dateRange !== "all-time" && totalSpent > 0 && (
                      <span className="block text-xs">
                        ({dateRange === "past-30-days" ? "Last 30 days" : "Last 90 days"})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-[#8B75AA]">Loading transactions...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-600">{error}</div>
                  <button 
                    onClick={fetchTransactions}
                    className="mt-2 text-[#8B75AA] hover:text-[#2C1A1D] underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[#8B75AA]">
                    {transactions.length === 0 
                      ? "No transactions found" 
                      : "No transactions match the selected filters"
                    }
                  </div>
                  {transactions.length > 0 && (
                    <button 
                      onClick={() => {
                        setTransactionFilter("all")
                        setDateRange("all-time")
                      }}
                      className="mt-2 text-[#8B75AA] hover:text-[#2C1A1D] underline text-sm"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => {
                    const transactionType = getTransactionType(transaction)
                    const category = getTransactionCategory(transaction)
                    const date = new Date(transaction.created_at)
                    
                    return (
                      <div key={transaction.transaction_id} className="bg-white border border-[#CDAA7D] rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                transaction.type === "PURCHASE" && 
                                (transaction.description?.includes("Gold Package") || 
                                 transaction.description?.includes("Purchased") ||
                                 transaction.description?.includes("gold addition") ||
                                 transaction.description?.toLowerCase().includes("purchase"))
                                  ? "bg-green-100" 
                                  : transaction.type === "REFUND" 
                                    ? "bg-blue-100"
                                    : "bg-red-100"
                              }`}
                            >
                              {transaction.type === "PURCHASE" && 
                               (transaction.description?.includes("Gold Package") || 
                                transaction.description?.includes("Purchased") ||
                                transaction.description?.includes("gold addition") ||
                                transaction.description?.toLowerCase().includes("purchase")) ? (
                                <TrendingUp size={16} className="text-green-600" />
                              ) : transaction.type === "REFUND" ? (
                                <TrendingUp size={16} className="text-blue-600" />
                              ) : (
                                <TrendingDown size={16} className="text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[#2C1A1D]">{category}</div>
                              <div className="text-sm text-[#8B75AA]">{transaction.description}</div>
                              <div className="text-xs text-[#8B75AA]">{date.toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div
                            className={`text-lg font-bold ${
                              transaction.type === "PURCHASE" && 
                              (transaction.description?.includes("Gold Package") || 
                               transaction.description?.includes("Purchased") ||
                               transaction.description?.includes("gold addition") ||
                               transaction.description?.toLowerCase().includes("purchase"))
                                ? "text-green-600"
                                : transaction.type === "REFUND"
                                  ? "text-blue-600" 
                                  : "text-red-600"
                            }`}
                          >
                            {transaction.type === "REFUND" || 
                             (transaction.type === "PURCHASE" && 
                              (transaction.description?.includes("Gold Package") || 
                               transaction.description?.includes("Purchased") ||
                               transaction.description?.includes("gold addition") ||
                               transaction.description?.toLowerCase().includes("purchase")))
                              ? "+" : "-"}
                            {Math.abs(Number(transaction.amount))} Gold
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* GoldEx Tab */}
          {activeTab === "goldex" && (
            <div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#2C1A1D] mb-2">GoldEx - Gold Exchange</h3>
                <p className="text-[#8B75AA]">Convert your earned gold into real money</p>
              </div>

              <div className="max-w-2xl mx-auto">
                {/* Balance Overview */}
                <div className="bg-gradient-to-r from-[#CDAA7D]/20 to-[#8B75AA]/20 border border-[#CDAA7D] rounded-lg p-6 mb-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-[#8B75AA] mb-1">Available Balance</div>
                      <div className="text-2xl font-bold text-[#2C1A1D]">
                        {(currentUser?.gold || 0).toLocaleString()} Gold
                      </div>
                      <div className="text-sm text-[#8B75AA]">≈ ₱{((currentUser?.gold || 0) * 0.07).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[#8B75AA] mb-1">Exchange Rate</div>
                      <div className="text-xl font-bold text-[#2C1A1D]">₱0.07</div>
                      <div className="text-sm text-[#8B75AA]">per gold coin</div>
                    </div>
                  </div>
                </div>

                {/* Cashout Form */}
                <div className="bg-white border border-[#CDAA7D] rounded-lg p-6 mb-6">
                  <h4 className="font-bold text-[#2C1A1D] mb-4">Cash Out Gold</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Amount to Cash Out (Gold)</label>
                      <input
                        type="number"
                        value={cashoutAmount}
                        onChange={(e) => setCashoutAmount(e.target.value)}
                        placeholder="Enter amount (min. 5,000)"
                        min="5000"
                        max={currentUser?.gold || 0}
                        className="w-full px-3 py-2 border border-[#CDAA7D] rounded focus:outline-none focus:border-[#8B75AA]"
                      />
                      {cashoutAmount && (
                        <div className="mt-2 text-sm text-[#8B75AA]">
                          You will receive: ₱{(Number.parseInt(cashoutAmount || "0") * 0.07).toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Cashout Method</label>
                      <select
                        value={cashoutMethod}
                        onChange={(e) => setCashoutMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-[#CDAA7D] rounded focus:outline-none focus:border-[#8B75AA]"
                      >
                        <option value="gcash">GCash</option>
                        <option value="paymaya">PayMaya</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCashOut}
                      disabled={
                        !cashoutAmount ||
                        Number.parseInt(cashoutAmount || "0") < 5000 ||
                        Number.parseInt(cashoutAmount || "0") > (currentUser?.gold || 0)
                      }
                      className={`w-full py-3 rounded font-medium transition-colors ${
                        cashoutAmount &&
                        Number.parseInt(cashoutAmount) >= 5000 &&
                        Number.parseInt(cashoutAmount) <= (currentUser?.gold || 0)
                          ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Request Cashout
                    </button>
                  </div>
                </div>

                {/* Quick Cashout Options */}
                <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4 mb-6">
                  <h5 className="font-semibold text-[#2C1A1D] mb-3">Quick Cashout</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {[5000, 10000, 20000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCashoutAmount(amount.toString())}
                        disabled={(currentUser?.gold || 0) < amount}
                        className={`p-2 text-sm rounded border transition-colors ${
                          (currentUser?.gold || 0) >= amount
                            ? "border-[#8B75AA] text-[#8B75AA] hover:bg-[#8B75AA] hover:text-white"
                            : "border-gray-300 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {amount.toLocaleString()}
                        <div className="text-xs">₱{(amount * 0.07).toFixed(0)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-[#8B75AA]/10 border border-[#8B75AA]/30 rounded-lg p-4">
                  <h4 className="font-bold text-[#2C1A1D] mb-2">Important Notes:</h4>
                  <ul className="text-sm text-[#8B75AA] space-y-1">
                    <li>• Minimum cashout: 5,000 gold coins (₱350)</li>
                    <li>• Exchange rate: 1 gold = ₱0.07 PHP</li>
                    <li>• Processing time: 24-72 hours</li>
                    <li>• KYC verification required for cashouts ≥₱1,000</li>
                    <li>• Only earned gold from completed quests is eligible</li>
                    <li>• Supported methods: GCash, PayMaya, Bank Transfer</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* KYC Verification Modal */}
        {showKYCModal && (
          <KYCVerificationModal
            isOpen={showKYCModal}
            onClose={() => setShowKYCModal(false)}
            onComplete={() => {
              processCashout(Number.parseInt(cashoutAmount))
              setShowKYCModal(false)
            }}
            cashoutAmount={Number.parseInt(cashoutAmount || "0")}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  )
}
