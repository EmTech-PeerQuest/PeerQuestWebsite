"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Star } from "lucide-react"
import { Quest } from "@/lib/types"
import { QuestAPI, QuestCategory, CreateQuestData, UpdateQuestData, DifficultyTier } from "@/lib/api/quests"

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
    category: 0, // Default to "Select Category"
    difficulty: "initiate" as DifficultyTier,
    due_date: "",
    requirements: "",
    resources: "",
  })
  
  const [goldReward, setGoldReward] = useState<number>(0)
  const [postAs, setPostAs] = useState<'individual' | 'guild'>('individual')
  const [categories, setCategories] = useState<QuestCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load categories when modal opens
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

  // Initialize form data when modal opens
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
        setGoldReward(quest.gold_reward || 0)
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
        setGoldReward(0)
        setPostAs('individual')
      }
      setErrors({})
    }
  }, [isOpen, isEditing, quest])

  // Remove the automatic category selection - let user choose manually

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
    if (formData.category === 0 || !formData.category) {
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
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsLoading(false)
      
      // Scroll to the first error field in order of importance
      const fieldPriority = ['title', 'description', 'category', 'due_date']
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
        const updateData: UpdateQuestData = { 
          ...formData
          // gold_reward: goldReward // Disabled for now
        }
        console.log('🔄 Updating quest with data:', updateData)
        result = await QuestAPI.updateQuest(quest.slug, updateData)
      } else {
        // Create new quest
        const createData: CreateQuestData = {
          ...formData
          // gold_reward: goldReward // Disabled for now
        }
        console.log('✨ Creating quest with data:', createData)
        result = await QuestAPI.createQuest(createData)
      }
      
      console.log('✅ Quest operation successful:', result)

      // Reset form data after successful creation
      if (!isEditing) {
        setFormData({
          title: "",
          description: "",
          category: 0, // Default to "Select Category"
          difficulty: "initiate",
          due_date: "",
          requirements: "",
          resources: "",
        })
        setGoldReward(0)
        setPostAs('individual')
        setErrors({})
      }

      onSuccess(result)
      onClose()
    } catch (error) {
      console.error('Failed to save quest:', error)
      
      if (error instanceof Error) {
        // Try to extract API validation errors
        const errorMessage = error.message
        
        try {
          // Look for JSON error details in the error message
          const match = errorMessage.match(/Failed to (create|update) quest: (.+)/)
          if (match) {
            const errorDetail = match[2]
            try {
              const parsedError = JSON.parse(errorDetail)
              setErrors(parsedError)
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

  if (!isOpen) return null

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
                    setFormData(prev => ({ ...prev, difficulty: difficultyMap[parseInt(e.target.value)] }))
                  }}
                  className="w-full h-2 bg-gradient-to-r from-green-400 via-blue-400 via-yellow-400 to-purple-500 rounded-lg appearance-none cursor-pointer slider"
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

              <div className="opacity-50 pointer-events-none select-none">
                <label htmlFor="reward" className="flex items-center text-sm font-semibold text-gray-500 mb-2">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">🪙</span>
                  </div>
                  REWARD (GOLD)
                </label>
                <input
                  type="number"
                  id="reward"
                  name="reward"
                  value={0}
                  onChange={() => {}} // No-op function
                  min="0"
                  max="999"
                  disabled
                  tabIndex={-1}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed opacity-75"
                  placeholder="Coming Soon"
                />
                <p className="mt-1 text-xs text-gray-400">Gold rewards feature coming soon</p>
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
          </form>
        </div>
      </div>
    </div>
  )
}

export default QuestForm
