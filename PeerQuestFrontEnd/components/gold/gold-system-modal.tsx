"use client"

import { useState, useEffect, useRef } from "react"
import { X, Coins, TrendingUp, TrendingDown, ArrowUpDown, CreditCard, Smartphone, CheckCircle, Clock, ArrowLeft } from "lucide-react"
import type { User } from "@/lib/types"
import { KYCVerificationModal } from '@/components/auth/kyc-verification-modal'
import { TransactionAPI, Transaction } from '@/lib/api/transactions'
import { PaymentAPI } from '@/lib/api/payments'
import QRCode from 'qrcode'
import { generateGCashQRData, getGCashConfig, validateGCashQR } from '@/lib/payment/gcash-qr'

interface GoldSystemModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser?: User | null
  setCurrentUser?: (user: User | ((prev: User) => User)) => void
  showToast?: (message: string, type?: string) => void
  refreshUser?: () => Promise<void>
}

// Payment Configuration - Easy to modify
const PAYMENT_CONFIG = {
  // Set to true to use your static GCash QR code image
  // Set to false to generate dynamic QR codes with auto-fill amounts (recommended)
  USE_STATIC_GCASH_QR: true, // ✅ MULTIPLE STATIC QRs: Different QR for each package!
  
  // Path to your GCash QR code image (relative to public folder)
  GCASH_QR_IMAGE_PATH: '/images/payment/gcash-qr.png', // Default fallback
  
  // Multiple QR code paths for different packages
  GCASH_QR_PATHS: {
    70: '/images/payment/gcash-qr-70.png',     // 500 Gold - ₱70
    350: '/images/payment/gcash-qr-350.png',   // 2800 Gold - ₱350
    700: '/images/payment/gcash-qr-700.png',   // 6500 Gold - ₱700
    1500: '/images/payment/gcash-qr-1500.png', // 14500 Gold - ₱1500
  },
  
  // Your GCash details (displayed in payment instructions)
  GCASH_MERCHANT_NAME: 'PeerQuest (MA*K JO*N WA**E Y.)', // Your actual GCash name from the QR
  GCASH_MERCHANT_NUMBER: '09951723524', // Your actual GCash number (visible as 099****524)
  GCASH_INSTRUCTIONS_ENABLED: true,
  
  // QR Code generation settings
  QR_CODE_SIZE: 256,
  QR_CODE_MARGIN: 2,
}

