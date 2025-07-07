"use client"
import React, { useMemo } from "react"

type TypingUser = {
  user_id: string
  username: string
}

type TypingIndicatorProps = {
  typingUsers: TypingUser[]
  currentUserId: string
}

export default function TypingIndicator({
  typingUsers,
  currentUserId,
}: TypingIndicatorProps) {
  // Memoizing the filtered and unique list of users who are typing (excluding the current user)
  const activeTypingUsers = useMemo(
    () => {
      const uniqueTypingUsers = typingUsers.filter(
        (u, index, self) => self.findIndex((t) => t.user_id === u.user_id) === index
      )
      return uniqueTypingUsers.filter((u) => u.user_id !== currentUserId)
    },
    [typingUsers, currentUserId]
  )

  // If no users are typing, don't render anything
  if (activeTypingUsers.length === 0) return null

  const names = activeTypingUsers.map((u) => u.username)

  // Generate a specific message depending on the number of typing users
  let message = ""
  if (names.length === 1) {
    message = `${names[0]} is typing...`
  } else if (names.length === 2) {
    message = `${names[0]} and ${names[1]} are typing...`
  } else if (names.length > 2) {
    message = `${names[0]}, ${names[1]}, and ${names.length - 2} other${names.length - 2 > 1 ? 's' : ''} are typing...`
  }

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
