"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Smile, X, Loader2 } from "lucide-react"
import EmojiPicker from "./emoji-picker"
import { motion, AnimatePresence } from "framer-motion"

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

  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e) e.preventDefault?.()
    const trimmed = newMessage.trim()
    if (!trimmed && selectedFiles.length === 0) return
    if (isSending) return

    try {
      await onSend(trimmed, selectedFiles.length ? selectedFiles : undefined)
      setNewMessage("")
      setShowEmoji(false)
      inputRef.current?.focus()
    } catch (error) {
      console.error("Error sending message:", error)
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
        !(e.target as HTMLElement).closest(".emoji-picker")
      ) {
        setShowEmoji(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmoji])

  const isDisabled = (!newMessage.trim() && selectedFiles.length === 0) || disabled || isSending

  return (
    <div className="space-y-3">
      {/* File attachments preview */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 p-3 rounded-xl card"
          >
            {selectedFiles.map((file, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-2 text-sm card"
              >
                <span className="truncate max-w-[120px]" title={file.name}>
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="btn-danger h-5 w-5 p-0 text-xs"
                  aria-label={`Remove file ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-3 p-3 rounded-2xl transition-all focus-within:shadow-lg"
          style={{
            background: "white",
            border: "2px solid #cdaa7d",
            boxShadow: "0 2px 8px rgba(44, 26, 29, 0.1)",
          }}
        >
          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmoji((p) => !p)}
            disabled={disabled || isSending}
            className="p-2 rounded-full transition-all hover:scale-110 flex items-center justify-center"
            style={{
              background: showEmoji ? "#cdaa7d" : "transparent",
              border: "2px solid #cdaa7d",
              color: showEmoji ? "#2c1a1d" : "#8b75aa",
              width: "40px",
              height: "40px",
            }}
            aria-label="Toggle emoji picker"
            aria-pressed={showEmoji}
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* File upload */}
          <input type="file" hidden multiple ref={fileInputRef} onChange={handleFileSelect} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSending}
            className="p-2 rounded-full transition-all hover:scale-110 flex items-center justify-center"
            style={{
              background: "transparent",
              border: "2px solid #cdaa7d",
              color: "#8b75aa",
              width: "40px",
              height: "40px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#cdaa7d"
              e.currentTarget.style.color = "#2c1a1d"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "#8b75aa"
            }}
            aria-label="Attach files"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            className="flex-1 border-0 bg-transparent focus:outline-none text-base px-2"
            style={{ color: "#2c1a1d" }}
            placeholder="📜 Type your message..."
            disabled={disabled || isSending}
            aria-label="Message input"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="p-2 rounded-full transition-all flex items-center justify-center"
            style={{
              background: isDisabled ? "#9e9e9e" : "linear-gradient(135deg, #cdaa7d 0%, #e6c78a 100%)",
              color: "#2c1a1d",
              border: "2px solid #8b75aa",
              width: "40px",
              height: "40px",
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.transform = "scale(1.1)"
                e.currentTarget.style.background = "linear-gradient(135deg, #e6c78a 0%, #cdaa7d 100%)"
              }
            }}
            onMouseLeave={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.transform = "scale(1)"
                e.currentTarget.style.background = "linear-gradient(135deg, #cdaa7d 0%, #e6c78a 100%)"
              }
            }}
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute bottom-full mb-2 left-0 z-50 emoji-picker"
          >
            <EmojiPicker onSelect={handleEmojiSelect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection status */}
      <AnimatePresence>
        {wsConnected === false && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 left-0 text-xs px-2 py-1 rounded-md card"
            style={{ backgroundColor: "#f8d7da", color: "#721c24", borderColor: "#f5c6cb" }}
          >
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Disconnected from tavern. Trying to reconnect...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
