"use client"

import { useState, useEffect } from "react";
import { getApplicationsToMyQuests, approveApplication, rejectApplication, kickParticipant } from "@/lib/api/applications";
import { X, ScrollText, Users, CheckCircle, XCircle, Clock, Star, CircleDollarSign, Calendar, User, AlertCircle } from "lucide-react";
import type { Application, User as UserType } from "@/lib/types";
import { getDifficultyClass } from "@/lib/utils";



interface QuestManagementApplicationsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: UserType | null
  questId?: number // Optional: if provided, only show applications for this specific quest
  onApplicationProcessed?: () => Promise<void> // Callback to refresh parent quest data
}

export function QuestManagementApplicationsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  questId, 
  onApplicationProcessed 
}: QuestManagementApplicationsModalProps) {
  const [applicationsToMyQuests, setApplicationsToMyQuests] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingApplications, setProcessingApplications] = useState<Set<number>>(new Set())
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalTarget, setRemovalTarget] = useState<number | null>(null);

  // Remove/Kick applicant handler
  const handleRemoveApplicant = async (applicationId: number) => {
    setProcessingApplications((prev) => new Set(prev).add(applicationId));
    setError(null);
    try {
      let reason = removalReason;
      if (removalTarget !== applicationId) reason = "";
      await kickParticipant(applicationId, reason);
      setRemovalReason("");
      setRemovalTarget(null);
      await loadApplications();
      if (onApplicationProcessed) await onApplicationProcessed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to kick participant');
    } finally {
      setProcessingApplications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadApplications()
    }
  }, [isOpen, currentUser, questId])

  const loadApplications = async () => {
    console.log('Loading applications for quest management:', currentUser?.username, questId ? `for quest ${questId}` : 'for all quests')
    setLoading(true)
    setError(null)
    try {
      const appsToMyQuests = await getApplicationsToMyQuests()
      console.log('Applications loaded successfully:', { 
        appsToMyQuests: appsToMyQuests.length,
        questId: questId
      })
      
      // Filter applications if questId is provided
      const filteredAppsToMyQuests = questId ? appsToMyQuests.filter(app => app.quest.id === questId) : appsToMyQuests
      
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
      // Reload applications to get updated data (status will change but application stays)
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
      // Reload applications to get updated data (status will change but application stays)
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock size={16} />
      case "approved":
        return <CheckCircle size={16} />
      case "rejected":
        return <XCircle size={16} />
      case "kicked":
        return <AlertCircle size={16} />
      default:
        return <Clock size={16} />
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
                Application History Log
              </h2>
              <p className="text-white/90">
                View all applications and their status history for this quest
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#8B75AA] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-[#8B75AA] font-medium">Loading applications...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Applications</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadApplications}
                className="px-4 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : applicationsToMyQuests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ScrollText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600">
                {questId 
                  ? "This quest hasn't received any applications yet." 
                  : "You haven't received any applications to your quests yet."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#2C1A1D] mb-2 font-serif">
                  Applications History ({applicationsToMyQuests.length})
                </h3>
                <p className="text-gray-600">
                  All applications are preserved as a log, regardless of their status.
                </p>
              </div>

              {applicationsToMyQuests.map((application) => (
                <div
                  key={application.id}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Application Header */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        {/* Quest Info */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <h4 className="text-xl font-bold text-[#2C1A1D] font-serif">
                            {application.quest.title}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 ${getStatusColor(application.status)}`}
                          >
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyClass(application.quest.difficulty)}`}>
                            {application.quest.difficulty.charAt(0).toUpperCase() + application.quest.difficulty.slice(1)}
                          </span>
                        </div>

                        {/* Applicant Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#8B75AA] to-[#7A6699] rounded-full flex items-center justify-center text-white font-bold">
                            {application.applicant.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2C1A1D]">{application.applicant.username}</p>
                            <p className="text-sm text-gray-600">{application.applicant.email}</p>
                          </div>
                        </div>

                        {/* Quest Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-[#8B75AA]" />
                            <div>
                              <p className="text-xs text-gray-500">XP Reward</p>
                              <p className="font-bold text-[#8B75AA]">{application.quest.xp_reward} XP</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CircleDollarSign size={16} className="text-[#CDAA7D]" />
                            <div>
                              <p className="text-xs text-gray-500">Gold</p>
                              <p className="font-bold text-[#2C1A1D]">{application.quest.gold_reward || 0} Gold</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Applied</p>
                              <p className="font-medium text-gray-700">
                                {new Date(application.applied_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Level</p>
                              <p className="font-medium text-gray-700">
                                Level {application.applicant.level || 1}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Show for pending or approved applications */}
                      {(application.status === 'pending' || application.status === 'approved') && (
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          {application.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveApplicant(application.id)}
                                disabled={processingApplications.has(application.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingApplications.has(application.id) ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectApplicant(application.id)}
                                disabled={processingApplications.has(application.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingApplications.has(application.id) ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <XCircle size={16} />
                                )}
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                          {/* Remove/Kick button for both pending and approved */}
                          <div className="flex gap-2 items-center mt-1">
                            {removalTarget === application.id ? (
                              <>
                                <input
                                  type="text"
                                  className="px-2 py-1 border rounded text-sm flex-1"
                                  placeholder="Reason (optional)"
                                  value={removalReason}
                                  onChange={e => setRemovalReason(e.target.value)}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRemoveApplicant(application.id)}
                                  disabled={processingApplications.has(application.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-semibold disabled:opacity-50"
                                >
                                  {processingApplications.has(application.id) ? 'Kicking...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => { setRemovalTarget(null); setRemovalReason(""); }}
                                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800"
                                >Cancel</button>
                              </>
                            ) : (
                              <button
                                onClick={() => { setRemovalTarget(application.id); setRemovalReason(""); }}
                                disabled={processingApplications.has(application.id)}
                                className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 text-xs font-semibold disabled:opacity-50"
                              >
                                Kick Participant
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
