"use client"

import { useState } from "react"
import { X, Mail, Calendar, MapPin, Star, Trophy, Users } from "lucide-react"
import type { User, Quest, Guild } from "@/lib/types"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  quests: Quest[]
  guilds: Guild[]
  currentUser: User | null
}

export function UserProfileModal({ isOpen, onClose, user, quests, guilds, currentUser }: UserProfileModalProps) {
  if (!isOpen) return null

  // Get user's completed quests
  const userQuests = quests.filter(quest => 
    quest.poster.id === user.id || quest.status === 'completed'
  ).slice(0, 5) // Show only first 5

  // Get user's guilds
  const userGuilds = user.guilds?.slice(0, 3) || [] // Show only first 3

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#CDAA7D] p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#2C1A1D] hover:text-[#2C1A1D]/70"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#8B75AA] rounded-full flex items-center justify-center text-3xl text-white">
              {user.avatar || user.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2C1A1D]">
                {user.displayName || user.username}
              </h2>
              <p className="text-[#2C1A1D]/70">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-[#8B75AA] text-white text-sm px-3 py-1 rounded-full">
                  Level {user.level || 1}
                </span>
                <span className="bg-[#2C1A1D] text-white text-sm px-3 py-1 rounded-full">
                  {user.xp || 0} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-[#F4F0E6] rounded-lg">
              <Trophy className="w-6 h-6 mx-auto text-[#CDAA7D] mb-2" />
              <div className="font-bold text-[#2C1A1D]">{user.completedQuests || 0}</div>
              <div className="text-sm text-[#8B75AA]">Quests</div>
            </div>
            <div className="text-center p-4 bg-[#F4F0E6] rounded-lg">
              <Users className="w-6 h-6 mx-auto text-[#CDAA7D] mb-2" />
              <div className="font-bold text-[#2C1A1D]">{user.guilds?.length || 0}</div>
              <div className="text-sm text-[#8B75AA]">Guilds</div>
            </div>
            <div className="text-center p-4 bg-[#F4F0E6] rounded-lg">
              <Star className="w-6 h-6 mx-auto text-[#CDAA7D] mb-2" />
              <div className="font-bold text-[#2C1A1D]">{user.badges?.length || 0}</div>
              <div className="text-sm text-[#8B75AA]">Badges</div>
            </div>
          </div>

          {/* About */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">About</h3>
            <p className="text-[#2C1A1D]">
              {user.bio || "This adventurer hasn't shared their story yet."}
            </p>
          </div>

          {/* Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Details</h3>
            <div className="space-y-2">
              {user.birthday && (
                <div className="flex items-center gap-2 text-[#2C1A1D]">
                  <Calendar size={16} className="text-[#8B75AA]" />
                  <span>Born {new Date(user.birthday).toLocaleDateString()}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-2 text-[#2C1A1D]">
                  <MapPin size={16} className="text-[#8B75AA]" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.email && currentUser && (
                <div className="flex items-center gap-2 text-[#2C1A1D]">
                  <Mail size={16} className="text-[#8B75AA]" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#8B75AA]/10 text-[#8B75AA] rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Badges</h3>
              <div className="grid grid-cols-2 gap-3">
                {user.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#F4F0E6] rounded-lg"
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <div className="font-medium text-[#2C1A1D]">{badge.name}</div>
                      {badge.description && (
                        <div className="text-sm text-[#8B75AA]">{badge.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Quests */}
          {userQuests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Recent Quests</h3>
              <div className="space-y-2">
                {userQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="p-3 bg-[#F4F0E6] rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-[#2C1A1D]">{quest.title}</div>
                      <div className="text-sm text-[#8B75AA]">{quest.category}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      quest.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : quest.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {quest.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guilds */}
          {userGuilds.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Guilds</h3>
              <div className="space-y-2">
                {userGuilds.map((guild, index) => (
                  <div
                    key={index}
                    className="p-3 bg-[#F4F0E6] rounded-lg flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-[#8B75AA] rounded-lg flex items-center justify-center text-white">
                      {guild.emblem || guild.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-[#2C1A1D]">{guild.name}</div>
                      {guild.specialization && (
                        <div className="text-sm text-[#8B75AA]">{guild.specialization}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {user.socialLinks && Object.values(user.socialLinks).some(link => link) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2C1A1D] mb-3">Social Links</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(user.socialLinks).map(([platform, url]) => 
                  url ? (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors text-sm capitalize"
                    >
                      {platform}
                    </a>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
