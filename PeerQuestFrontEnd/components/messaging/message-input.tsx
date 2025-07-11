"use client"
import React, { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Smile, X, Loader2 } from "lucide-react"
import EmojiPicker from "./emoji-picker"
import { motion, AnimatePresence } from "framer-motion"

type MessageInputProps = {
  onSend: (content: string, attachments?: File[]) => Promise<void>
  onTyping?: () => void
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
  const [showFilesPopup, setShowFilesPopup] = useState(true)
  // ...existing code...
  // Hide popup if all files are removed
  useEffect(() => {
    if (selectedFiles.length === 0) setShowFilesPopup(false);
    else setShowFilesPopup(true);
  }, [selectedFiles]);
  const inputRef = useRef<HTMLInputElement>(null)
  // Use a local ref only if fileInputRef is not provided
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const actualFileInputRef = fileInputRef && fileInputRef.current !== undefined && fileInputRef.current !== null ? fileInputRef : localFileInputRef;

  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e) e.preventDefault?.()
    const trimmed = newMessage.trim()
    // Allow sending if there is text OR at least one file
    if (trimmed.length === 0 && (!selectedFiles || selectedFiles.length === 0)) return
    if (isSending) return

    try {
      // Always pass the files array, even if only files (no text)
      await onSend(trimmed, selectedFiles && selectedFiles.length > 0 ? selectedFiles : undefined)
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
    const handler = setTimeout(() => onTyping(), 500)
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

  // Enable send button if there is text OR at least one file
  const isDisabled = (
    (typeof newMessage === 'string' ? newMessage.trim().length : 0) === 0 &&
    Array.isArray(selectedFiles) && selectedFiles.length === 0
  ) ||
    !Array.isArray(selectedFiles) ||
    disabled ||
    isSending;

  return (
    <div className="space-y-3">
      {/* Popup for attached files (directly above input area, inside fixed input) */}
      {selectedFiles.length > 0 && showFilesPopup && (
        <div
          className="mb-2 mx-auto w-fit bg-white border border-yellow-400 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in"
          style={{ minWidth: 220, maxWidth: 360 }}
        >
          <div className="flex-1 overflow-x-auto whitespace-nowrap text-sm">
            <b>Attached:</b> {selectedFiles.map(f => f.name.length > 24 ? f.name.slice(0, 21) + '…' : f.name).join(", ")}
          </div>
          <button
            className="ml-2 text-slate-500 hover:text-red-500 focus:outline-none"
            onClick={() => setShowFilesPopup(false)}
            aria-label="Dismiss attached files popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Show a hint if files are attached and message is empty */}
      {selectedFiles.length > 0 && newMessage.trim().length === 0 && (
        <div className="text-xs text-slate-600 px-3 pb-1">Ready to send <b>{selectedFiles.length}</b> file{selectedFiles.length > 1 ? 's' : ''}. Click send to upload.</div>
      )}

      {/* File attachments preview (still keep for inline removal) */}
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
          <input type="file" hidden multiple ref={actualFileInputRef} onChange={handleFileSelect} />
          <button
            type="button"
            onClick={() => actualFileInputRef.current?.click()}
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
            className="flex-1 border-0 bg-transparent focus:outline-none text-base px-2 truncate"
            style={{ color: "#2c1a1d", minWidth: 0, maxWidth: '100%' }}
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
