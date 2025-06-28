"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Clock, Users, Star } from "lucide-react"
import { Quest } from "@/lib/types"
import { QuestAPI, QuestCategory, CreateQuestData, UpdateQuestData } from "@/lib/api/quests"

interface QuestFormProps {
  quest?: Quest | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (quest: Quest) => void
  isEditing?: boolean
}

export function QuestForm({ quest, isOpen, onClose, onSuccess, isEditing = false }: QuestFormProps) {
  const [formData, setFormData] = useState<CreateQuestData>({
    title: "",
    description: "",
    category: 1,
    difficulty: "easy" as const,
    estimated_time: 30,
    max_participants: 1,
    due_date: "",
    requirements: "",
    resources: "",
  })
  
  const [categories, setCategories] = useState<QuestCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await QuestAPI.getCategories()
        setCategories(categoriesData)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Populate form with quest data when editing
  useEffect(() => {
    if (isEditing && quest) {
      setFormData({
        title: quest.title,
        description: quest.description,
        category: quest.category.id,
        difficulty: quest.difficulty,
        estimated_time: quest.estimated_time,
        max_participants: quest.max_participants,
        due_date: quest.due_date ? quest.due_date.split('T')[0] : "",
        requirements: quest.requirements || "",
        resources: quest.resources || "",
      })
    } else {
      // Reset form for new quest
      setFormData({
        title: "",
        description: "",
        category: categories.length > 0 ? categories[0].id : 1,
        difficulty: "easy",
        estimated_time: 30,
        max_participants: 1,
        due_date: "",
        requirements: "",
        resources: "",
      })
    }
  }, [isEditing, quest, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      let result: Quest

      if (isEditing && quest) {
        // Update existing quest
        const updateData: UpdateQuestData = { ...formData }
        result = await QuestAPI.updateQuest(quest.slug, updateData)
      } else {
        // Create new quest
        result = await QuestAPI.createQuest(formData)
      }

      onSuccess(result)
      onClose()
    } catch (error) {
      console.error('Failed to save quest:', error)
      
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message.replace('Failed to create quest: ', '').replace('Failed to update quest: ', ''))
          setErrors(errorData)
        } catch {
          setErrors({ general: error.message })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'category' || name === 'estimated_time' || name === 'max_participants' 
        ? parseInt(value) 
        : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const getXPReward = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 50
      case 'medium': return 75
      case 'hard': return 150
      default: return 50
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Quest' : 'Create New Quest'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Quest Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quest title"
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what needs to be done..."
                required
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Row 1: Category and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="easy">Easy (50 XP)</option>
                  <option value="medium">Medium (75 XP)</option>
                  <option value="hard">Hard (150 XP)</option>
                </select>
                {errors.difficulty && <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>}
              </div>
            </div>

            {/* Row 2: Time and Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimated_time" className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Estimated Time (minutes) *
                </label>
                <input
                  type="number"
                  id="estimated_time"
                  name="estimated_time"
                  value={formData.estimated_time}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {errors.estimated_time && <p className="mt-1 text-sm text-red-600">{errors.estimated_time}</p>}
              </div>

              <div>
                <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Max Participants *
                </label>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {errors.max_participants && <p className="mt-1 text-sm text-red-600">{errors.max_participants}</p>}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date (optional)
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>}
            </div>

            {/* Requirements */}
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                Requirements (optional)
              </label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What skills or prerequisites are needed?"
              />
              {errors.requirements && <p className="mt-1 text-sm text-red-600">{errors.requirements}</p>}
            </div>

            {/* Resources */}
            <div>
              <label htmlFor="resources" className="block text-sm font-medium text-gray-700 mb-2">
                Resources (optional)
              </label>
              <textarea
                id="resources"
                name="resources"
                value={formData.resources}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Links, files, or other resources that will help participants"
              />
              {errors.resources && <p className="mt-1 text-sm text-red-600">{errors.resources}</p>}
            </div>

            {/* Reward Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Reward: {getXPReward(formData.difficulty)} XP
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                XP is automatically assigned based on difficulty level
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Quest' : 'Create Quest')
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
