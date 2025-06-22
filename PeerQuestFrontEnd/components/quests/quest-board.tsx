"use client"

import { useState } from "react"
import { Search, Star, DollarSign, User, Clock } from "lucide-react"
import type { Quest } from "@/lib/types"
import { formatTimeRemaining } from "@/lib/utils"

interface QuestBoardProps {
  quests: Quest[]
  currentUser: any
  openQuestDetails: (quest: Quest) => void
  openPostQuestModal: () => void
  openApplications: (quest: Quest) => void
  openEditQuestModal?: (quest: Quest) => void
}

export function QuestBoard({
  quests,
  currentUser,
  openQuestDetails,
  openPostQuestModal,
  openApplications,
  openEditQuestModal,
}: QuestBoardProps) {
  const [questFilters, setQuestFilters] = useState({
    search: "",
    category: "ALL CATEGORIES",
    difficulty: "ALL DIFFICULTIES",
    status: "ALL STATUSES",
  })

  const filteredQuests = quests.filter((quest) => {
    const matchesSearch =
      quest.title.toLowerCase().includes(questFilters.search.toLowerCase()) ||
      quest.description.toLowerCase().includes(questFilters.search.toLowerCase())
    const matchesCategory =
      questFilters.category === "ALL CATEGORIES" || quest.category.toUpperCase() === questFilters.category
    const matchesDifficulty =
      questFilters.difficulty === "ALL DIFFICULTIES" || quest.difficulty.toUpperCase() === questFilters.difficulty
    const matchesStatus = questFilters.status === "ALL STATUSES" || quest.status.toUpperCase() === questFilters.status

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-emerald-500 text-white"
      case "medium":
        return "bg-amber-500 text-white"
      case "hard":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "design":
        return "🎨"
      case "development":
        return "💻"
      case "writing":
        return "✍️"
      case "music":
        return "🎵"
      case "art":
        return "🖼️"
      case "marketing":
        return "📢"
      case "research":
        return "🔍"
      default:
        return "💼"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <section className="bg-[#F4F0E6] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C1A1D] font-serif">Quest Board</h2>
            <p className="text-[#8B75AA] mt-2">Discover opportunities to showcase your skills and collaborate</p>
          </div>
          {currentUser && (
            <button
              onClick={openPostQuestModal}
              className="bg-[#8B75AA] text-white px-6 py-3 rounded-lg hover:bg-[#7A6699] transition-colors font-medium shadow-md"
            >
              Post a Quest
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-[#CDAA7D]/20 p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search quests by title or description..."
              className="w-full px-4 py-3 pl-12 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
              value={questFilters.search}
              onChange={(e) => setQuestFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#CDAA7D]" />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              className="px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
              value={questFilters.category}
              onChange={(e) => setQuestFilters((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option>ALL CATEGORIES</option>
              <option>DESIGN</option>
              <option>DEVELOPMENT</option>
              <option>WRITING</option>
              <option>MUSIC</option>
              <option>ART</option>
              <option>MARKETING</option>
              <option>RESEARCH</option>
            </select>

            <select
              className="px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
              value={questFilters.difficulty}
              onChange={(e) => setQuestFilters((prev) => ({ ...prev, difficulty: e.target.value }))}
            >
              <option>ALL DIFFICULTIES</option>
              <option>EASY</option>
              <option>MEDIUM</option>
              <option>HARD</option>
            </select>

            <select
              className="px-4 py-3 border border-[#CDAA7D]/30 rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] focus:ring-2 focus:ring-[#8B75AA]/20 transition-all"
              value={questFilters.status}
              onChange={(e) => setQuestFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option>ALL STATUSES</option>
              <option>OPEN</option>
              <option>IN-PROGRESS</option>
              <option>COMPLETED</option>
            </select>
          </div>
        </div>

        {/* Quest Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
          {filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#CDAA7D]/20 hover:border-[#8B75AA]/40 group"
            >
              {/* Quest Header */}
              <div className="bg-gradient-to-br from-[#CDAA7D] to-[#B8956D] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white text-lg leading-tight flex-1 mr-3 font-serif group-hover:text-[#F4F0E6] transition-colors">
                      {quest.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getDifficultyColor(quest.difficulty)}`}
                    >
                      {quest.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(quest.category)}</span>
                      <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
                        {quest.category}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(quest.status)}`}
                    >
                      {quest.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quest Content */}
              <div className="p-6">
                {/* Description */}
                <p className="text-[#2C1A1D] text-sm leading-relaxed mb-6 line-clamp-3 min-h-[4.5rem]">
                  {quest.description}
                </p>

                {/* Rewards Section */}
                <div className="bg-gradient-to-r from-[#F4F0E6] to-[#F8F4EA] rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#CDAA7D] rounded-full flex items-center justify-center">
                        <DollarSign size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-[#2C1A1D] text-lg">{quest.reward}</div>
                        <div className="text-[#8B75AA] text-xs uppercase tracking-wide">Gold</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#8B75AA] rounded-full flex items-center justify-center">
                        <Star size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-[#8B75AA] text-lg">{quest.xp}</div>
                        <div className="text-[#8B75AA] text-xs uppercase tracking-wide">XP</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="space-y-3 mb-6">
                  {/* Deadline */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-[#8B75AA]/10 rounded-full flex items-center justify-center">
                      <Clock size={14} className="text-[#8B75AA]" />
                    </div>
                    <div>
                      <span className="text-[#2C1A1D] font-medium">Deadline: </span>
                      <span className="text-[#8B75AA] font-semibold">{formatTimeRemaining(quest.deadline)}</span>
                    </div>
                  </div>

                  {/* Quest Poster */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {quest.poster.avatar}
                    </div>
                    <div>
                      <span className="text-[#2C1A1D] font-medium">Posted by </span>
                      <span className="text-[#8B75AA] font-semibold">{quest.poster.name}</span>
                    </div>
                  </div>

                  {/* Applications Count */}
                  {quest.applicants && quest.applicants.length > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-[#CDAA7D]/10 rounded-full flex items-center justify-center">
                        <User size={14} className="text-[#CDAA7D]" />
                      </div>
                      <div>
                        <span className="text-[#2C1A1D] font-medium">
                          {quest.applicants.length} {quest.applicants.length === 1 ? "Application" : "Applications"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quest Footer */}
              <div className="border-t border-[#CDAA7D]/20 p-6 bg-gradient-to-r from-[#F4F0E6]/50 to-white/50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => openQuestDetails(quest)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-[#CDAA7D] rounded-lg hover:bg-[#CDAA7D] hover:text-white transition-all duration-200 text-[#2C1A1D] font-medium group"
                  >
                    <span className="group-hover:scale-110 transition-transform">👁️</span>
                    View Details
                  </button>

                  {currentUser && quest.poster.id === currentUser.id ? (
                    <div className="flex gap-2">
                      {quest.status === "open" && (
                        <button
                          onClick={() => openApplications(quest)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-all duration-200 font-medium shadow-md group"
                        >
                          <span className="group-hover:scale-110 transition-transform">📋</span>
                          <span className="hidden sm:inline">Apps</span>
                        </button>
                      )}
                      {openEditQuestModal && (
                        <button
                          onClick={() => openEditQuestModal(quest)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#CDAA7D] text-white rounded-lg hover:bg-[#B8956D] transition-all duration-200 font-medium shadow-md group"
                        >
                          <span className="group-hover:scale-110 transition-transform">✏️</span>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredQuests.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#CDAA7D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-[#CDAA7D]" />
            </div>
            <h3 className="text-xl font-bold text-[#2C1A1D] mb-2">No quests found</h3>
            <p className="text-[#8B75AA] mb-6">Try adjusting your search criteria or filters</p>
            {currentUser && (
              <button
                onClick={openPostQuestModal}
                className="bg-[#8B75AA] text-white px-6 py-3 rounded-lg hover:bg-[#7A6699] transition-colors font-medium"
              >
                Post the First Quest
              </button>
            )}
          </div>
        )}

        {/* Features Section */}
        <section className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C1A1D] font-serif mb-4">Why Join Our Tavern?</h2>
            <p className="text-[#8B75AA] text-lg max-w-2xl mx-auto">
              PeerQuest Tavern offers unique features to enhance your collaborative journey and showcase your skills.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔧",
                title: "Skill Showcase",
                description:
                  "Display your talents through completed quests and build a portfolio that showcases your abilities to potential collaborators.",
              },
              {
                icon: "👥",
                title: "Guild System",
                description:
                  "Join specialized guilds to connect with like-minded individuals, share resources, and collaborate on larger projects.",
              },
              {
                icon: "🏆",
                title: "Reputation System",
                description:
                  "Earn badges and increase your reputation by successfully completing quests and receiving positive feedback from other adventurers.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-[#CDAA7D]/20 rounded-xl p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#CDAA7D] to-[#B8956D] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#2C1A1D]">{feature.title}</h3>
                <p className="text-[#8B75AA] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
