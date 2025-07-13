"use client"

import type React from "react"

interface User {
  id: number
  name: string
  level: number
  experience: number
  gold: number
  completedQuests: number
  guilds: string[]
}

interface Quest {
  id: number
  title: string
  description: string
  status: string
  assignedTo: number
  xp: number
  reward: number
  createdAt: Date
  completedAt?: Date
}

interface Guild {
  name: string
  emblem: string
}

interface EnhancedProfileProps {
  user: User
  quests: Quest[]
  guilds: Guild[]
  showToast?: (message: string, type?: "success" | "error") => void
}

export const EnhancedProfile: React.FC<EnhancedProfileProps> = ({ user, quests, guilds, showToast }) => {
  const showQuestDetails = (quest: Quest) => {
    // You could implement a modal to show details here
    if (showToast) {
      showToast(`Viewing details for quest: ${quest.title}`)
    }
  }


  return (
    <div>
      {/* User Info */}
      <div className="bg-white border border-[#CDAA7D] rounded-lg overflow-hidden">
        <div className="bg-[#CDAA7D] px-4 py-3">
          <h3 className="font-bold text-[#2C1A1D]">{user.name}</h3>
        </div>
        <div className="p-4">
          <p>Level: {user.level}</p>
          <p>Experience: {user.experience}</p>
          <p>Gold: {user.gold}</p>
        </div>
      </div>

      {/* Completed Quests */}
      <div className="bg-white border border-[#CDAA7D] rounded-lg overflow-hidden mt-6">
        <div className="bg-[#CDAA7D] px-4 py-3">
          <h4 className="font-bold text-[#2C1A1D]">Completed Quests</h4>
        </div>
        <div className="p-4 space-y-3">
          {user.completedQuests > 0 ? (
            quests
              .filter((q) => q.status === "completed" && q.assignedTo === user.id)
              .slice(0, 3)
              .map((quest) => (
                <div key={quest.id} className="flex justify-between items-center border-b border-[#CDAA7D] pb-2">
                  <div>
                    <h5 className="font-medium text-[#2C1A1D]">{quest.title.toUpperCase()}</h5>
                    <div className="text-xs text-[#8B75AA]">
                      COMPLETED: {new Date(quest.completedAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#8B75AA]">{quest.xp} XP</div>
                    <div className="text-xs text-[#8B75AA] cursor-pointer" onClick={() => showQuestDetails(quest)}>
                      VIEW DETAILS
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center text-[#8B75AA] py-3">No completed quests yet</div>
          )}

        </div>
      </div>

      {/* Joined Guilds */}
      <div className="bg-white border border-[#CDAA7D] rounded-lg overflow-hidden mt-6">
        <div className="bg-[#CDAA7D] px-4 py-3">
          <h4 className="font-bold text-[#2C1A1D]">Guild Memberships</h4>
        </div>
        <div className="p-4">
          {user.guilds && user.guilds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.guilds.map((guildName, index) => {
                const guild = guilds.find((g) => g.name === guildName)
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#8B75AA] text-white px-3 py-1 rounded-full text-sm"
                  >
                    <span>{guild?.emblem || "⚔️"}</span>
                    <span>{guildName.toUpperCase()}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-[#8B75AA] py-3">No guilds joined yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
