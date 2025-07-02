"use client"

import { useEffect } from "react"

interface ToastProps {
  message: string
  type: string
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return <div className={`toast ${type}`}>{message}</div>
}

/*
Add to your CSS (e.g., globals.css):
.toast.brown {
  background: #7c5a36;
  color: #fff;
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
*/
