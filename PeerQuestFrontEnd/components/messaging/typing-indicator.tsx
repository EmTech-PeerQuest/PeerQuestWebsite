"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { TypingUser } from "@/lib/types"

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
  currentUserId: string
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, currentUserId }) => {
  const timeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  // Filter out current user and users who aren't actually typing
  const activeTypingUsers = typingUsers.filter((user) => 
    user.user_id !== currentUserId && user.is_typing !== false
  )

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach((timeout) => clearTimeout(timeout))
      timeoutRef.current.clear()
    }
  }, [])

  if (activeTypingUsers.length === 0) return null

  const getTypingText = () => {
    const count = activeTypingUsers.length
    if (count === 1) {
      return `${activeTypingUsers[0].username} is typing...`
    } else if (count === 2) {
      return `${activeTypingUsers[0].username} and ${activeTypingUsers[1].username} are typing...`
    } else {
      return `${activeTypingUsers[0].username} and ${count - 1} others are typing...`
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`typing-${activeTypingUsers.map(u => u.user_id).join('-')}`}
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 text-sm mb-2 px-4 py-2 rounded-lg"
        style={{ 
          color: "#8b75aa",
          backgroundColor: "rgba(244, 240, 230, 0.5)",
          border: "1px solid rgba(205, 170, 125, 0.3)"
        }}
      >
        <div className="flex gap-1">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#cdaa7d" }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: 0,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#cdaa7d" }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: 0.2,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#cdaa7d" }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: 0.4,
              ease: "easeInOut"
            }}
          />
        </div>
        <span className="text-xs font-medium">{getTypingText()}</span>
      </motion.div>
    </AnimatePresence>
  )
}

export default TypingIndicator