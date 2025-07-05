"use client"

import { X, AlertTriangle, Coins } from "lucide-react"
import type { User } from "@/lib/types"
import { canSpend, getDailySpending, getWeeklySpending } from "@/lib/spending-utils"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  goldAmount: number
  confirmText: string
  currentUser?: User | null
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  goldAmount,
  confirmText,
  currentUser,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const spendingCheck = currentUser ? canSpend(currentUser, goldAmount) : { canSpend: true }
  const dailySpent = currentUser ? getDailySpending(currentUser) : 0
  const weeklySpent = currentUser ? getWeeklySpending(currentUser) : 0

  const handleConfirm = () => {
    if (spendingCheck.canSpend) {
      onConfirm()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 border-2 border-orange-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={24} className="text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{message}</p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={20} className="text-orange-600" />
              <span className="font-bold text-orange-800">Gold Cost: {goldAmount.toLocaleString()}</span>
            </div>
            <p className="text-sm text-orange-700">This action cannot be undone.</p>
          </div>

          {/* Spending Limits Info */}
          {currentUser?.spendingLimits?.enabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Spending Summary</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Daily spent:</span>
                  <span>
                    {dailySpent.toLocaleString()} / {currentUser.spendingLimits.dailyLimit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly spent:</span>
                  <span>
                    {weeklySpent.toLocaleString()} / {currentUser.spendingLimits.weeklyLimit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>After this purchase:</span>
                  <span>{(dailySpent + goldAmount).toLocaleString()} daily</span>
                </div>
              </div>
            </div>
          )}

          {/* Spending Limit Warning */}
          {!spendingCheck.canSpend && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="font-semibold text-red-800">Spending Limit Exceeded</span>
              </div>
              <p className="text-sm text-red-700">{spendingCheck.reason}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!spendingCheck.canSpend}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              spendingCheck.canSpend
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
