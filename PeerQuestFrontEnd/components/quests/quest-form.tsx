"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Star } from "lucide-react"
import { Quest } from "@/lib/types"
import { QuestAPI, QuestCategory, CreateQuestData, UpdateQuestData, DifficultyTier } from "@/lib/api/quests"
import { TransactionAPI } from "@/lib/api/transactions"

interface QuestFormProps {
  quest?: Quest | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (quest: Quest) => void
  isEditing?: boolean
  currentUser?: any
}

export function QuestForm({ quest, isOpen, onClose, onSuccess, isEditing = false, currentUser }: QuestFormProps) {
  const [formData, setFormData] = useState<CreateQuestData>({
    title: "",
    description: "",
    category: 0, // Default to 0 so users must select a category
    difficulty: "initiate" as DifficultyTier,
    due_date: "",
    requirements: "",
    resources: "",
  })
  
  const [goldBudget, setGoldBudget] = useState<number>(0) // Total pool of gold user wants to spend
  const [postAs, setPostAs] = useState<'individual' | 'guild'>('individual')
  const [categories, setCategories] = useState<QuestCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [userGoldBalance, setUserGoldBalance] = useState<number>(0)
  
  /** Timestamp for balance refresh tracking */
  const [balanceLastUpdated, setBalanceLastUpdated] = useState<number>(Date.now())
  
  // ========================
  // CONSTANTS
  // ========================
  
  /** Commission rate for quest creation (5%) */
  const COMMISSION_RATE = 0.05
  
  // Function to calculate commission from total budget (5% of total budget)
  const calculateCommission = (totalBudget: number): number => {
    const budget = Number(totalBudget)
    if (isNaN(budget) || budget <= 0) return 0
    return Math.ceil(budget * COMMISSION_RATE)
  }

  // Function to calculate quest reward (total budget - commission)
  const calculateQuestReward = (totalBudget: number): number => {
    const budget = Number(totalBudget)
    if (isNaN(budget) || budget <= 0) return 0
    const commission = calculateCommission(budget)
    return budget - commission
  }

  const calculateMaxAffordableBudget = (availableBalance: number): number => {
    // Maximum budget is simply the available balance
    return Math.min(999, availableBalance)
  }

  // Calculate maximum budget for quest editing
  const calculateMaxBudgetForEditing = (): number => {
    if (isEditing && quest) {
      const oldGoldReward = quest.gold_reward || 0
      const oldBudget = oldGoldReward > 0 ? Math.ceil(oldGoldReward / 0.95) : 0
      // User can increase budget by their available balance
      return Math.min(999, oldBudget + userGoldBalance)
    }
    return calculateMaxAffordableBudget(userGoldBalance)
  }

  // Computed values
  const commission = calculateCommission(goldBudget)
  const questReward = calculateQuestReward(goldBudget)

  // Load categories and user balance when modal opens
  useEffect(() => {
    const loadCategories = async () => {
      if (isOpen) {
        try {
          const categoriesData = await QuestAPI.getCategories()
          setCategories(categoriesData)
        } catch (error) {
          console.error('Failed to load categories from API, using fallback:', error)
          
          // Use hardcoded categories as fallback - this ensures the form always works
          setCategories([
            { id: 1, name: "Design", description: "Visual design, UX/UI, graphic design, and creative projects", created_at: "2025-06-29T19:59:54.019285+08:00" },
            { id: 2, name: "Development", description: "Programming, software development, web development, and technical projects", created_at: "2025-06-29T19:59:54.019285+08:00" },
            { id: 3, name: "Writing", description: "Content creation, copywriting, documentation, and written communication", created_at: "2025-06-29T19:59:54.019285+08:00" },
            { id: 4, name: "Music", description: "Music composition, audio production, sound design, and musical projects", created_at: "2025-06-29T19:59:54.019285+08:00" },
            { id: 5, name: "Art", description: "Traditional and digital art, illustration, photography, and artistic endeavors", created_at: "2025-06-29T19:59:54.019285+08:00" },
            { id: 6, name: "Marketing", description: "Digital marketing, social media, SEO, advertising, and promotional activities", created_at: "2025-06-29T19:59:54.019285+08:00" },
            { id: 7, name: "Research", description: "Data analysis, market research, academic research, and investigative projects", created_at: "2025-06-29T19:59:54.019285+08:00" }
          ])
        }
      }
    }
    
    loadCategories()
  }, [isOpen])
  
  /**
   * Load user's gold balance when modal opens
   * Handles authentication and balance validation
   */
  useEffect(() => {
    // Always fetch the latest gold balance when the form opens or after balance changes
    const loadUserGoldBalance = async () => {
      if (isOpen) {
        try {
          // Check if user is authenticated first
          const token = localStorage.getItem('access_token');
          if (!token) {
            console.warn('No auth token available - cannot fetch balance');
            setUserGoldBalance(0);
            return;
          }
          
          if (!currentUser) {
            console.warn('No current user data - defaulting to 0 balance');
            setUserGoldBalance(0);
            return;
          }
          
          console.log('🔄 Quest Form: Fetching latest user gold balance...');
          console.log('🔄 Quest Form: Current user:', currentUser.username, 'ID:', currentUser.id);
          
          // Always fetch fresh balance - ignore any cached/optimistic values
          const balanceData = await TransactionAPI.getMyBalance();
          console.log('🔄 Quest Form: Balance response:', balanceData);
          console.log('🔄 Quest Form: Current gold balance:', balanceData.gold_balance);
          
          // Force update the balance state with fresh data
          const freshBalance = Number(balanceData.gold_balance);
          setUserGoldBalance(freshBalance);
          console.log('🔄 Quest Form: Set userGoldBalance to:', freshBalance);
          
          // Reset gold budget if it now exceeds the user's balance
          const maxAffordableBudget = calculateMaxAffordableBudget(freshBalance)
          
          if (goldBudget > maxAffordableBudget) {
            console.log('🔄 Quest Form: Resetting gold budget as it exceeds new balance');
            setGoldBudget(maxAffordableBudget);
          }
        } catch (error) {
          console.error('❌ Quest Form: Failed to load gold balance:', error);
          setUserGoldBalance(0);
          // Handle auth errors - could redirect to login here
          if (error instanceof Error && error.message.includes('Authentication required')) {
            console.warn('❌ Quest Form: Authentication issue detected - user may need to log in again');
            // Optionally: redirect to login
            // router.push('/login');
          }
        }
      }
    }
    
    loadUserGoldBalance();
  }, [isOpen, balanceLastUpdated, currentUser]) // Removed goldReward from dependencies to prevent loops

  /**
   * Initialize form data when modal opens
   * Handles both editing and creation modes
   */
  useEffect(() => {
    if (isOpen) {
      if (isEditing && quest) {
        // Populate form with existing quest data
        setFormData({
          title: quest.title,
          description: quest.description,
          category: quest.category.id,
          difficulty: quest.difficulty as DifficultyTier,
          due_date: quest.due_date ? quest.due_date.split('T')[0] : "",
          requirements: quest.requirements || "",
          resources: quest.resources || "",
        })
        // Calculate budget from existing quest reward (reverse calculation)
        const existingReward = quest.gold_reward || 0;
        // If there's an existing reward, calculate what the original budget would have been
        // Since reward = budget - commission and commission = budget * 0.05
        // We have: reward = budget - (budget * 0.05) = budget * 0.95
        // So: budget = reward / 0.95
        const estimatedBudget = existingReward > 0 ? Math.ceil(existingReward / 0.95) : 0;
        setGoldBudget(estimatedBudget)
        setPostAs('individual')
      } else {
        // Reset form for new quest
        setFormData({
          title: "",
          description: "",
          category: 0, // Keep as 0 initially - user must select a category
          difficulty: "initiate",
          due_date: "",
          requirements: "",
          resources: "",
        })
        setGoldBudget(getGoldBudgetRangeForDifficulty("initiate").min)
        setPostAs('individual')
      }
      setErrors({})
    }
  }, [isOpen, isEditing, quest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Check authentication
    if (!currentUser) {
      setErrors({ general: 'You must be logged in to create a quest.' })
      setIsLoading(false)
      return
    }

    // Validate form data
    const validationErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      validationErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 3) {
      validationErrors.title = 'Title must be at least 3 characters long'
    } else if (formData.title.trim().length > 100) {
      validationErrors.title = 'Title cannot exceed 100 characters'
    }
    
    if (!formData.description.trim()) {
      validationErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      validationErrors.description = 'Description must be at least 10 characters long'
    } else if (formData.description.trim().length > 2000) {
      validationErrors.description = 'Description cannot exceed 2000 characters'
    }
    
    // Enhanced category validation
    if (!formData.category || formData.category === 0) {
      validationErrors.category = 'Please select a category for your quest'
    } else {
      // Check if the selected category exists in the loaded categories
      const categoryExists = categories.find(cat => cat.id === formData.category)
      if (!categoryExists && categories.length > 0) {
        validationErrors.category = 'Selected category is no longer available. Please choose another.'
      }
    }
    
    // Enhanced deadline validation - deadline is now required
    if (!formData.due_date || formData.due_date.trim() === '') {
      validationErrors.due_date = 'Please select a deadline for your quest'
    } else {
      const selectedDate = new Date(formData.due_date)
      const today = new Date()
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      // Check if date is valid
      if (isNaN(selectedDate.getTime())) {
        validationErrors.due_date = 'Please enter a valid date'
      } else if (selectedDate < todayDateOnly) {
        validationErrors.due_date = 'Deadline cannot be in the past'
      } else {
        // Check if deadline is too far in the future (optional - 1 year limit)
        const oneYearFromNow = new Date()
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
        if (selectedDate > oneYearFromNow) {
          validationErrors.due_date = 'Deadline cannot be more than 1 year from now'
        }
      }
    }
    
    // Gold budget validation
    console.log('🔍 Validation Debug:', {
      userGoldBalance,
      goldBudget,
      questReward,
      commission,
      isEditing,
      timestamp: new Date().toISOString()
    });
    
    // For quest editing, validate based on additional gold needed
    if (isEditing && quest) {
      // Check if quest is in-progress - gold rewards cannot be changed
      if (quest.status === 'in-progress' && goldBudget !== (quest.gold_reward || 0) ? Math.ceil((quest.gold_reward || 0) / 0.95) : 0) {
        validationErrors.goldBudget = 'Cannot modify gold reward for a quest that is already in progress. Participants have already committed based on the current reward amount.'
      } else {
        const oldGoldReward = quest.gold_reward || 0
        const oldBudget = oldGoldReward > 0 ? Math.ceil(oldGoldReward / 0.95) : 0
        const additionalGoldNeeded = Math.max(0, goldBudget - oldBudget)
        
        if (additionalGoldNeeded > userGoldBalance) {
          validationErrors.goldBudget = `You need ${additionalGoldNeeded} additional gold to increase the quest reward, but you only have ${userGoldBalance} gold available.`
        } else if (goldBudget < 0) {
          validationErrors.goldBudget = 'Budget cannot be negative'
        } else if (goldBudget > 999) {
          validationErrors.goldBudget = 'Budget cannot exceed 999 gold'
        }
      }
    } else {
      // For new quest creation, validate against total budget
      if (goldBudget > userGoldBalance) {
        validationErrors.goldBudget = `Total budget (${goldBudget} gold) exceeds your available balance of ${userGoldBalance} gold.`
      } else if (goldBudget < 0) {
        validationErrors.goldBudget = 'Budget cannot be negative'
      } else if (goldBudget > 999) {
        validationErrors.goldBudget = 'Budget cannot exceed 999 gold'
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsLoading(false)
      
      // Scroll to the first error field in order of importance
      const fieldPriority = ['title', 'description', 'category', 'due_date', 'goldReward']
      const firstErrorField = fieldPriority.find(field => validationErrors[field])
      
      if (firstErrorField) {
        // Use setTimeout to ensure the error state is updated before scrolling
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField)
          if (errorElement) {
            errorElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
            errorElement.focus()
          }
        }, 100)
      }
      
      return
    }

    try {
      let result: Quest

      if (isEditing && quest) {
        // Update existing quest
        const oldGoldReward = quest.gold_reward || 0
        const oldBudget = oldGoldReward > 0 ? Math.ceil(oldGoldReward / 0.95) : 0 // Reverse calculate old budget
        const newBudget = goldBudget
        const additionalGoldNeeded = Math.max(0, newBudget - oldBudget) // Only positive difference matters
        
        console.log('🔄 Quest Edit Gold Calculation:', {
          oldGoldReward,
          oldBudget,
          newBudget,
          newGoldReward: questReward,
          additionalGoldNeeded,
          userBalance: userGoldBalance
        })
        
        // Validate that user has enough balance for any additional gold needed
        if (additionalGoldNeeded > 0 && additionalGoldNeeded > userGoldBalance) {
          throw new Error(`You need ${additionalGoldNeeded} additional gold to increase the quest reward, but you only have ${userGoldBalance} gold available.`)
        }
        
        const updateData: UpdateQuestData = { 
          ...formData,
          gold_reward: questReward // Enable gold reward
        }
        console.log('🔄 Updating quest with data:', updateData)
        result = await QuestAPI.updateQuest(quest.slug, updateData)
      } else {
        // Create new quest
        const createData: CreateQuestData = {
          ...formData,
          gold_budget: goldBudget, // Send the full budget (reward + commission) to backend
          gold_reward: questReward // Still send reward for backend reference if needed
        }
        
        // Double-check gold validation before API call
        const totalGoldNeeded = goldBudget
        
        if (goldBudget > 0 && totalGoldNeeded > userGoldBalance) {
          const maxAffordableBudget = calculateMaxAffordableBudget(userGoldBalance);
          throw new Error(`Insufficient gold balance. You need ${totalGoldNeeded} gold but only have ${userGoldBalance} gold. Maximum affordable budget: ${maxAffordableBudget} gold.`);
        }
        
        console.log('✨ Creating quest with data:', createData)
        console.log('💰 Gold details:', {
          budget: goldBudget,
          reward: questReward,
          commission: commission,
          userBalance: userGoldBalance,
          remainingAfter: userGoldBalance - goldBudget,
          formattedReward: typeof questReward
        })
        
        // Send both gold_budget and gold_reward if backend supports it
        result = await QuestAPI.createQuest(createData)
      }
      
      console.log('✅ Quest operation successful:', result)

      // Update the user's gold balance after a successful quest creation
      try {
        // Update the balance timestamp to trigger a refresh
        setBalanceLastUpdated(Date.now())
        
        // Note: The balance will be refreshed by the useEffect above
        // No need for optimistic updates that can cause stale data
        console.log('✅ Quest created successfully, balance will be refreshed automatically')
        console.log('💰 Gold reserved for quest:', questReward)
        console.log('💰 Commission paid:', commission)
      } catch (error) {
        console.error('Failed to trigger balance refresh:', error)
      }

      // Reset form data after successful creation
      if (!isEditing) {
        setFormData({
          title: "",
          description: "",
          category: 0, // Reset to 0 so user must select a category
          difficulty: "initiate",
          due_date: "",
          requirements: "",
          resources: "",
        })
        setGoldBudget(0)
        setPostAs('individual')
        setErrors({})
      }

      onSuccess(result)
      onClose()
    } catch (error) {
      console.error('Failed to save quest:', error)
      
      if (error instanceof Error) {
        // Check for specific gold balance error first
        if (error.message.includes('Gold Balance Error:')) {
          setErrors({ goldReward: error.message.replace('Gold Balance Error: ', '') })
          setIsLoading(false)
          return
        }
        
        // Check for insufficient balance error from frontend validation
        if (error.message.includes('Insufficient gold balance')) {
          setErrors({ goldReward: error.message })
          setIsLoading(false)
          return
        }
        
        // Try to extract API validation errors
        const errorMessage = error.message
        
        try {
          // Look for JSON error details in the error message
          const match = errorMessage.match(/Failed to (create|update) quest: (.+)/)
          if (match) {
            const errorDetail = match[2]
            try {
              const parsedError = JSON.parse(errorDetail)
              
              // Handle specific field errors more effectively
              const formattedErrors: {[key: string]: string} = {}
              
              // Process each field in the error response
              for (const [field, errorMessages] of Object.entries(parsedError)) {
                if (field === 'status_code') continue; // Skip status code field
                
                if (Array.isArray(errorMessages)) {
                  formattedErrors[field] = errorMessages.join(', ')
                } else if (typeof errorMessages === 'string') {
                  formattedErrors[field] = errorMessages as string
                } else {
                  formattedErrors[field] = JSON.stringify(errorMessages)
                }
                
                // For gold_reward errors, map to the frontend field name
                if (field === 'gold_reward') {
                  formattedErrors['goldReward'] = formattedErrors[field]
                }
              }
              
              setErrors(formattedErrors)
              
              // Scroll to the first error
              const fieldPriority = ['title', 'description', 'category', 'due_date', 'goldReward']
              const firstErrorField = fieldPriority.find(field => formattedErrors[field])
              
              if (firstErrorField) {
                setTimeout(() => {
                  const errorElement = document.getElementById(firstErrorField)
                  if (errorElement) {
                    errorElement.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    })
                    errorElement.focus()
                  }
                }, 100)
              }
            } catch {
              // If not JSON, treat as general error
              setErrors({ general: errorDetail })
            }
          } else {
            setErrors({ general: errorMessage })
          }
        } catch {
          setErrors({ general: 'An unexpected error occurred. Please try again.' })
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newValue = name === 'category' 
      ? parseInt(value) 
      : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Clear existing error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Real-time validation for specific fields
    const newErrors: Record<string, string> = {}
    
    if (name === 'category' && newValue === 0) {
      // Don't show error immediately for category - let user select
    } else if (name === 'category' && newValue !== 0) {
      // Check if category exists
      const categoryExists = categories.find(cat => cat.id === newValue)
      if (!categoryExists && categories.length > 0) {
        newErrors.category = 'Selected category is no longer available'
      }
    }
    
    if (name === 'due_date' && value) {
      const selectedDate = new Date(value)
      const today = new Date()
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      if (isNaN(selectedDate.getTime())) {
        newErrors.due_date = 'Please enter a valid date'
      } else if (selectedDate < todayDateOnly) {
        newErrors.due_date = 'Deadline cannot be in the past'
      } else {
        const oneYearFromNow = new Date()
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
        if (selectedDate > oneYearFromNow) {
          newErrors.due_date = 'Deadline cannot be more than 1 year from now'
        }
      }
    }
    
    // Update errors if any real-time validation failed
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }))
    }
  }

  // Fantasy tier XP mapping
  const getXPReward = (difficulty: string) => {
    switch (difficulty) {
      case 'initiate': return 25
      case 'adventurer': return 50
      case 'champion': return 100
      case 'mythic': return 200
      default: return 25
    }
  }

  // Gold budget range mapping by difficulty
  const getGoldBudgetRangeForDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case 'initiate': return { min: 100, max: 199 }
      case 'adventurer': return { min: 200, max: 299 }
      case 'champion': return { min: 300, max: 399 }
      case 'mythic': return { min: 400, max: 499 }
      default: return { min: 100, max: 199 }
    }
  }

  // Function to calculate refund amount (no commission refund)
  const calculateRefundAmount = (quest: Quest): number => {
    // Only refund the gold_reward (not commission_fee)
    return quest.gold_reward || 0;
  };

  if (!isOpen) return null

  // Lock gold budget if quest is not a draft (i.e., if it's open, in-progress, or completed)
  const isGoldBudgetLocked = isEditing && quest && ["open", "in-progress", "in_progress", "completed"].includes(quest.status)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Gradient Header */}
        <div className="p-6 rounded-t-xl" style={{background: 'linear-gradient(to right, #8C74AC, #D1B58E)'}}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isEditing ? 'Edit Quest' : 'Post a New Quest'}
              </h2>
              <p className="text-white/90 mt-1">
                Share your quest with the tavern community
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-amber-50">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="flex items-center text-sm font-semibold text-amber-800 mb-2">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">📝</span>
                </div>
                QUEST TITLE
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                placeholder="Enter a compelling title for your quest"
                required
              />
              {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="flex items-center text-sm font-semibold text-amber-800 mb-2">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">👥</span>
                </div>
                QUEST DESCRIPTION
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none"
                placeholder="Describe your quest in detail. What needs to be done? What are the requirements?"
                required
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {errors.description && <span className="text-sm text-red-600">{errors.description}</span>}
                </div>
                <span className="text-xs text-gray-500">
                  {formData.description.length}/2000 characters
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="flex items-center text-sm font-semibold text-amber-800 mb-2">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">📁</span>
                </div>
                CATEGORY *
                {categories.length === 0 && (
                  <span className="ml-2 text-xs text-amber-600">(Loading...)</span>
                )}
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={categories.length === 0}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 ${
                  categories.length === 0 
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                    : 'bg-white border-amber-300'
                } ${
                  errors.category ? 'border-red-500' : ''
                }`}
                required
              >
                <option value="0">
                  {categories.length === 0 ? 'Loading categories...' : 'Select Category'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <div className="mt-2 flex items-center">
                  <span className="text-red-500 text-sm mr-1">⚠️</span>
                  <p className="text-sm text-red-600">{errors.category}</p>
                </div>
              )}
              {categories.length === 0 && !errors.category && (
                <div className="mt-2 flex items-center">
                  <span className="text-amber-500 text-sm mr-1">ℹ️</span>
                  <p className="text-sm text-amber-600">
                    Categories are being loaded. Please wait a moment.
                  </p>
                </div>
              )}
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-2">
                DIFFICULTY LEVEL
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={['initiate', 'adventurer', 'champion', 'mythic'].indexOf(formData.difficulty)}
                  onChange={(e) => {
                    const difficultyMap: DifficultyTier[] = ['initiate', 'adventurer', 'champion', 'mythic']
                    const newDifficulty = difficultyMap[parseInt(e.target.value)]
                    setFormData(prev => ({ ...prev, difficulty: newDifficulty }))
                    setGoldBudget(getGoldBudgetRangeForDifficulty(newDifficulty).min)
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: 'linear-gradient(to right, #22c55e, #3b82f6, #fbbf24, #a21caf)',
                  }}
                />
                <div className={`text-white px-4 py-3 rounded-lg ${
                  formData.difficulty === 'initiate' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  formData.difficulty === 'adventurer' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                  formData.difficulty === 'champion' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase">
                      {formData.difficulty === 'initiate' && 'Initiate'}
                      {formData.difficulty === 'adventurer' && 'Adventurer'}
                      {formData.difficulty === 'champion' && 'Champion'}
                      {formData.difficulty === 'mythic' && 'Mythic'}
                    </span>
                    <span className="font-bold">
                      {getXPReward(formData.difficulty)} XP
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mt-1">
                    {formData.difficulty === 'initiate' && 'Perfect for beginners'}
                    {formData.difficulty === 'adventurer' && 'A true adventure'}
                    {formData.difficulty === 'champion' && 'Expert level required'}
                    {formData.difficulty === 'mythic' && 'Legendary challenge for the bravest!'}

                    {' '}Reward
                  </p>
                </div>
              </div>
            </div>

            {/* Deadline and Gold Reward */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="due_date" className="flex items-center text-sm font-semibold text-amber-800 mb-2">
                  <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">⏰</span>
                  </div>
                  DEADLINE *
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]} // Max 1 year
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 ${
                    errors.due_date ? 'border-red-500' : 'border-amber-300'
                  }`}
                  placeholder="dd/mm/yyyy"
                  required
                />
                {errors.due_date && (
                  <div className="mt-2 flex items-center">
                    <span className="text-red-500 text-sm mr-1">⚠️</span>
                    <p className="text-sm text-red-600">{errors.due_date}</p>
                  </div>
                )}
                {!errors.due_date && (
                  <div className="mt-2 flex items-center">
                    <span className="text-amber-500 text-sm mr-1">💡</span>
                    <p className="text-sm text-amber-600">
                      Please select a deadline for your quest
                    </p>
                  </div>
                )}
              </div>

              <div className="">
                <label htmlFor="budget" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">🪙</span>
                  </div>
                  GOLD BUDGET
                  {isEditing && quest && quest.status === 'in-progress' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Locked (In Progress)
                    </span>
                  )}
                </label>
                <div className="flex flex-col">
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={goldBudget}
                    onChange={(e) => {
                      if (isGoldBudgetLocked) {
                        return;
                      }
                      let value = parseInt(e.target.value) || 0;
                      const range = getGoldBudgetRangeForDifficulty(formData.difficulty);
                      if (value < range.min) value = range.min;
                      if (value > range.max) value = range.max;
                      const maxBudget = calculateMaxBudgetForEditing();
                      if (value > maxBudget) value = maxBudget;
                      setGoldBudget(value);
                    }}
                    min={getGoldBudgetRangeForDifficulty(formData.difficulty).min}
                    max={Math.min(getGoldBudgetRangeForDifficulty(formData.difficulty).max, calculateMaxBudgetForEditing())}
                    disabled={!!isGoldBudgetLocked}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-gray-800 ${
                      isGoldBudgetLocked
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                        : 'border-amber-200 bg-white'
                    }`}
                    placeholder={`Enter gold (${getGoldBudgetRangeForDifficulty(formData.difficulty).min}-${getGoldBudgetRangeForDifficulty(formData.difficulty).max})`}
                  />
                  {/* Recommended gold budget range label */}
                  <div className="text-xs text-amber-700 mt-1">
                    Recommended for {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}: {getGoldBudgetRangeForDifficulty(formData.difficulty).min} - {getGoldBudgetRangeForDifficulty(formData.difficulty).max} gold
                  </div>
                  <div className="flex justify-between mt-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">
                        {isEditing && quest && quest.status === 'in-progress' 
                          ? 'Gold budget locked - quest is in progress'
                          : 'Total gold budget (5% commission will be deducted)'
                        }
                      </p>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-amber-600 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0 .99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"></path>
                      </svg>
                      <p className="text-xs font-medium">Available: <span className="text-amber-600 font-bold">{userGoldBalance} gold</span></p>
                    </div>
                  </div>
                  {goldBudget > 0 && (
                    <div className="mt-1 bg-amber-50 border border-amber-200 rounded p-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700">Total budget:</span>
                        <span className="font-medium text-amber-700">{goldBudget} gold</span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700">5% commission:</span>
                        <span className="font-medium text-amber-700">{commission} gold</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-amber-300 pt-1">
                        <span className="text-gray-700">Quest reward:</span>
                        <span className="font-medium text-amber-700">{questReward} gold</span>
                      </div>
                      
                      {/* Show different messages based on quest status */}
                      {isEditing && quest && quest.status === 'in-progress' ? (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="flex items-start text-xs">
                            <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-blue-700">
                              <strong>Quest is in progress:</strong> Gold reward cannot be modified as participants have already committed based on the current reward of <strong>{questReward} gold</strong>.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="flex items-start text-xs">
                            <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-700">
                              A total of <strong>{goldBudget} gold</strong> will be deducted from your balance when the quest is created. Participants will receive <strong>{questReward} gold</strong> upon completion.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {errors.goldBudget && (
                    <p className="mt-1 text-xs text-red-500">{errors.goldBudget}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Post As Section */}
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-2">
                POST AS
              </label>
              <div className="space-y-3">
                {/* Individual Option */}
                <div className="border-2 border-amber-300 rounded-lg p-4 bg-white">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="postAs"
                      value="individual"
                      checked={postAs === 'individual'}
                      onChange={(e) => setPostAs(e.target.value as 'individual' | 'guild')}
                      className="mr-3 text-amber-600"
                    />
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold">T</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Individual (TavernKeeper)</div>
                        <div className="text-sm text-gray-600">Post as yourself</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Guild Representative Option */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 opacity-50 pointer-events-none select-none">
                  <label className="flex items-center cursor-not-allowed">
                    <input
                      type="radio"
                      name="postAs"
                      value="guild"
                      checked={false}
                      onChange={() => {}} // No-op function
                      className="mr-3 opacity-50"
                      disabled
                      tabIndex={-1}
                    />
                    <div className="flex items-center opacity-75">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold">G</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Guild Representative</div>
                        <div className="text-sm text-gray-400">Post on behalf of a guild (Coming Soon)</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label htmlFor="requirements" className="block text-sm font-semibold text-amber-800 mb-2">
                Requirements (optional)
              </label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none"
                placeholder="What skills or prerequisites are needed?"
              />
              {errors.requirements && <p className="mt-2 text-sm text-red-600">{errors.requirements}</p>}
            </div>

            {/* Resources */}
            <div>
              <label htmlFor="resources" className="block text-sm font-semibold text-amber-800 mb-2">
                Resources (optional)
              </label>
              <textarea
                id="resources"
                name="resources"
                value={formData.resources}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none"
                placeholder="Links, files, or other resources that will help participants"
              />
              {errors.resources && <p className="mt-2 text-sm text-red-600">{errors.resources}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-amber-500 border border-transparent rounded-lg hover:from-purple-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Quest' : 'Post Quest')
                }
              </button>
            </div>

            {/* Quest Edit Gold Difference Indicator */}
            {isEditing && quest && (() => {
              const oldGoldReward = quest.gold_reward || 0
              const oldBudget = oldGoldReward > 0 ? Math.ceil(oldGoldReward / 0.95) : 0
              const newBudget = goldBudget
              const goldDifference = newBudget - oldBudget
              
              // Special handling for in-progress quests
              if (quest.status === 'in-progress') {
                return (
                  <div className="mt-2 border rounded p-2 bg-blue-50 border-blue-200">
                    <div className="flex items-start text-xs">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-blue-700">
                        <strong>Gold Reward Locked:</strong> This quest is currently in progress. The gold reward is locked at <strong>{oldGoldReward} gold</strong> to ensure fairness for all participants who have already committed to this quest.
                      </span>
                    </div>
                  </div>
                )
              }
              
              if (goldDifference !== 0) {
                return (
                  <div className={`mt-2 border rounded p-2 ${
                    goldDifference > 0 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start text-xs">
                      <svg className={`w-4 h-4 mt-0.5 mr-1 flex-shrink-0 ${
                        goldDifference > 0 ? 'text-orange-500' : 'text-green-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={goldDifference > 0 ? 'text-orange-700' : 'text-green-700'}>
                        <strong>Quest Edit:</strong> {goldDifference > 0 ? 'Increasing' : 'Decreasing'} gold reward from <strong>{oldGoldReward} gold</strong> to <strong>{questReward} gold</strong>.
                        {goldDifference > 0 && (
                          <> An additional <strong>{goldDifference} gold</strong> will be deducted from your balance.</>
                        )}
                        {goldDifference < 0 && (
                          <> <strong>{Math.abs(goldDifference)} gold</strong> will be refunded to your balance.</>
                        )}
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </form>
        </div>
      </div>
    </div>
  )
}

export default QuestForm
