"use client"

import { useState, useEffect, useCallback } from "react"
import { Send } from "lucide-react"
import type { Guild, User } from "@/lib/types"

interface GuildPayoutsProps {
  guild: Guild
  currentUser: User | null
  showToast: (message: string, type?: string) => void
}

export function GuildPayouts({ guild, currentUser, showToast }: GuildPayoutsProps) {
  // Dynamic state
  const [payoutAmount, setPayoutAmount] = useState("")
  const [selectedMember, setSelectedMember] = useState("")
  const [members, setMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Dynamic API base URL (env or runtime)
  useEffect(() => {
    let base = ""
    if (typeof window !== "undefined") {
      base = (window as any).API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ""
    } else {
      base = process.env.NEXT_PUBLIC_API_BASE_URL || ""
    }
    setApiBaseUrl(base || "http://localhost:8000/api")
  }, [])

  // Dynamic, robust member loading
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    setError("")
    try {
      const url = `${apiBaseUrl}/guilds/${guild.guild_id}/members/`
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`Failed to load members: ${res.status}`)
      const data = await res.json()
      // Accept both array and paginated
      const memberList = Array.isArray(data) ? data : data.results || []
      setMembers(memberList.map((m: any) => m.user || m))
    } catch (err: any) {
      setError("Failed to load members")
      showToast("Failed to load members", "error")
    } finally {
      setLoadingMembers(false)
    }
  }, [apiBaseUrl, guild.guild_id, showToast])

  useEffect(() => {
    if (guild.guild_id) fetchMembers()
  }, [guild.guild_id, fetchMembers])

  // Dynamic payout data (could be extended for splits)
  const payoutData = [{ name: guild.name, percentage: 100, amount: guild.funds || 0, color: "#8B75AA" }]

  // Dynamic payout handler
  const handleSendPayout = async () => {
    if (!payoutAmount || !selectedMember) {
      showToast("Please enter amount and select a member", "error")
      return
    }
    const amount = Number.parseInt(payoutAmount)
    if (amount > (guild.funds || 0)) {
      showToast("Insufficient guild funds", "error")
      return
    }
    try {
      // Example: POST to dynamic API endpoint
      const url = `${apiBaseUrl}/guilds/${guild.guild_id}/payouts/`
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const res = await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount,
          recipient: selectedMember,
        })
      })
      if (!res.ok) throw new Error(`Failed to send payout: ${res.status}`)
      showToast(`Payout of ${amount} gold sent to ${selectedMember}`, "success")
      setPayoutAmount("")
      setSelectedMember("")
    } catch (err: any) {
      setError("Failed to send payout")
      showToast("Failed to send payout", "error")
    }
  }
  return (
    <div className="bg-[#2C1A1D] text-[#F4F0E6] rounded-lg p-6">
      <h3 className="text-xl font-bold mb-6">Payouts</h3>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guild Funds */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Guild Funds</h4>
          <p className="text-sm text-gray-400 mb-2">Gold in your guild's account</p>
          <div className="text-3xl font-bold text-[#CDAA7D] mb-6">
            {guild.funds || 0} <span className="text-lg font-normal">Gold</span>
          </div>
          <div className="flex gap-2 mb-6">
            <button className="px-4 py-2 bg-[#8B75AA] text-white rounded font-medium">Guild</button>
            <button className="px-4 py-2 bg-[#3D2A2F] text-gray-400 rounded font-medium">Experiences</button>
          </div>
          <div>
            <h5 className="font-medium mb-3">Splits</h5>
            <div className="space-y-2">
              {payoutData.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-[#3D2A2F] rounded">
                  <div className="w-8 h-8 bg-[#8B75AA] rounded flex items-center justify-center text-white text-sm">
                    {guild.emblem}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.percentage}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.amount} Gold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Send Payout */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Send a One-Time Payout</h4>
          <p className="text-sm text-gray-400 mb-4">Give Gold to your collaborators</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount (Gold)</label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-[#3D2A2F] border border-[#CDAA7D] rounded px-3 py-2 text-[#F4F0E6] placeholder-gray-400 focus:outline-none focus:border-[#8B75AA]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Member</label>
              {loadingMembers ? (
                <div className="text-gray-400 text-sm">Loading members...</div>
              ) : (
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full bg-[#3D2A2F] border border-[#CDAA7D] rounded px-3 py-2 text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA]"
                >
                  <option value="">Choose a member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.display_name || m.username || m.id}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={handleSendPayout}
              disabled={!payoutAmount || !selectedMember}
              className={`w-full py-2 px-4 rounded font-medium flex items-center justify-center gap-2 ${
                payoutAmount && selectedMember
                  ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                  : "bg-[#4A3540] text-gray-500 cursor-not-allowed"
              } transition-colors`}
            >
              <Send size={16} />
              Send Gold
            </button>
          </div>
          {/* Pie Chart Visualization */}
          <div className="mt-8">
            <div className="relative w-48 h-48 mx-auto">
              <div className="w-full h-full rounded-full border-8 border-[#8B75AA] flex items-center justify-center bg-[#3D2A2F]">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total Splits</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm font-medium">{guild.name}</p>
              <p className="text-xs text-gray-400">100%</p>
            </div>
          </div>
        </div>
      </div>
  )
    </div>
  )
}
