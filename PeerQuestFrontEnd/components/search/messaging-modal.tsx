"use client"

import { useState } from "react"
import { X, Send } from "lucide-react"
import type { User } from "@/lib/types"

interface MessagingModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: User
  currentUser: User
  showToast: (message: string, type?: string) => void
}

export function MessagingModal({ isOpen, onClose, recipient, currentUser, showToast }: MessagingModalProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const handleSendMessage = async () => {
    if (!message.trim()) {
      showToast("Please enter a message", "error")
      return
    }

    setIsSending(true)
    
    try {
      // Here you would integrate with your messaging API
      // For now, we'll simulate sending a message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showToast(`Message sent to ${recipient.displayName || recipient.username}!`, "success")
      setMessage("")
      onClose()
    } catch (error) {
      showToast("Failed to send message. Please try again.", "error")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-[#CDAA7D] p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B75AA] rounded-full flex items-center justify-center text-white overflow-hidden">
              {typeof recipient.avatar === 'string' && recipient.avatar.startsWith('http') ? (
                <img
                  src={recipient.avatar}
                  alt={recipient.displayName || recipient.username}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>
                  {(recipient.displayName || recipient.username || "?").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-[#2C1A1D]">
                Send Message to {recipient.displayName || recipient.username}
              </h3>
              <p className="text-sm text-[#2C1A1D]/70">@{recipient.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#2C1A1D] hover:text-[#2C1A1D]/70"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-[#2C1A1D] mb-2">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              className="w-full px-3 py-2 border border-[#CDAA7D] rounded-lg focus:outline-none focus:border-[#8B75AA] resize-none"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
            <div className="text-xs text-[#8B75AA] mt-1">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#CDAA7D] rounded text-[#2C1A1D] hover:bg-[#F4F0E6] transition-colors"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={isSending || !message.trim()}
              className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="text-xs text-[#8B75AA] bg-[#F4F0E6] p-2 rounded">
            💡 Tip: Keep messages respectful and quest-related. Inappropriate messages may result in account restrictions.
          </div>
        </div>
      </div>
    </div>
  )
}
