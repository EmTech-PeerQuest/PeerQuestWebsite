"use client"
import React, { useMemo } from "react"

type TypingUser = {
  user_id: string
  username: string
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
  currentUserId: string
}

export default function TypingIndicator({
  typingUsers,
  currentUserId,
}: TypingIndicatorProps) {
  // Memoize filtered unique typing users excluding the current user
  const activeTypingUsers = useMemo(() => {
    const uniqueTypingUsers = typingUsers.filter(
      (user, index, self) => self.findIndex((t) => t.user_id === user.user_id) === index
    )
    return uniqueTypingUsers.filter((user) => user.user_id !== currentUserId)
  }, [typingUsers, currentUserId])

  if (activeTypingUsers.length === 0) return null

  const names = activeTypingUsers.map((u) => u.username)

  const message =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : `${names[0]}, ${names[1]}, and ${names.length - 2} other${names.length - 2 > 1 ? "s" : ""} are typing...`

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
