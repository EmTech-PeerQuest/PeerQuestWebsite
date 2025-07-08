"use client"

import React, { useCallback } from "react"
import dynamic from "next/dynamic"

interface EmojiData {
  native: string
  id: string
  unified: string
  colons: string
  shortcodes: string
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
}

const Picker = dynamic(
  () => import("@emoji-mart/react").then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <span>Loading emojis...</span>
      </div>
    ),
  }
) as React.ComponentType<PickerProps>

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
  theme?: "light" | "dark" | "auto"
  className?: string
}

export default function EmojiPicker({
  onSelect,
  theme = "light",
  className = "",
}: EmojiPickerProps) {
  const handleEmojiSelect = useCallback(
    (emoji: EmojiData) => {
      if (emoji?.native) {
        onSelect(emoji.native)
      }
    },
    [onSelect]
  )

  return (
    <div
      className={`${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } p-2 rounded-lg shadow-lg ${className} cursor-pointer`}
      aria-label="Emoji Picker"
      tabIndex={0}
    >
      <Picker
        onEmojiSelect={handleEmojiSelect}
        theme={theme}
        previewPosition="none"
        searchPosition="none"
        skinTonePosition="none"
        emojiButtonSize={28}
        emojiSize={20}
        maxFrequentRows={2}
        navPosition="top"
        perLine={9}
        aria-label="Select emoji"
      />
    </div>
  )
}
