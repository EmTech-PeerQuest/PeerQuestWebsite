"use client"

import { useState } from "react"
import { Search, Filter, Calendar, User, Settings, DollarSign, Users, Shield } from "lucide-react"
import type { Guild, User as UserType } from "@/lib/types"

interface GuildAuditLogProps {
  guild: Guild
  currentUser: UserType | null
}

interface AuditLogEntry {
  id: number
  date: Date
  event: string
  description: string
  changedBy: {
    username: string
    avatar: string
  }
  category: "role" | "member" | "funds" | "settings" | "general"
}

export function GuildAuditLog({ guild, currentUser }: GuildAuditLogProps) {
  const [dateRange, setDateRange] = useState("all")
  const [filterBy, setFilterBy] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Mock audit log data
  const auditEntries: AuditLogEntry[] = [
    {
      id: 1,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      event: "Role Created",
      description: "New Role 'Quest Leader' was created",
      changedBy: { username: currentUser?.username || "Admin", avatar: currentUser?.avatar || "A" },
      category: "role",
    },
    {
      id: 2,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      event: "Member Added",
      description: "QuestMaster was added to the guild",
      changedBy: { username: currentUser?.username || "Admin", avatar: currentUser?.avatar || "A" },
      category: "member",
    },
    {
      id: 3,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      event: "Funds Distributed",
      description: "500 gold distributed to guild members",
      changedBy: { username: currentUser?.username || "Admin", avatar: currentUser?.avatar || "A" },
      category: "funds",
    },
    {
      id: 4,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      event: "Guild Settings Updated",
      description: "Guild description was modified",
      changedBy: { username: currentUser?.username || "Admin", avatar: currentUser?.avatar || "A" },
      category: "settings",
    },
    {
      id: 5,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      event: "Member Role Changed",
      description: "MysticBrewer's role changed from Member to Admin",
      changedBy: { username: currentUser?.username || "Admin", avatar: currentUser?.avatar || "A" },
      category: "role",
    },
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "role":
        return <Shield size={16} className="text-purple-400" />
      case "member":
        return <Users size={16} className="text-blue-400" />
      case "funds":
        return <DollarSign size={16} className="text-green-400" />
      case "settings":
        return <Settings size={16} className="text-orange-400" />
      default:
        return <User size={16} className="text-gray-400" />
    }
  }

  const filteredEntries = auditEntries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.event.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterBy === "all" || entry.category === filterBy
    
    // Date filtering logic
    let matchesDate = true
    if (dateRange !== "all") {
      const now = new Date()
      const entryDate = entry.date
      
      switch (dateRange) {
        case "today":
          matchesDate = entryDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = entryDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = entryDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesFilter && matchesDate
  })

  return (
    <div className="bg-[#2C1A1D] text-[#F4F0E6] rounded-lg p-6">
      <h3 className="text-xl font-bold mb-6">Guild Activity History</h3>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Filter by date range"
            className="bg-[#3D2A2F] border border-[#CDAA7D] rounded px-3 py-2 text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            aria-label="Filter by event type"
            className="bg-[#3D2A2F] border border-[#CDAA7D] rounded px-3 py-2 text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA]"
          >
            <option value="all">All Events</option>
            <option value="role">Role Changes</option>
            <option value="member">Member Changes</option>
            <option value="funds">Fund Activities</option>
            <option value="settings">Settings</option>
          </select>
        </div>

        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#3D2A2F] border border-[#CDAA7D] rounded px-3 py-2 pl-10 text-[#F4F0E6] placeholder-gray-400 focus:outline-none focus:border-[#8B75AA]"
            />
          </div>
        </div>
      </div>

      {/* Activity Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA]"></div>
          <span className="ml-2 text-gray-400">Loading activity...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3D2A2F]">
                <th className="text-left py-3 px-4 font-medium text-gray-300">Event</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Changed By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-[#3D2A2F]/50 hover:bg-[#3D2A2F]/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">{getCategoryIcon(entry.category)}</div>
                      <div>
                        <p className="font-medium text-[#F4F0E6]">{entry.event}</p>
                        <p className="text-sm text-gray-400">{entry.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#8B75AA] rounded-full flex items-center justify-center text-white text-xs">
                        {entry.changedBy.avatar?.charAt(0)?.toUpperCase() || 
                         entry.changedBy.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-[#8B75AA] text-sm">{entry.changedBy.username || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-400">
                      <p>{entry.date?.toLocaleDateString?.() || 'Invalid Date'}</p>
                      <p>{entry.date?.toLocaleTimeString?.([], { hour: "2-digit", minute: "2-digit" }) || '--:--'}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && filteredEntries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No activity found matching your criteria</p>
          {(searchQuery || filterBy !== "all" || dateRange !== "all") && (
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or search terms</p>
          )}
        </div>
      )}
    </div>
  )
}
