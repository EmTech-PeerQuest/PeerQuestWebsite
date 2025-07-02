"use client"

import { useState } from "react"
import { X, Flag, User, FileText, Calendar, MessageSquare, Shield } from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface Report {
  id: number
  type: "user" | "quest"
  reportedId: number
  reason: string
  status: "pending" | "resolved"
  reportedBy: number
  createdAt: Date
  description?: string
  evidence?: string[]
}

interface ReportDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  report: Report | null
  users: UserType[]
  onResolve: (reportId: number, action: string, notes: string) => void
  showToast: (message: string, type?: string) => void
}

export function ReportDetailsModal({ isOpen, onClose, report, users, onResolve, showToast }: ReportDetailsModalProps) {
  const [action, setAction] = useState("")
  const [notes, setNotes] = useState("")

  if (!isOpen || !report) return null

  const reportedByUser = users.find((u) => u.id === report.reportedBy)
  const reportedUser = report.type === "user" ? users.find((u) => u.id === report.reportedId) : null

  const handleResolve = () => {
    if (!action) {
      showToast("Please select an action", "error")
      return
    }

    onResolve(report.id, action, notes)
    showToast(`Report resolved with action: ${action}`, "success")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2C1A1D] to-[#8B75AA] text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#CDAA7D] rounded-full flex items-center justify-center">
                <Flag size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Report Details</h2>
                <p className="text-[#CDAA7D]">
                  {report.type === "user" ? "User Report" : "Quest Report"} • Report #{report.id}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-[#CDAA7D] transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
              <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
                <User size={18} />
                Reported By
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold">
                  {reportedByUser?.avatar || "U"}
                </div>
                <div>
                  <p className="font-medium text-[#2C1A1D]">{reportedByUser?.username || "Unknown"}</p>
                  <p className="text-sm text-[#8B75AA]">{reportedByUser?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
              <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Report Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Date:</span> {report.createdAt.toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      report.type === "user" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {report.type === "user" ? "User Report" : "Quest Report"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      report.status === "resolved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reported Content */}
          {report.type === "user" && reportedUser && (
            <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
              <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
                <Shield size={18} />
                Reported User
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#8B75AA] rounded-full flex items-center justify-center text-white font-bold">
                  {reportedUser.avatar || "U"}
                </div>
                <div>
                  <p className="font-medium text-[#2C1A1D]">{reportedUser.username}</p>
                  <p className="text-sm text-[#8B75AA]">{reportedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-[#8B75AA]/10 text-[#8B75AA] px-2 py-1 rounded">
                      Level {reportedUser.level || 1}
                    </span>
                    {reportedUser.banned && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Banned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Reason */}
          <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
            <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
              <MessageSquare size={18} />
              Report Reason
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-[#2C1A1D]">Category:</span>
                <span className="ml-2 px-2 py-1 bg-[#8B75AA]/10 text-[#8B75AA] rounded text-sm">{report.reason}</span>
              </div>
              {report.description && (
                <div>
                  <span className="font-medium text-[#2C1A1D]">Description:</span>
                  <p className="mt-1 text-[#2C1A1D] bg-[#F4F0E6] p-3 rounded">{report.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence */}
          {report.evidence && report.evidence.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
              <h3 className="font-bold text-[#2C1A1D] mb-3 flex items-center gap-2">
                <FileText size={18} />
                Evidence
              </h3>
              <div className="space-y-2">
                {report.evidence.map((item, index) => (
                  <div key={index} className="p-2 bg-[#F4F0E6] rounded text-sm text-[#2C1A1D]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Actions */}
          {report.status === "pending" && (
            <div className="bg-white rounded-lg p-4 border border-[#CDAA7D]">
              <h3 className="font-bold text-[#2C1A1D] mb-3">Resolution Actions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Action to Take:</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  >
                    <option value="">Select an action...</option>
                    <option value="dismiss">Dismiss Report</option>
                    <option value="warning">Issue Warning</option>
                    <option value="temporary_ban">Temporary Ban</option>
                    <option value="permanent_ban">Permanent Ban</option>
                    <option value="content_removal">Remove Content</option>
                    <option value="escalate">Escalate to Senior Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Admin Notes:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    className="w-full px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] h-20 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#CDAA7D]">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#CDAA7D] rounded-lg text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors"
          >
            Close
          </button>
          {report.status === "pending" && (
            <button
              onClick={handleResolve}
              className="px-6 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors"
            >
              Resolve Report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
