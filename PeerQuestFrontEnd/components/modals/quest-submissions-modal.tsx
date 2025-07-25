import React, { useEffect, useState } from "react";
import type { Quest } from "@/lib/types";
import { QuestAPI, QuestSubmission } from "@/lib/api/quests";
import { X, UserCircle2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/quests";

interface QuestSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: Quest | null;
  currentUser?: any;
  showToast?: (msg: string, type?: string) => void;
  onMarkComplete?: () => void;
  onApproveSubmission?: (submissionId: number, feedback?: string) => Promise<void> | void;
  onMarkNeedsRevision?: (submissionId: number, feedback?: string) => void;
  canReviewSubmissions?: boolean;
}

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800 border-green-200",
  needs_revision: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200",
  superseded: "bg-gray-100 text-gray-800 border-gray-200",
};

const QuestSubmissionsModal: React.FC<QuestSubmissionsModalProps> = ({ 
  isOpen, 
  onClose, 
  quest, 
  showToast, 
  onMarkComplete,
  onApproveSubmission,
  onMarkNeedsRevision,
  canReviewSubmissions
}) => {
  const [submissions, setSubmissions] = useState<QuestSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState<any>(null);

  // Fetch submissions and optionally completion result
  useEffect(() => {
    if (!isOpen || !quest) return;
    setLoading(true);
    setError(null);
    // Fetch submissions and, if completed, the quest completion log for reward info
    const fetchData = async () => {
      try {
        const submissionsData = await QuestAPI.getQuestSubmissions(quest.slug);
        const submissionsArray = Array.isArray(submissionsData) ? submissionsData : [];
        const sortedSubmissions = submissionsArray.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        setSubmissions(sortedSubmissions);
        if (quest.status === 'completed') {
          // Find all approved submissions and fetch their completion logs
          const approvedSubs = sortedSubmissions.filter(sub => sub.status === 'approved');
          if (approvedSubs.length > 0) {
            try {
              // Fetch all logs in parallel
              const logs = await Promise.all(
                approvedSubs.map(async (sub) => {
                  const res = await fetch(`${API_BASE_URL}/quests/completion_log/?quest=${quest.id}&adventurer=${sub.participant_username}`);
                  if (res.ok) {
                    return await res.json();
                  }
                  return null;
                })
              );
              setCompletionResult(logs.filter(Boolean));
            } catch {
              setCompletionResult(null);
            }
          } else {
            setCompletionResult(null);
          }
        } else {
          setCompletionResult(null);
        }
      } catch {
        setError("Failed to load submissions.");
        // Suppress error toast: do not show toast error message
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, quest]);

  if (!isOpen || !quest) return null;

  // Helper to download file with auth
  async function downloadSubmissionFile(submissionId: number, fileIdx: number, filename: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const url = `${API_BASE_URL}/quests/submissions/${submissionId}/download/${fileIdx}/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      alert(err.detail || 'Failed to download file.');
      return;
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    }, 100);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Fixed Header with color */}
        <div className="bg-gradient-to-r from-[#8B75AA] to-[#FBBF24] rounded-t-2xl border-b border-gray-100 flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white font-serif flex items-center gap-2 drop-shadow">
            <FileText className="w-7 h-7 text-white" />
            Submitted Work for: <span className="ml-1 text-white/90">{quest.title}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Scrollable Content Area - This entire section scrolls */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quest Status Indicator */}
          {quest.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Quest Completed</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                This quest has been marked as completed. Participants have been awarded their rewards.
              </p>
              {completionResult && (
                <div className="mt-2 text-green-900 text-sm">
                  <strong>Reward Summary:</strong><br />
                  {completionResult.participant_results && completionResult.participant_results.length > 0 && (
                    <>
                      <span>Participants: </span>
                      {completionResult.participant_results.map((r: any, idx: number) => (
                        <span key={r.user}>
                          {r.user}: {r.xp_awarded} XP, {r.gold_awarded} Gold{idx < completionResult.participant_results.length - 1 ? '; ' : ''}
                        </span>
                      ))}
                      <br />
                    </>
                  )}
                  {completionResult.admin_award && (
                    <span>Admin: {completionResult.admin_award.user} received {completionResult.admin_award.xp_awarded} XP, {completionResult.admin_award.gold_awarded} Gold</span>
                  )}
                  {completionResult.admin_balance && (
                    <div>Admin Balance: {completionResult.admin_balance.xp} XP, {completionResult.admin_balance.gold} Gold</div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Compact submission review notice - only show for non-completed quests */}
          {quest.status !== 'completed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3 text-xs text-blue-700">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span className="font-semibold text-blue-800">Review Guidelines (Quest Creators Only):</span>
              </div>
              <div className="text-blue-600 leading-tight">
                All pending submissions must be reviewed before completing the quest • <strong>Approve</strong> = complete quest & award rewards • <strong>Needs Revision</strong> = allow participant to resubmit
              </div>
            </div>
          )}
          
          {/* Quest completion button (only visible to quest creators) */}
          {onMarkComplete && (() => {
            const pendingSubmissions = submissions.filter(sub => sub.status === 'pending');
            const hasPendingSubmissions = pendingSubmissions.length > 0;
            
            return (
              <div className="flex flex-col gap-3 mb-6">
                {/* Show warning if there are pending submissions */}
                {hasPendingSubmissions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">
                        You have {pendingSubmissions.length} pending submission{pendingSubmissions.length > 1 ? 's' : ''} that must be reviewed before completing this quest.
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      Please approve or mark all submissions as needing revision first.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      if (hasPendingSubmissions) return;
                      if (!quest) return;
                      setLoading(true);
                      try {
                        // Find all approved submissions
                        const approvedSubs = submissions.filter(sub => sub.status === 'approved');
                        if (approvedSubs.length === 0) {
                          setLoading(false);
                          return;
                        }
                        // Fetch quest participants to map usernames to user IDs
                        let participantMap: Record<string, number> = {};
                        try {
                          const participants = await QuestAPI.getQuestParticipants(quest.slug);
                          participantMap = participants.reduce((acc, p) => {
                            if (p.user && p.user.username) {
                              acc[p.user.username] = p.user.id;
                            }
                            return acc;
                          }, {} as Record<string, number>);
                        } catch (e) {
                          // fallback: no mapping
                        }
                        // Call the new QuestCompletionLog API for each approved submission
                        const results = [];
                        for (const sub of approvedSubs) {
                          try {
                            const userId = participantMap[sub.participant_username] || sub.id; // fallback to sub.id if mapping fails
                            const res = await fetch(`${API_BASE_URL}/quests/completion_log/create/`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(typeof window !== 'undefined' && localStorage.getItem('access_token') ? { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } : {})
                              },
                              credentials: 'include',
                              body: JSON.stringify({
                                quest_id: quest.id,
                                adventurer_id: userId,
                                xp_earned: quest.xp_reward || 0,
                                gold_earned: quest.gold_reward || 0
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              results.push(data);
                            }
                          } catch (err) {
                            // Already approved or error
                          }
                        }
                        setCompletionResult(results);
                        if (showToast) showToast('Quest marked as completed and rewards distributed!', 'success');
                        if (onMarkComplete) onMarkComplete();
                      } catch (err: any) {
                        setLoading(false);
                        // Suppress error toast: do not show toast error message
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={hasPendingSubmissions || loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-semibold ${
                      hasPendingSubmissions || loading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    title={hasPendingSubmissions ? 'Review all submissions before completing quest' : 'Complete quest and award rewards'}
                  >
                    <CheckCircle2 size={18} />
                    <span>{loading ? 'Completing...' : 'Complete Quest'}</span>
                  </button>
                </div>
              </div>
            );
          })()}
          
          {/* Submissions Content */}
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#8B75AA] border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-[#8B75AA] font-medium">Loading submissions...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                <span className="text-red-500 font-medium">{error}</span>
              </div>
            ) : submissions.length > 0 ? (
              <div>
                {/* Submissions summary */}
                {(() => {
                  const pendingCount = submissions.filter(sub => sub.status === 'pending').length;
                  const approvedCount = submissions.filter(sub => sub.status === 'approved').length;
                  const revisionCount = submissions.filter(sub => sub.status === 'needs_revision').length;
                  
                  return (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Submissions Summary</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">
                            <span className="font-bold">{pendingCount}</span> Pending Review
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">
                            <span className="font-bold">{approvedCount}</span> Approved
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span className="text-sm">
                            <span className="font-bold">{revisionCount}</span> Needs Revision
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
            <ul className="space-y-6">
              {submissions.map((submission, index) => {
                return (
                <li key={submission.id} className={`rounded-xl p-5 border flex flex-col sm:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow ${
                  submission.status === 'pending' 
                    ? 'bg-amber-50 border-amber-200 border-2' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {/* Avatar and user info */}
                  <div className="flex flex-col items-center justify-center min-w-[110px] py-2 px-1 bg-gradient-to-b from-[#f3e8ff] to-[#fef3c7] rounded-xl shadow-inner border border-[#e9d5ff]/60">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8B75AA] to-[#7A6699] flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg border-4 border-white">
                      {submission.participant_username?.[0]?.toUpperCase() || <UserCircle2 className="w-8 h-8" />}
                    </div>
                    <div className="font-semibold text-[#2C1A1D] text-center break-all text-base mt-1 px-1 truncate max-w-[90px]">{submission.participant_username}</div>
                  </div>
                  {/* Submission details */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[submission.status] || statusColors['pending']}`}>{submission.status.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-xs text-gray-500">Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                      {submission.reviewed_at && (
                        <span className="text-xs text-gray-500">• Reviewed: {new Date(submission.reviewed_at).toLocaleString()} {submission.reviewed_by_username && (<span>by {submission.reviewed_by_username}</span>)}</span>
                      )}
                    </div>
                    {/* Description and Link */}
                    {submission.description || submission.link ? (
                      <div className="bg-gradient-to-br from-[#f3e8ff] to-[#fef3c7] border border-[#e9d5ff] rounded-xl p-4 text-sm text-gray-900 shadow-inner mb-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-[#8B75AA]" />
                          <span className="font-semibold text-[#8B75AA] text-base">Submission Details</span>
                        </div>
                        {submission.description && (
                          <div className="mb-2">
                            <span className="block text-xs text-[#8B75AA] font-bold uppercase tracking-wide mb-1">Description</span>
                            <div className="whitespace-pre-line text-gray-800 bg-white/70 rounded p-2 border border-[#e9d5ff]">{submission.description}</div>
                          </div>
                        )}
                        {submission.link && (
                          <div className="mt-2">
                            <span className="block text-xs text-[#8B75AA] font-bold uppercase tracking-wide mb-1">Link</span>
                            <a
                              href={submission.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-semibold hover:bg-blue-100 hover:text-blue-900 transition-colors break-all shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6h2.25A2.25 2.25 0 0118 8.25v7.5A2.25 2.25 0 0115.75 18h-7.5A2.25 2.25 0 016 15.75V13.5m1.5-7.5h5.25A2.25 2.25 0 0115 8.25v7.5A2.25 2.25 0 0112.75 18H8.25A2.25 2.25 0 016 15.75V8.25A2.25 2.25 0 018.25 6z" />
                              </svg>
                              {submission.link}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : null}
                    {/* Files */}
                    {submission.submission_files && submission.submission_files.length > 0 && (
                      <div className="bg-gradient-to-br from-[#e0e7ff] to-[#f3e8ff] border border-[#c7d2fe] rounded-xl p-4 text-sm mt-2 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-[#8B75AA]" />
                          <span className="font-semibold text-[#8B75AA] text-base">Files</span>
                        </div>
                        <ul className="list-none ml-0 space-y-2">
                          {(submission.submission_files
                            .map((f, idx) => {
                              let url: string | undefined;
                              let name: string | undefined;
                              // Defensive: If f is a stringified object, try to parse it
                              if (typeof f === 'string') {
                                try {
                                  // Try to parse if it looks like an object string
                                  if (f.trim().startsWith('{') && f.trim().endsWith('}')) {
                                    const parsed = JSON.parse(f.replace(/'/g, '"'));
                                    url = parsed.file;
                                    name = parsed.name || (parsed.file ? parsed.file.split('/').pop() : `File ${idx + 1}`);
                                  } else {
                                    url = f;
                                    name = f.split('/').pop() || `File ${idx + 1}`;
                                  }
                                } catch {
                                  url = f;
                                  name = f.split('/').pop() || `File ${idx + 1}`;
                                }
                              } else if (f && typeof f === 'object') {
                                url = (f as any).file;
                                name = (f as any).name || ((f as any).file ? (f as any).file.split('/').pop() : `File ${idx + 1}`);
                              }
                              if (!url) return null;
                              return { url, name };
                            })
                            .filter(Boolean) as { url: string; name: string }[]
                          ).map((fileObj, realIdx) => {
                            // Defensive: Only show the filename, never the object
                            const safeName = typeof fileObj.name === 'string' ? fileObj.name : `File_${realIdx + 1}`;
                            return (
                              <li key={realIdx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-semibold hover:bg-blue-100 hover:text-blue-900 transition-colors break-all shadow-sm"
                                  onClick={() => downloadSubmissionFile(submission.id, realIdx, safeName)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 8l-3-3m3 3l3-3m-6 5.25A2.25 2.25 0 018.25 18h7.5A2.25 2.25 0 0018 15.75v-7.5A2.25 2.25 0 0015.75 6h-7.5A2.25 2.25 0 006 8.25v7.5A2.25 2.25 0 008.25 18z" />
                                  </svg>
                                  {safeName}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {submission.feedback && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm text-purple-800">
                        <strong className="block mb-1">Feedback:</strong>
                        {submission.feedback}
                      </div>
                    )}
                    {/* Submission action buttons for quest creators - on all pending submissions */}
                    {canReviewSubmissions && submission.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-gray-200 justify-center">
                        <button
                          onClick={async () => {
                            try {
                              if (onApproveSubmission) {
                                // Always suppress error toasts from onApproveSubmission
                                await Promise.resolve(onApproveSubmission(submission.id)).catch(() => {});
                                // Refetch submissions after approval
                                if (quest) {
                                  setLoading(true);
                                  const submissionsData = await QuestAPI.getQuestSubmissions(quest.slug);
                                  const sortedSubmissions = Array.isArray(submissionsData)
                                    ? submissionsData.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                                    : [];
                                  setSubmissions(sortedSubmissions);
                                  setLoading(false);
                                }
                              }
                            } catch (err) {
                              setLoading(false);
                              // Suppress error toast: do not show toast error message
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold text-sm min-w-[140px] sm:flex-1 sm:max-w-[200px]"
                        >
                          <CheckCircle2 size={16} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onMarkNeedsRevision?.(submission.id)}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-semibold text-sm min-w-[140px] sm:flex-1 sm:max-w-[200px]"
                        >
                          <AlertCircle size={16} />
                          <span>Needs Revision</span>
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
              })}
            </ul>
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <UserCircle2 className="w-10 h-10 text-gray-300 mb-2" />
                <span className="text-gray-500">No submissions yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestSubmissionsModal;
