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
  setNewMessage: React.Dispatch<React.SetStateAction<string>>
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
    if (trimmed || selectedFiles.length) {
      await onSend(trimmed, selectedFiles.length ? selectedFiles : undefined)
      setShowEmoji(false)
      inputRef.current?.focus()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
      setNewMessage((prev) => prev + emoji)
      setShowEmoji(false)
      inputRef.current?.focus()
  }

  useEffect(() => {
    if (!onTyping) return
    const handler = setTimeout(() => onTyping(newMessage.length > 0), 500)
    return () => clearTimeout(handler)
  }, [newMessage, onTyping])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showEmoji &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".EmojiPicker__body")
      ) {
        setShowEmoji(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmoji])

  const isDisabled = (!newMessage.trim() && selectedFiles.length === 0) || disabled || isSending

  return (
    <div className="border-t border-border bg-background px-4 py-2">
      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2 rounded-lg bg-muted flex flex-wrap gap-2 text-sm overflow-x-auto">
          {selectedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-1 bg-card border border-border rounded-full pl-3 pr-1 py-1">
              <span className="truncate max-w-[100px]" title={file.name}>{file.name}</span>
              <button
                onClick={() => removeFile(i)}
                className="text-muted-foreground hover:text-red-500 p-1 rounded-full transition-colors"
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
          onClick={() => setShowEmoji((p) => !p)}
          disabled={disabled || isSending}
          className="text-muted-foreground p-2 rounded-full hover:bg-muted-foreground/10"
          aria-label="Toggle emoji picker"
          aria-pressed={showEmoji}
        >
          <Smile size={20} />
        </button>

        <input type="file" hidden multiple ref={fileInputRef} onChange={handleFileSelect} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="text-muted-foreground p-2 rounded-full hover:bg-muted-foreground/10"
          aria-label="Attach files"
        >
          <Paperclip size={20} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
              e.preventDefault()
              handleSend()
            }
          }}
          className="flex-1 px-3 py-2 text-sm rounded-full bg-muted text-foreground focus:outline-none placeholder:text-muted-foreground"
          placeholder="Type a message..."
          disabled={disabled || isSending}
          aria-label="Message input"
          autoComplete="off"
          spellCheck={false}
        />

        <button
          onClick={handleSend}
          disabled={isDisabled}
          className={cn(
            "p-2 rounded-full text-white bg-blue-500",
            isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          )}
          aria-label="Send message"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z" />
            </svg>
          ) : (
            <Send size={20} />
          )}
        </button>

        {showEmoji && (
          <div className="absolute bottom-full mb-2 left-0 z-50 EmojiPicker__body">
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
