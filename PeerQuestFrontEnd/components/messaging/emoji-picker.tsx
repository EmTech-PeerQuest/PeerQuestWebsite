"use client"

import React, { useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"

// Emoji Data Interface
interface EmojiData {
  id: string
  name: string
  native: string
  unified: string
  keywords: string[]
  shortcodes: string
  emoticons?: string[]
  [key: string]: any
}

interface PickerProps {
  onEmojiSelect: (emoji: EmojiData) => void
  theme?: "light" | "dark" | "auto"
  previewPosition?: "none" | "top" | "bottom"
  searchPosition?: "none" | "top" | "bottom"
  skinTonePosition?: "none" | "top" | "bottom"
  emojiButtonSize?: number
  emojiSize?: number
  maxFrequentRows?: number
  navPosition?: "top" | "bottom"
  perLine?: number
  set?: "native" | "apple" | "facebook" | "google" | "twitter"
  locale?: string
  categories?: string[]
  exceptEmojis?: string[]
  custom?: any[]
}

const LoadingSpinner = () => (
  <motion.div
    className="flex items-center justify-center p-6"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="flex flex-col items-center space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="text-sm text-muted-foreground">Loading emojis...</span>
    </div>
  </motion.div>
)

const ErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    className="flex items-center justify-center p-6"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="text-center">
      <p className="text-sm text-red-500 mb-2">Failed to load emoji picker</p>
      <button
        onClick={onRetry}
        className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/80 transition-colors"
      >
        Retry
      </button>
    </div>
  </motion.div>
)

const Picker = dynamic(() => import("@emoji-mart/react").then(mod => mod.default), {
  ssr: false,
  loading: () => <LoadingSpinner />,
}) as React.ComponentType<PickerProps>

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
  theme?: "light" | "dark" | "auto"
  className?: string
  disabled?: boolean
  set?: "native" | "apple" | "facebook" | "google" | "twitter"
  locale?: string
  maxFrequentRows?: number
  perLine?: number
  emojiSize?: number
  emojiButtonSize?: number
  onError?: (error: Error) => void
}

export default function EmojiPicker({
  onSelect,
  theme = "light",
  className = "",
  disabled = false,
  set = "native",
  locale = "en",
  maxFrequentRows = 2,
  perLine = 9,
  emojiSize = 20,
  emojiButtonSize = 28,
  onError,
}: EmojiPickerProps) {
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const handleEmojiSelect = useCallback(
    (emoji: EmojiData) => {
      if (disabled) return
      try {
        const emojiString = emoji.native || emoji.id || emoji.unified || ""
        if (!emojiString) throw new Error("No emoji string found in emoji data")
        onSelect(emojiString)
      } catch (error) {
        console.error("Emoji selection error:", error)
        if (onError) onError(error as Error)
      }
    },
    [onSelect, disabled, onError]
  )

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") event.stopPropagation()
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setRetryKey(prev => prev + 1)
  }, [])

  const handleError = useCallback(
    (error: Error) => {
      console.error("Emoji picker load error:", error)
      setHasError(true)
      if (onError) onError(error)
    },
    [onError]
  )

  return (
    <motion.div
      className={`
        p-3 rounded-xl shadow-xl border border-border
        ${theme === "dark" ? "bg-card" : "bg-white"}
        ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="false"
      aria-label="Emoji Picker"
      onKeyDown={handleKeyDown}
    >
      <AnimatePresence mode="wait">
        {hasError ? (
          <ErrorFallback onRetry={handleRetry} />
        ) : (
          <React.Suspense fallback={<LoadingSpinner />}>
            <ErrorBoundary onError={handleError}>
              <Picker
                key={retryKey}
                onEmojiSelect={handleEmojiSelect}
                theme={theme}
                previewPosition="none"
                searchPosition="top"
                skinTonePosition="none"
                emojiButtonSize={emojiButtonSize}
                emojiSize={emojiSize}
                maxFrequentRows={maxFrequentRows}
                navPosition="top"
                perLine={perLine}
                set={set}
                locale={locale}
              />
            </ErrorBoundary>
          </React.Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Basic error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("EmojiPicker Boundary:", error, info)
    if (this.props.onError) this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-4">
          <span className="text-sm text-red-500">Something went wrong</span>
        </div>
      )
    }
    return this.props.children
  }
}
