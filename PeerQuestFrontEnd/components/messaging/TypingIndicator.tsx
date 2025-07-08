"use client"
import React, { useMemo } from "react"
import type { TypingUser } from "@/lib/types"

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
  currentUserId: string
}

export default function TypingIndicator({ typingUsers, currentUserId }: TypingIndicatorProps) {
  const names = useMemo(() => {
    const unique = new Map<string, string>()
    typingUsers.forEach(({ user_id, username }) => {
      if (user_id !== currentUserId) unique.set(user_id, username)
    })
    return [...unique.values()]
  }, [typingUsers, currentUserId])

  if (names.length === 0) return null

  const message =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : `${names[0]}, ${names[1]}, and ${names.length - 2} other${names.length > 3 ? "s" : ""} are typing...`

  return (
    <div
      className="text-sm text-muted-foreground px-4 pb-1 animate-pulse opacity-75"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {message}
    </div>
  )
}
