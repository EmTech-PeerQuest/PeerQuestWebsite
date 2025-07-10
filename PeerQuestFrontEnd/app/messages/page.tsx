"use client"

import { useState, useEffect } from "react"
import MessagingSystem from "@/components/messaging/messaging-system"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Loader2, Wifi, WifiOff, Scroll } from "lucide-react"

function MessagesPageContent() {
  const { user: currentUser, token, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [onlineUsers] = useState<Map<string, "online" | "idle" | "offline">>(new Map())
  const [isConnected, setIsConnected] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Simulate progress bar animation
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 10))
      }, 100)
      return () => clearInterval(interval)
    } else {
      setLoadingProgress(100)
    }
  }, [isLoading])

  // Track browser offline/online status
  useEffect(() => {
    if (!mounted) return

    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [mounted])

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    console.log(`${type.toUpperCase()}: ${message}`)
    if (typeof document !== "undefined") {
      const toast = document.createElement("div")
      toast.textContent = message
      toast.className = `toast ${type}`
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    }
  }

  if (!mounted) return null

  if (isLoading || !currentUser || !token) {
    return (
      <div className="tavern-loading-screen">
        <div className="tavern-loading-card">
          <div className="tavern-loading-icon">
            <Scroll className="scroll-icon" />
            <Loader2 className="spinner-icon animate-spin" />
          </div>
          <div className="tavern-loading-content">
            <h3 className="tavern-loading-title">🏰 Loading Tavern Messages</h3>
            <p className="tavern-loading-subtitle">📜 Preparing your communication scrolls...</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ConnectionStatus = () => (
    <div
      className={`tavern-connection-status ${isConnected ? "connected" : "disconnected"}`}
      role="status"
      aria-live="polite"
    >
      {isConnected ? <Wifi className="connection-icon" /> : <WifiOff className="connection-icon" />}
      {isConnected ? "🏰 Connected to Tavern" : "⚠️ Tavern Offline"}
    </div>
  )

  return (
    <div className="tavern-messages-page">
      <ConnectionStatus />
      <div className="tavern-messages-scrollable">
        <MessagingSystem
          currentUser={currentUser}
          token={token}
          showToast={showToast}
          onlineUsers={onlineUsers}
        />
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <AuthProvider>
      <MessagesPageContent />
    </AuthProvider>
  )
}
