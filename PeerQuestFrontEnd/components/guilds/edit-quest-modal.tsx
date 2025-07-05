"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Calendar, DollarSign, Star, FileText, Tag, Clock } from "lucide-react"
import type { Quest } from "@/lib/types"

interface EditQuestModalProps {
  isOpen: boolean
  onClose: () => void
  quest: Quest | null
  onSave: (updatedQuest: Quest) => void
  showToast: (message: string, type?: string) => void
}

export function EditQuestModal({ isOpen, onClose, quest, onSave, showToast }: EditQuestModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "design",
    difficulty: "easy",
    reward: 0,
    xp: 0,
    deadline: "",
    requirements: [] as string[],
    newRequirement: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  const difficulties = [
    { value: "easy", label: "Easy", color: "text-green-600", bg: "bg-green-100" },
    { value: "medium", label: "Medium", color: "text-yellow-600", bg: "bg-yellow-100" },
    { value: "hard", label: "Hard", color: "text-red-600", bg: "bg-red-100" },
  ]

  const categories = [
    { value: "design", label: "🎨 Design" },
    { value: "development", label: "💻 Development" },
    { value: "writing", label: "✍️ Writing" },
    { value: "marketing", label: "📢 Marketing" },
    { value: "research", label: "🔍 Research" },
    { value: "music", label: "🎵 Music" },
    { value: "art", label: "🖼️ Art" },
  ]

  // Initialize form data when quest changes
  useEffect(() => {
    if (quest && isOpen) {
      setFormData({
        title: quest.title || "",
        description: quest.description || "",
        category: quest.category || "design",
        difficulty: quest.difficulty || "easy",
        reward: quest.reward || 0,
        xp: quest.xp || 0,
        deadline: quest.deadline ? new Date(quest.deadline).toISOString().split("T")[0] : "",
        requirements: quest.requirements || [],
        newRequirement: "",
      })
    }
  }, [quest, isOpen])

  if (!isOpen || !quest) return null

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast("Please fill in all required fields", "error")
      return
    }

    if (formData.reward < 0 || formData.xp < 0) {
      showToast("Reward and XP values must be positive", "error")
      return
    }

    if (!formData.deadline) {
      showToast("Please set a deadline for the quest", "error")
      return
    }

    const deadlineDate = new Date(formData.deadline)
    if (deadlineDate <= new Date()) {
      showToast("Deadline must be in the future", "error")
      return
    }

    setIsLoading(true)

    try {
      const updatedQuest: Quest = {
        ...quest,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        difficulty: formData.difficulty,
        reward: formData.reward,
        xp: formData.xp,
        deadline: deadlineDate,
        requirements: formData.requirements,
      }

      onSave(updatedQuest)
      showToast("Quest updated successfully!", "success")
      onClose()
    } catch (error) {
      showToast("Failed to update quest. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const addRequirement = () => {
    if (formData.newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, formData.newRequirement.trim()],
        newRequirement: "",
      })
    }
  }

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target === document.activeElement) {
      e.preventDefault()
      if (formData.newRequirement.trim()) {
        addRequirement()
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold font-serif">Edit Quest</h2>
              <p className="text-white/80 mt-1">Update your quest details and requirements</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                <FileText size={16} />
                Quest Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                placeholder="Enter a compelling quest title..."
                maxLength={100}
              />
              <div className="text-xs text-[#8B75AA] mt-1">{formData.title.length}/100 characters</div>
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                <FileText size={16} />
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all resize-none"
                placeholder="Describe your quest in detail. What needs to be done? What are the expectations?"
                maxLength={1000}
              />
              <div className="text-xs text-[#8B75AA] mt-1">{formData.description.length}/1000 characters</div>
            </div>

            {/* Category and Difficulty */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                  <Tag size={16} />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                  <Star size={16} />
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                >
                  {difficulties.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.value === "easy" ? "🟢" : diff.value === "medium" ? "🟡" : "🔴"} {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reward and XP */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                  <DollarSign size={16} />
                  Gold Reward
                </label>
                <input
                  type="number"
                  value={formData.reward}
                  onChange={(e) =>
                    setFormData({ ...formData, reward: Math.max(0, Number.parseInt(e.target.value) || 0) })
                  }
                  className="w-full px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                  min="0"
                  max="100000"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                  <Star size={16} />
                  XP Reward
                </label>
                <input
                  type="number"
                  value={formData.xp}
                  onChange={(e) => setFormData({ ...formData, xp: Math.max(0, Number.parseInt(e.target.value) || 0) })}
                  className="w-full px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                  min="0"
                  max="10000"
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                <Calendar size={16} />
                Deadline *
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#2C1A1D] mb-3">
                <Clock size={16} />
                Requirements
              </label>

              {/* Existing Requirements */}
              <div className="space-y-3 mb-4">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-[#F4F0E6] rounded-lg">
                    <span className="flex-1 text-[#2C1A1D]">{req}</span>
                    <button
                      onClick={() => removeRequirement(index)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Requirement */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.newRequirement}
                  onChange={(e) => setFormData({ ...formData, newRequirement: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a requirement..."
                  className="flex-1 px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                  maxLength={200}
                />
                <button
                  onClick={addRequirement}
                  disabled={!formData.newRequirement.trim()}
                  className="px-6 py-3 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#CDAA7D]/20 p-6 bg-[#F4F0E6]/30">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 border border-[#CDAA7D] rounded-lg text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
              className="px-6 py-3 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
