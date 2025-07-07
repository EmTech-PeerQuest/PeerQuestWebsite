"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Smile, X } from "lucide-react"
import EmojiPicker from "./EmojiPicker"
import { cn } from "@/lib/utils"

type MessageInputProps = {
  onSend: (content: string, attachments?: File[]) => Promise<void>
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  selectedFiles: File[]
  newMessage: string
  setNewMessage: (msg: string) => void
  isSending: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  wsConnected?: boolean
}

export default function MessageInput({
  onSend,
  onTyping,
  disabled = false,
  handleFileSelect,
  removeFile,
  selectedFiles,
  newMessage,
  setNewMessage,
  isSending,
  fileInputRef,
  wsConnected,
}: MessageInputProps) {
  const [showEmoji, setShowEmoji] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    const trimmed = newMessage.trim()
    if (trimmed || selectedFiles.length > 0) {
      await onSend(trimmed, selectedFiles.length > 0 ? selectedFiles : undefined)
      setShowEmoji(false)  // Optional: Close emoji picker after sending
      inputRef.current?.focus() // Focus back to input after sending
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(newMessage + emoji)
    inputRef.current?.focus() // Focus back after adding emoji
  }

  // Debounce typing indicator
  useEffect(() => {
    if (!onTyping) return

    const handler = setTimeout(() => {
      onTyping(newMessage.length > 0)
    }, 500)

    return () => clearTimeout(handler)
  }, [newMessage, onTyping])

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmoji &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        (event.target as HTMLElement).closest('.EmojiPicker__body') === null
      ) {
        setShowEmoji(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmoji])

  const isSendButtonDisabled = 
    (!newMessage.trim() && selectedFiles.length === 0) || disabled || isSending

  return (
    <div className="border-t border-border bg-background px-4 py-2">
      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2 rounded-lg bg-muted flex flex-wrap gap-2 text-sm overflow-x-auto">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-card border border-border rounded-full pl-3 pr-1 py-1"
            >
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-red-500 transition-colors rounded-full p-1"
                aria-label={`Remove file ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          className="text-muted-foreground p-2 rounded-full hover:bg-muted-foreground/10 transition-colors"
          onClick={() => setShowEmoji(prev => !prev)}
          disabled={disabled || isSending}
          aria-label="Open emoji picker"
        >
          <Smile size={20} />
        </button>

        <input
          type="file"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleFileSelect}
          aria-label="Attach files"
        />
        <button
          type="button"
          className="text-muted-foreground p-2 rounded-full hover:bg-muted-foreground/10 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          aria-label="Attach files"
        >
          <Paperclip size={20} />
        </button>

        <input
          ref={inputRef}
          type="text"
          className="flex-1 px-3 py-2 text-sm rounded-full bg-muted text-foreground focus:outline-none placeholder:text-muted-foreground"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isSendButtonDisabled) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={disabled || isSending}
          aria-label="Message input"
        />

        <button
          type="button"
          className={cn(
            "p-2 rounded-full text-white bg-blue-500",
            isSendButtonDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600",
            (disabled || isSending) && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleSend}
          disabled={isSendButtonDisabled}
          aria-label="Send message"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Send size={20} />
          )}
        </button>

        {showEmoji && (
          <div className="absolute bottom-full mb-2 left-0 z-50">
            <EmojiPicker onSelect={handleEmojiSelect} />
          </div>
        )}

        {wsConnected === false && (
          <div className="absolute bottom-full mb-[3.5rem] left-0 text-xs text-red-500 animate-pulse">
            Disconnected from server. Trying to reconnect...
          </div>
        )}
      </div>
    </div>
  )
}
