"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import type { Guild, GuildWarning, User } from "@/lib/types"

interface GuildWarningModalProps {
  isOpen: boolean
  onClose: () => void
  guild: Guild
  currentUser: User | null
  showToast: (message: string, type?: string) => void
}

export function GuildWarningModal({
  isOpen,
  onClose,
  guild,
  currentUser,
  showToast,
}: GuildWarningModalProps) {
  const [warnings, setWarnings] = useState<GuildWarning[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('GuildWarningModal useEffect triggered', { isOpen, guild_id: guild.guild_id, currentUser });
    if (isOpen && guild.guild_id) {
      fetchWarnings()
    }
  }, [isOpen, guild.guild_id])

  const fetchWarnings = async () => {
    console.log('Fetching warnings for guild:', guild.guild_id);
    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/guilds/${guild.guild_id}/warnings/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Warning fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json()
        console.log('Warning data received:', data);
        setWarnings(data.active_warnings || [])
      } else {
        console.error('Failed to fetch warnings, status:', response.status)
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching warnings:', error)
    }
    setLoading(false)
  }

  const dismissWarning = async (warningId: number) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/guilds/${guild.guild_id}/warnings/${warningId}/dismiss/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        showToast("Warning dismissed successfully", "success")
        fetchWarnings() // Refresh warnings
      } else {
        const error = await response.json()
        showToast(error.error || "Failed to dismiss warning", "error")
      }
    } catch (error) {
      showToast("Failed to dismiss warning", "error")
    }
  }

  if (!isOpen) return null

  console.log('Rendering GuildWarningModal, warnings:', warnings);

  const activeWarnings = warnings.filter(w => w.is_active)
  const isOwner = currentUser && guild.owner && String(guild.owner.id) === String(currentUser.id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} />
            <div>
              <h2 className="text-xl font-bold">Guild Warnings</h2>
              <p className="text-red-100">
                {guild.name} has {activeWarnings.length} active warning{activeWarnings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading warnings...</div>
            </div>
          ) : activeWarnings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Warnings</h3>
              <p className="text-gray-600">Your guild is in good standing!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Warning Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">Important Notice</h3>
                    <p className="text-red-700 text-sm">
                      Your guild has received warnings from the moderation team. 
                      If you accumulate 3 warnings within 7 days, your guild will be automatically disabled.
                    </p>
                    {guild.is_disabled && (
                      <p className="text-red-800 font-semibold text-sm mt-2">
                        ⚠️ Your guild is currently DISABLED due to multiple warnings.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning List */}
              {activeWarnings.map((warning) => (
                <div key={warning.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-yellow-600" size={18} />
                      <span className="font-semibold text-yellow-800">Warning #{warning.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={14} />
                      {new Date(warning.issued_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-3">{warning.reason}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Issued by: {warning.issued_by.username}
                    </div>
                    
                    {isOwner && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to dismiss this warning? This action cannot be undone.")) {
                            dismissWarning(warning.id)
                          }
                        }}
                        className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition-colors"
                      >
                        Dismiss Warning
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Warnings automatically expire after 7 days
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
