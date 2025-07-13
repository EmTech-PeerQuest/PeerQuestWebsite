"use client"

import { useState } from "react"
import { AlertCircle, Mail } from "lucide-react"
import { resendVerificationEmail } from "@/lib/api/auth"
import { toast } from "@/hooks/use-toast"

interface ResendVerificationProps {
  email?: string
  onSuccess?: () => void
}

export function ResendVerification({ email: initialEmail, onSuccess }: ResendVerificationProps) {
  const [email, setEmail] = useState(initialEmail || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleResend = async () => {
    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      await resendVerificationEmail(email)
      setMessage("Verification email sent! Please check your inbox.")
      toast({
        title: "Email Sent!",
        description: "Please check your inbox for the verification link.",
        variant: "default",
      })
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to send verification email. Please try again."
      setMessage(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4 max-w-md mx-auto">
      <div className="flex items-center mb-3">
        <Mail className="h-5 w-5 text-[#8B75AA] mr-2" />
        <h3 className="text-lg font-semibold text-[#2C1A1D]">Resend Verification Email</h3>
      </div>
      
      <p className="text-[#8B75AA] mb-4 text-sm">
        Enter your email address to receive a new verification link.
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#2C1A1D] mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]"
            placeholder="Enter your email address"
          />
        </div>

        {message && (
          <div className={`flex items-center p-2 rounded ${
            message.includes("sent") || message.includes("success") 
              ? "bg-green-100 border border-green-200 text-green-700" 
              : "bg-red-100 border border-red-200 text-red-700"
          }`}>
            <AlertCircle size={14} className="mr-2" />
            <span className="text-sm">{message}</span>
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={isLoading}
          className="w-full bg-[#8B75AA] text-white py-2 px-4 rounded font-medium hover:bg-[#7A6699] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Sending..." : "Resend Verification Email"}
        </button>
      </div>
    </div>
  )
}
