"use client"

import { useState, useEffect } from "react"
import { X, ScrollText, Users, CheckCircle, XCircle, Clock, Star, CircleDollarSign, Calendar } from "lucide-react"
import type { Application, User as UserType } from "@/lib/types"
import { getDifficultyClass } from "@/lib/utils"
import { getMyApplications, getApplicationsToMyQuests, approveApplication, rejectApplication } from "@/lib/api/applications"
import { Button } from "@/components/ui/button"
import { useClickSound } from "@/hooks/use-click-sound"
import { useAudioContext } from "@/context/audio-context"

interface ApplicationsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: UserType | null
  questId?: number // Optional: if provided, only show applications for this specific quest
  onApplicationProcessed?: () => Promise<void> // Callback to refresh parent quest data
}

export function ApplicationsModal({ isOpen, onClose, currentUser, questId, onApplicationProcessed }: ApplicationsModalProps) {
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [applicationsToMyQuests, setApplicationsToMyQuests] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingApplications, setProcessingApplications] = useState<Set<number>>(new Set())
  const { soundEnabled, volume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume })

  useEffect(() => {
    if (isOpen && currentUser) {
      loadApplications()
    }
  }, [isOpen, currentUser, questId])

  const loadApplications = async () => {
    console.log('Loading applications for user:', currentUser?.username, questId ? `for quest ${questId}` : 'for all quests')
    setLoading(true)
    setError(null)
    try {
      const [myApps, appsToMyQuests] = await Promise.all([
        getMyApplications(),
        getApplicationsToMyQuests()
      ])
      console.log('Applications loaded successfully:', { 
        myApps: myApps.length, 
        appsToMyQuests: appsToMyQuests.length,
        questId: questId
      })
      
      // Filter applications if questId is provided
      const filteredMyApps = questId ? myApps.filter(app => app.quest.id === questId) : myApps
      const filteredAppsToMyQuests = questId ? appsToMyQuests.filter(app => app.quest.id === questId) : appsToMyQuests
      
      setMyApplications(filteredMyApps)
      setApplicationsToMyQuests(filteredAppsToMyQuests)
    } catch (err) {
      console.error('Failed to load applications:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load applications'
      
      // More specific error handling
      if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
        setError('Authentication failed. Please log in again.')
      } else if (errorMessage.includes('403')) {
        setError('Access denied. You don\'t have permission to view these applications.')
      } else if (errorMessage.includes('404')) {
        setError('Applications endpoint not found. Please contact support.')
      } else if (errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApproveApplicant = async (applicationId: number) => {
    setProcessingApplications(prev => new Set(prev).add(applicationId))
    setError(null) // Clear any existing errors
    try {
      console.log('🟢 Approving application:', applicationId)
      await approveApplication(applicationId)
      console.log('✅ Application approved successfully')
      // Reload applications to get updated data
      await loadApplications()
      // Refresh parent quest data if callback provided
      if (onApplicationProcessed) {
        await onApplicationProcessed()
      }
    } catch (err) {
      console.error('❌ Failed to approve application:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve application')
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  const handleRejectApplicant = async (applicationId: number) => {
    setProcessingApplications(prev => new Set(prev).add(applicationId))
    setError(null) // Clear any existing errors
    try {
      console.log('🔴 Rejecting application:', applicationId)
      await rejectApplication(applicationId)
      console.log('✅ Application rejected successfully')
      // Reload applications to get updated data
      await loadApplications()
      // Refresh parent quest data if callback provided
      if (onApplicationProcessed) {
        await onApplicationProcessed()
      }
    } catch (err) {
      console.error('❌ Failed to reject application:', err)
      setError(err instanceof Error ? err.message : 'Failed to reject application')
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "kicked":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!isOpen || !currentUser) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-2">
                {questId ? 'Quest Applications' : 'All Quest Applications'}
              </h2>
              <p className="text-white/90">
                {questId 
                  ? 'Applications for this specific quest' 
                  : 'Manage your quest applications and review incoming requests'
                }
              </p>
            </div>
            <Button 
              onClick={onClose} 
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white hover:text-white"
              soundType="modal"
            >
              <X size={24} />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B75AA] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          ) : (
            <div className={questId ? "space-y-6" : "grid lg:grid-cols-2 gap-8"}>
              {/* My Applications - only show if not viewing specific quest */}
              {!questId && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#8B75AA]/10 rounded-xl">
                      <ScrollText className="w-6 h-6 text-[#8B75AA]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#2C1A1D] font-serif">My Applications</h3>
                      <p className="text-[#8B75AA]">Quests you've applied for</p>
                    </div>
                  </div>

                  {myApplications.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <ScrollText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">No Applications Yet</h4>
                      <p className="text-gray-500">
                        You haven't applied for any quests yet. Browse the Quest Board to find opportunities!
                      </p>
                    </div>
                ) : (
                  <div className="space-y-4">
                    {myApplications.map((application) => (
                      <div
                        key={application.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                      >
                        {/* Quest Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-[#2C1A1D] mb-2 font-serif">{application.quest.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyClass(application.quest.difficulty)}`}
                              >
                                {application.quest.difficulty.charAt(0).toUpperCase() + application.quest.difficulty.slice(1)}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(application.status)}`}
                              >
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quest Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <CircleDollarSign size={18} className="text-[#CDAA7D]" />
                            <div>
                              <p className="text-xs text-gray-500">Reward</p>
                              <p className="font-bold text-[#2C1A1D]">{application.quest.gold_reward} Gold</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star size={18} className="text-[#8B75AA]" />
                            <div>
                              <p className="text-xs text-gray-500">XP</p>
                              <p className="font-bold text-[#8B75AA]">{application.quest.xp_reward} XP</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Applied</p>
                              <p className="font-medium text-gray-700">
                                {new Date(application.applied_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-red-500" />
                            <div>
                              <p className="text-xs text-gray-500">Deadline</p>
                              <p className="font-medium text-gray-700">
                                {application.quest.due_date ? new Date(application.quest.due_date).toLocaleDateString() : 'No deadline'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Quest Poster */}
                        <div className="flex items-center gap-3 p-3 bg-[#F4F0E6] rounded-xl">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold">
                            {application.quest.creator.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2C1A1D]">{application.quest.creator.username}</p>
                            <p className="text-sm text-[#8B75AA]">Quest Giver</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Applications to My Quests */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#CDAA7D]/10 rounded-xl">
                    <Users className="w-6 h-6 text-[#CDAA7D]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#2C1A1D] font-serif">
                      {questId ? 'Quest Applications' : 'Incoming Applications'}
                    </h3>
                    <p className="text-[#8B75AA]">
                      {questId ? 'Applications for this quest' : 'Applications to your quests'}
                    </p>
                  </div>
                </div>

                {applicationsToMyQuests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">No Applications Yet</h4>
                    <p className="text-gray-500">
                      No one has applied to your quests yet. Make sure your quests are attractive and well-described!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group applications by quest */}
                    {Object.entries(
                      applicationsToMyQuests
                        .filter(app => app.status !== 'rejected') // Filter out rejected applications
                        .reduce((acc, app) => {
                        const questId = app.quest.id;
                        if (!acc[questId]) {
                          acc[questId] = {
                            quest: app.quest,
                            applications: []
                          };
                        }
                        acc[questId].applications.push(app);
                        return acc;
                      }, {} as Record<number, { quest: any; applications: Application[] }>)
                    ).map(([questId, { quest, applications }]) => (
                      <div
                        key={questId}
                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                      >
                        {/* Quest Header */}
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-[#2C1A1D] mb-2 font-serif">{quest.title}</h4>
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyClass(quest.difficulty)}`}
                            >
                              {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                            </span>
                            
                            {/* Show only pending applications count */}
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
                              {applications.filter(app => app.status === 'pending').length} Pending {applications.filter(app => app.status === 'pending').length === 1 ? "Applicant" : "Applicants"}
                            </span>
                          </div>
                        </div>

                        {/* Applicants */}
                        <div className="space-y-4">
                          {applications.map((application) => (
                            <div
                              key={application.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {application.applicant.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <h5 className="font-bold text-[#2C1A1D] text-lg">{application.applicant.username}</h5>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(application.status)}`}
                                    >
                                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500 mb-2 space-y-1">
                                    <div>Applied {new Date(application.applied_at).toLocaleDateString()}</div>
                                    {application.reviewed_at && (
                                      <div className="flex items-center gap-1">
                                        <span className={application.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
                                          {application.status === 'approved' ? '✓ Accepted' : '✗ Rejected'}
                                        </span>
                                        <span>on {new Date(application.reviewed_at).toLocaleDateString()}</span>
                                        {application.reviewed_by && (
                                          <span>by {application.reviewed_by.username}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {application.status === "pending" && quest.status === "open" && (
                                <div className="flex gap-2 sm:flex-col lg:flex-row">
                                  <button
                                    onClick={() => handleApproveApplicant(application.id)}
                                    disabled={processingApplications.has(application.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    soundType="success"
                                  >
                                    {processingApplications.has(application.id) ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span className="hidden sm:inline">Processing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle size={16} />
                                        <span className="hidden sm:inline">Accept</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRejectApplicant(application.id)}
                                    disabled={processingApplications.has(application.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                  >
                                    {processingApplications.has(application.id) ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span className="hidden sm:inline">Processing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle size={16} />
                                        <span className="hidden sm:inline">Reject</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