export function GoldSystemModal({ isOpen, onClose, currentUser, setCurrentUser, showToast, refreshUser }: GoldSystemModalProps) {
  const [activeTab, setActiveTab] = useState<"purchase" | "transactions" | "goldex">("transactions")
  const [transactionFilter, setTransactionFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all-time")
  const [cashoutAmount, setCashoutAmount] = useState("")
  const [cashoutMethod, setCashoutMethod] = useState("gcash")
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Purchase flow state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<{amount: number, price: number, bonus?: string} | null>(null)
  const [purchaseStep, setPurchaseStep] = useState<"confirm" | "payment" | "upload" | "success">("confirm")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [paymentReference, setPaymentReference] = useState<string>("")
  const [paymentTimeout, setPaymentTimeout] = useState<number>(300) // 5 minutes
  const [receiptImage, setReceiptImage] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      
      // Refresh user balance to ensure it's in sync
      if (refreshUser) {
        await refreshUser()
      }
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

  const purchaseGold = (amount: number, price: number, bonus?: string) => {
    // Open the purchase modal instead of direct purchase
    setSelectedPackage({ amount, price, bonus })
    setShowPurchaseModal(true)
    setPurchaseStep("confirm")
  }

  const generatePaymentReference = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `PQ${timestamp}${random}`
  }

  const generateQRCode = async (paymentData: any) => {
    try {
      // Use configuration to determine QR code type
      if (PAYMENT_CONFIG.USE_STATIC_GCASH_QR) {
        // Use specific QR code based on package price
        const price = paymentData.price as keyof typeof PAYMENT_CONFIG.GCASH_QR_PATHS
        const qrPath = PAYMENT_CONFIG.GCASH_QR_PATHS[price] || PAYMENT_CONFIG.GCASH_QR_IMAGE_PATH
        setQrCodeDataUrl(qrPath)
        console.log(`Using static QR for ₱${paymentData.price}: ${qrPath}`)
        return
      }
      
      // Generate GCash QR Ph compliant QR code with auto-fill amount
      const gcashConfig = getGCashConfig()
      
      const gcashQRData = generateGCashQRData({
        merchantName: PAYMENT_CONFIG.GCASH_MERCHANT_NAME,
        merchantAccount: PAYMENT_CONFIG.GCASH_MERCHANT_NUMBER,
        amount: paymentData.price,
        currency: 'PHP',
        reference: paymentData.reference,
        description: `${paymentData.amount} Gold Coins${paymentData.bonus ? ` (${paymentData.bonus})` : ''}`
      }, {
        merchantName: PAYMENT_CONFIG.GCASH_MERCHANT_NAME,
        merchantAccount: PAYMENT_CONFIG.GCASH_MERCHANT_NUMBER
      })

      // Validate the generated QR data
      if (!validateGCashQR(gcashQRData)) {
        throw new Error('Generated QR code does not conform to GCash QR Ph standard')
      }

      // Generate QR code image from the GCash QR Ph data
      const dataUrl = await QRCode.toDataURL(gcashQRData, {
        width: PAYMENT_CONFIG.QR_CODE_SIZE,
        margin: PAYMENT_CONFIG.QR_CODE_MARGIN,
        color: {
          dark: '#2C1A1D',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      
      setQrCodeDataUrl(dataUrl)
      
      // Log for debugging (remove in production)
      console.log('Generated GCash QR Ph data:', gcashQRData)
      console.log('Payment amount will auto-fill when scanned:', paymentData.price, 'PHP')
      
    } catch (error) {
      console.error('Error generating GCash QR code:', error)
      if (showToast) {
        showToast('Failed to generate payment QR code', 'error')
      }
      
      // Fallback to static QR if dynamic generation fails
      if (!PAYMENT_CONFIG.USE_STATIC_GCASH_QR) {
        console.log('Falling back to static QR code')
        setQrCodeDataUrl(PAYMENT_CONFIG.GCASH_QR_IMAGE_PATH)
      }
    }
  }

  const handlePurchaseConfirm = async () => {
    if (!selectedPackage) return

    // Generate payment reference for tracking
    const reference = generatePaymentReference()
    setPaymentReference(reference)
    setPurchaseStep("payment")

    // Generate QR code
    await generateQRCode({
      amount: selectedPackage.amount,
      price: selectedPackage.price,
      bonus: selectedPackage.bonus,
      reference
    })

    // Start payment timeout countdown
    setPaymentTimeout(300) // 5 minutes
    const interval = setInterval(() => {
      setPaymentTimeout(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handlePurchaseCancel()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePurchaseCancel = () => {
    setShowPurchaseModal(false)
    setSelectedPackage(null)
    setPurchaseStep("confirm")
    setQrCodeDataUrl("")
    setPaymentReference("")
    setPaymentTimeout(300)
    setReceiptImage(null)
    setReceiptPreview("")
    setUploading(false)
    setSubmissionResult(null)
  }

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        if (showToast) {
          showToast('Please upload an image file', 'error')
        }
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        if (showToast) {
          showToast('Image size must be less than 5MB', 'error')
        }
        return
      }

      setReceiptImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const submitPaymentProof = async () => {
    if (!receiptImage || !selectedPackage || !paymentReference) {
      if (showToast) {
        showToast('Please upload your payment receipt', 'error')
      }
      return
    }

    setUploading(true)

    try {
      const result = await PaymentAPI.submitPaymentProof({
        payment_reference: paymentReference,
        package_amount: selectedPackage.amount,
        package_price: selectedPackage.price,
        bonus: selectedPackage.bonus || '',
        receipt: receiptImage
      })
      
      console.log('Payment submission result:', result)
      
      // Store result for success modal
      setSubmissionResult(result)
      
      // Show success step
      setPurchaseStep("success")
    } catch (error) {
      console.error('Error submitting payment proof:', error)
      if (showToast) {
        showToast(error instanceof Error ? error.message : 'Failed to submit payment proof', 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  const proceedToUpload = () => {
    setPurchaseStep("upload")
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
                    onClick={() => purchaseGold(pkg.amount, pkg.price, pkg.bonus)}
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
      </div>      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#F4F0E6] rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Confirm Purchase Step */}
            {purchaseStep === "confirm" && (
              <>
                {/* Header - Fixed */}
                <div className="bg-[#CDAA7D] px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <h2 className="text-xl font-bold text-[#2C1A1D]">Confirm Purchase</h2>
                  <button onClick={handlePurchaseCancel} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-140px)]">
                  <div className="bg-white border border-[#CDAA7D] rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Coins size={32} className="text-[#CDAA7D]" />
                        <div>
                          <div className="text-xl font-bold text-[#2C1A1D]">
                            {selectedPackage.amount.toLocaleString()} Gold
                          </div>
                          {selectedPackage.bonus && (
                            <div className="text-sm text-[#8B75AA]">{selectedPackage.bonus}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#2C1A1D]">₱{selectedPackage.price.toLocaleString()}</div>
                        <div className="text-sm text-[#8B75AA]">
                          ₱{(selectedPackage.price / selectedPackage.amount).toFixed(2)} per gold
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone size={16} className="text-blue-600" />
                      <span className="font-semibold text-blue-800">Payment Method</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      You'll be redirected to GCash for secure payment processing. 
                      Scan the QR code with your GCash app to complete the transaction.
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePurchaseCancel}
                      className="flex-1 py-3 px-4 border border-[#CDAA7D] text-[#2C1A1D] rounded hover:bg-[#CDAA7D]/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePurchaseConfirm}
                      className="flex-1 py-3 px-4 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors font-semibold"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Payment Step */}
            {purchaseStep === "payment" && (
              <>
                {/* Header - Fixed */}
                <div className="bg-[#CDAA7D] px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={handlePurchaseCancel} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-[#2C1A1D]">GCash Payment</h2>
                  </div>
                  <button onClick={handlePurchaseCancel} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-140px)]">
                  <div className="text-center mb-6">
                    <div className="bg-white border border-[#CDAA7D] rounded-lg p-6 mb-4">
                      <div className="mb-4">
                        <div className="text-lg font-bold text-[#2C1A1D] mb-1">
                          {selectedPackage.amount.toLocaleString()} Gold Coins
                        </div>
                        <div className="text-2xl font-bold text-[#8B75AA]">₱{selectedPackage.price.toLocaleString()}</div>
                        {selectedPackage.bonus && (
                          <div className="text-sm text-green-600 mt-1">{selectedPackage.bonus}</div>
                        )}
                      </div>
                      
                      {qrCodeDataUrl && (
                        <div className="mb-4">
                          <img src={qrCodeDataUrl} alt="GCash Payment QR Code" className="mx-auto mb-2 max-w-64 h-auto" />
                          <div className="text-sm text-[#8B75AA] mb-2">Scan with GCash app to pay</div>
                          {!PAYMENT_CONFIG.USE_STATIC_GCASH_QR ? (
                            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                              <div className="font-semibold text-green-800 mb-1">✨ Smart QR Code - Auto-Fill Amount!</div>
                              <div className="text-green-700">
                                1. Open your <strong>GCash app</strong><br />
                                2. Tap <strong>"Pay QR"</strong><br />
                                3. Scan the QR code above<br />
                                4. <strong>Amount (₱{selectedPackage.price.toLocaleString()}) will auto-fill!</strong><br />
                                5. Reference: <strong>{paymentReference}</strong> (auto-filled)<br />
                                6. Complete the payment<br />
                                7. Screenshot your receipt for confirmation
                              </div>
                              <div className="mt-2 text-xs text-green-600">
                                💡 This QR code follows GCash QR Ph standard for automatic amount entry.
                              </div>
                            </div>
                          ) : qrCodeDataUrl.includes('/images/payment/') && PAYMENT_CONFIG.GCASH_INSTRUCTIONS_ENABLED && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                              <div className="font-semibold text-blue-800 mb-1">📱 GCash Payment Instructions:</div>
                              <div className="text-blue-700">
                                1. Open your <strong>GCash app</strong><br />
                                2. Tap <strong>"Pay QR"</strong><br />
                                3. Scan the QR code above<br />
                                4. Complete the payment<br />
                                5. Screenshot your receipt for confirmation
                              </div>
                              <div className="mt-2 text-xs text-blue-600">
                                💡 Payment will be verified manually. Please keep your receipt.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-[#8B75AA] bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <div className="font-semibold mb-1">💳 Merchant:</div>
                            <div>{PAYMENT_CONFIG.GCASH_MERCHANT_NAME}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-yellow-600" />
                        <span className="font-semibold text-yellow-800">Time Remaining</span>
                      </div>
                      <div className="text-lg font-bold text-yellow-800">
                        {Math.floor(paymentTimeout / 60)}:{(paymentTimeout % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm text-yellow-600">Payment expires automatically</div>
                    </div>

                    <button
                      onClick={proceedToUpload}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold mb-2"
                    >
                      I've Completed Payment - Upload Receipt
                    </button>
                    
                    <button
                      onClick={handlePurchaseCancel}
                      className="w-full py-2 px-4 border border-[#CDAA7D] text-[#2C1A1D] rounded hover:bg-[#CDAA7D]/10 transition-colors"
                    >
                      Cancel Payment
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Upload Receipt Step */}
            {purchaseStep === "upload" && (
              <>
                {/* Header - Fixed */}
                <div className="bg-[#CDAA7D] px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPurchaseStep("payment")} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-[#2C1A1D]">Upload Payment Receipt</h2>
                  </div>
                  <button onClick={handlePurchaseCancel} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-140px)]">
                  <div className="text-center mb-6">
                    <div className="bg-white border border-[#CDAA7D] rounded-lg p-6 mb-6">
                      <div className="mb-4">
                        <div className="text-lg font-bold text-[#2C1A1D] mb-1">
                          {selectedPackage.amount.toLocaleString()} Gold Coins
                        </div>
                        <div className="text-2xl font-bold text-[#8B75AA]">₱{selectedPackage.price.toLocaleString()}</div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                        <div className="font-semibold text-blue-800 mb-2">📸 Upload Your Payment Receipt</div>
                        <div className="text-sm text-blue-700 mb-4">
                          Please upload a clear screenshot of your GCash payment receipt to verify your transaction.
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8B75AA] file:text-white hover:file:bg-[#7A6699]"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Supported formats: JPG, PNG, GIF (Max 5MB)
                            </div>
                          </div>

                          {receiptPreview && (
                            <div className="mt-4">
                              <div className="text-sm font-semibold text-gray-700 mb-2">Preview:</div>
                              <img 
                                src={receiptPreview} 
                                alt="Receipt Preview" 
                                className="max-w-full h-auto max-h-64 mx-auto border rounded"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm mb-4">
                        <div className="font-semibold text-yellow-800 mb-1">⚠️ Important:</div>
                        <div className="text-yellow-700">
                          • Make sure the receipt shows the exact amount: ₱{selectedPackage.price.toLocaleString()}<br />
                          • Receipt should be clear and readable<br />
                          • Verification typically takes 2-24 hours
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPurchaseStep("payment")}
                        className="flex-1 py-2 px-4 border border-[#CDAA7D] text-[#2C1A1D] rounded hover:bg-[#CDAA7D]/10 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={submitPaymentProof}
                        disabled={!receiptImage || uploading}
                        className={`flex-1 py-3 px-4 rounded font-semibold transition-colors ${
                          receiptImage && !uploading
                            ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {uploading ? "Uploading..." : "Submit for Verification"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Success Step */}
            {purchaseStep === "success" && (
              <>
                {/* Header - Fixed */}
                <div className="bg-[#CDAA7D] px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <h2 className="text-xl font-bold text-[#2C1A1D]">Payment Submitted!</h2>
                  <div></div> {/* Empty div for spacing */}
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 text-center overflow-y-auto max-h-[calc(90vh-80px)]">
                  <div className="mb-6">
                    <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#2C1A1D] mb-2">Receipt Uploaded Successfully</h3>
                    <p className="text-[#8B75AA] mb-4">
                      Your payment proof has been submitted for verification. Your {selectedPackage.amount.toLocaleString()} gold coins{selectedPackage.bonus ? ` (${selectedPackage.bonus})` : ''} will be added to your account once verified.
                    </p>
                    
                    {submissionResult?.batch_info && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="text-sm font-semibold text-blue-800 mb-2">Verification Details</div>
                        <div className="text-sm text-blue-700 space-y-1">
                          <div><strong>Payment Reference:</strong> {paymentReference}</div>
                          <div><strong>Batch:</strong> {submissionResult.batch_info.batch_name}</div>
                          <div><strong>Processing Time:</strong> {new Date(submissionResult.batch_info.processing_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="text-sm font-semibold text-yellow-800 mb-1">What happens next?</div>
                      <div className="text-sm text-yellow-700 space-y-1 text-left">
                        <div>• Your payment will be reviewed by our admin team</div>
                        <div>• Verification typically takes a few hours</div>
                        <div>• Gold will be automatically added once approved</div>
                        <div>• Check "My Transactions" tab for status updates</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-[#8B75AA] mb-4">
                      You can safely close this window. Your submission is being processed.
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      // Close modal and switch to transactions tab
                      handlePurchaseCancel()
                      setActiveTab("transactions")
                      
                      // Refresh transactions and user data
                      if (refreshUser) {
                        refreshUser()
                      }
                      fetchTransactions()
                      
                      // Show success toast
                      if (showToast && submissionResult) {
                        let message = submissionResult.message || 'Payment proof submitted successfully'
                        if (submissionResult.batch_info) {
                          message = `Payment submitted! Reference: ${paymentReference}. Check "My Transactions" for updates.`
                        }
                        showToast(message, 'success')
                      }
                    }}
                    className="w-full py-3 px-4 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors font-semibold"
                  >
                    View My Transactions
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
  )
}
