"use client"

import { useState, useEffect } from "react"
import { X, Coins, Clock, Target, Users } from "lucide-react"
import type { User, Quest, Guild } from "@/lib/types"
import { ConfirmationModal } from '@/components/modals/confirmation-modal'

interface PostQuestModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser?: User | null
  onSubmit?: (questData: Partial<Quest>) => void
  guilds?: Guild[]
}

export function PostQuestModal({ isOpen, onClose, currentUser, onSubmit, guilds = [] }: PostQuestModalProps) {
  const [questForm, setQuestForm] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: 2,
    reward: "",
    deadline: "",
    postAs: "individual",
    selectedGuild: "",
  })

  const [showConfirmation, setShowConfirmation] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuestForm({
        title: "",
        description: "",
        category: "",
        difficulty: 2,
        reward: "",
        deadline: "",
        postAs: "individual",
        selectedGuild: "",
      })
      setShowConfirmation(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Get guilds where user has posting permissions
  // Note: Simplified guild filtering since the Guild type doesn't have detailed permission properties
  const userGuilds = guilds.filter((guild) => guild.id && guild.name)

  const handleSubmit = () => {
    if (!currentUser) {
      alert("Please log in to post quests")
      return
    }

    if (!questForm.title || !questForm.description || !questForm.category || !questForm.reward || !questForm.deadline) {
      alert("Please fill in all required fields")
      return
    }

    // Check if user has enough gold for the reward
    const rewardAmount = Number.parseInt(questForm.reward)
    if ((currentUser.gold || 0) < rewardAmount) {
      alert(
        `Insufficient gold. You need ${rewardAmount} gold to post this quest but only have ${currentUser.gold || 0} gold.`,
      )
      return
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = () => {
    const rewardAmount = Number.parseInt(questForm.reward)
    const questCost = rewardAmount

    const selectedGuild =
      questForm.postAs === "guild" && questForm.selectedGuild
        ? guilds.find((g) => g.id.toString() === questForm.selectedGuild)
        : null

    const newQuest: any = {
      title: questForm.title,
      description: questForm.description,
      category: questForm.category,
      difficulty: questForm.difficulty === 1 ? "easy" : questForm.difficulty === 2 ? "medium" : "hard",
      reward: Number.parseInt(questForm.reward),
      xp: questForm.difficulty === 1 ? 50 : questForm.difficulty === 2 ? 75 : 150,
      deadline: questForm.deadline,
      poster: selectedGuild
        ? {
            id: selectedGuild.id,
            name: selectedGuild.name,
            avatar: selectedGuild.emblem,
            isGuild: true,
          }
        : currentUser,
      isGuildQuest: questForm.postAs === "guild",
      guildId: selectedGuild?.id ? Number(selectedGuild.id) : undefined,
      questCost,
    }

    if (onSubmit) {
      onSubmit(newQuest)
    }

    // Close confirmation modal and reset form
    // Note: Form reset happens regardless of success/failure since onSubmit doesn't return a promise
    // This matches the expected behavior where the modal closes after submission attempt
    setShowConfirmation(false)
    setQuestForm({
      title: "",
      description: "",
      category: "",
      difficulty: 2,
      reward: "",
      deadline: "",
      postAs: "individual",
      selectedGuild: "",
    })
  }

  const difficultyColors = {
    1: "from-green-400 to-green-600",
    2: "from-yellow-400 to-orange-500",
    3: "from-red-400 to-red-600",
  }

  const difficultyLabels = {
    1: { name: "EASY", xp: "50 XP", desc: "Perfect for beginners" },
    2: { name: "MEDIUM", xp: "75 XP", desc: "Moderate challenge" },
    3: { name: "HARD", xp: "150 XP", desc: "Expert level required" },
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] px-8 py-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Post a New Quest</h2>
              <p className="text-white/80 mt-1">Share your quest with the tavern community</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-[#F4F0E6] transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-6">
          {/* Quest Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#2C1A1D] uppercase tracking-wide">
              <Target size={16} />
              Quest Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border-2 border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] placeholder-[#8B75AA]/60 focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
              placeholder="Enter a compelling title for your quest..."
              value={questForm.title}
              onChange={(e) => setQuestForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Quest Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#2C1A1D] uppercase tracking-wide">
              <Users size={16} />
              Quest Description
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] placeholder-[#8B75AA]/60 focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 h-32 resize-none transition-all"
              placeholder="Describe your quest in detail. What needs to be done? What are the requirements?"
              value={questForm.description}
              onChange={(e) => setQuestForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Category and Reward Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#2C1A1D] uppercase tracking-wide">Category</label>
              <select
                className="w-full px-4 py-3 border-2 border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                value={questForm.category}
                onChange={(e) => setQuestForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Select Category</option>
                <option value="design">🎨 Design</option>
                <option value="development">💻 Development</option>
                <option value="writing">✍️ Writing</option>
                <option value="music">🎵 Music</option>
                <option value="art">🖼️ Art</option>
                <option value="marketing">📢 Marketing</option>
                <option value="research">🔍 Research</option>
              </select>
            </div>

            {/* Reward */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[#2C1A1D] uppercase tracking-wide">
                <Coins size={16} />
                Reward (Gold)
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border-2 border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] placeholder-[#8B75AA]/60 focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
                placeholder="100"
                min="1"
                value={questForm.reward}
                onChange={(e) => setQuestForm((prev) => ({ ...prev, reward: e.target.value }))}
              />
            </div>
          </div>

          {/* Difficulty Slider */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-[#2C1A1D] uppercase tracking-wide">Difficulty Level</label>
            <div className="space-y-3">
              <input
                type="range"
                min="1"
                max="3"
                value={questForm.difficulty}
                onChange={(e) => setQuestForm((prev) => ({ ...prev, difficulty: Number.parseInt(e.target.value) }))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${questForm.difficulty === 1 ? "#10b981" : questForm.difficulty === 2 ? "#f59e0b" : "#ef4444"} 0%, ${questForm.difficulty === 1 ? "#059669" : questForm.difficulty === 2 ? "#d97706" : "#dc2626"} 100%)`,
                }}
              />
              <div
                className={`p-4 rounded-lg bg-gradient-to-r ${difficultyColors[questForm.difficulty as keyof typeof difficultyColors]} text-white`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg">
                      {difficultyLabels[questForm.difficulty as keyof typeof difficultyLabels].name}
                    </div>
                    <div className="text-sm opacity-90">
                      {difficultyLabels[questForm.difficulty as keyof typeof difficultyLabels].desc}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {difficultyLabels[questForm.difficulty as keyof typeof difficultyLabels].xp}
                    </div>
                    <div className="text-sm opacity-90">Reward</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#2C1A1D] uppercase tracking-wide">
              <Clock size={16} />
              Deadline
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 border-2 border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
              value={questForm.deadline}
              onChange={(e) => setQuestForm((prev) => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Post As */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#2C1A1D] uppercase tracking-wide">Post As</label>
            <div className="space-y-3">
              {/* Individual Option */}
              <label className="flex items-center gap-3 p-4 border-2 border-[#CDAA7D] rounded-lg cursor-pointer hover:bg-white/50 transition-all">
                <input
                  type="radio"
                  name="postAs"
                  value="individual"
                  checked={questForm.postAs === "individual"}
                  onChange={(e) => setQuestForm((prev) => ({ ...prev, postAs: e.target.value }))}
                  className="w-4 h-4 text-[#8B75AA]"
                />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold">
                    {currentUser?.avatar || currentUser?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="font-medium text-[#2C1A1D]">
                      Individual ({currentUser?.username || "Your Username"})
                    </div>
                    <div className="text-sm text-[#8B75AA]">Post as yourself</div>
                  </div>
                </div>
              </label>

              {/* Guild Options - Coming Soon */}
              <div className="relative">
                <label className="flex items-start gap-3 p-4 border-2 border-dashed border-[#CDAA7D] rounded-lg opacity-50 cursor-not-allowed">
                  <input
                    type="radio"
                    name="postAs"
                    value="guild"
                    disabled
                    className="w-4 h-4 text-[#8B75AA] mt-1 opacity-50 cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[#2C1A1D] mb-2 flex items-center gap-2">
                      Guild Representative
                      <span className="bg-[#8B75AA] text-white text-xs px-2 py-1 rounded-full font-bold">
                        COMING SOON
                      </span>
                    </div>
                    <div className="text-sm text-[#8B75AA] mb-3">Post on behalf of a guild (Feature in development)</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-[#CDAA7D]">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-[#CDAA7D] py-3 px-6 rounded-lg font-bold text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white py-3 px-6 rounded-lg font-bold hover:from-[#7A6699] hover:to-[#B8935A] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Post Quest
            </button>
          </div>
        </div>
        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmSubmit}
          title="Confirm Quest Posting"
          message={`Are you sure you want to post this quest? The reward amount will be deducted from your gold balance.`}
          goldAmount={Number.parseInt(questForm.reward) || 0}
          confirmText="Post Quest"
        />
      </div>
    </div>
  )
}
