"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { resetPasswordConfirm } from "@/lib/api/auth"
import { PasswordInputWithStrength } from "@/components/ui/password-input-with-strength"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validLink, setValidLink] = useState<boolean | null>(null)
  

  const searchParams = useSearchParams();
  const uid = searchParams?.get('uid') ?? null;
  const token = searchParams?.get('token') ?? null;

  useEffect(() => {
    // Check if we have the required parameters
    if (!uid || !token) {
      setValidLink(false)
      setError("Invalid password reset link. Please request a new password reset.")
    } else {
      setValidLink(true)
    }
  }, [uid, token])

  // Enhanced password validation logic from auth-modal.tsx
  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    // Add more checks as needed (e.g., complexity)
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Confirm password
    if (!confirmPassword) {
      setError("Please confirm your password");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!uid || !token) {
      setError("Invalid password reset link");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordConfirm(uid, token, password);
      setSuccess(true);
    } catch (err: any) {
      // Try to extract backend error details
      let msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      if (!msg || typeof msg !== 'string') msg = "Failed to reset password. Please try again.";
      // Map common backend errors to user-friendly messages
      if (msg.toLowerCase().includes("token")) {
        msg = "This password reset link is invalid or has expired. Please request a new password reset.";
      } else if (msg.toLowerCase().includes("user")) {
        msg = "User not found or invalid link.";
      } else if (msg.toLowerCase().includes("password")) {
        // Show backend password error, but keep it user-friendly
        msg = msg.replace(/password error:/i, "").trim();
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (validLink === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4F0E6] to-[#CDAA7D] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1A1D] mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4F0E6] to-[#CDAA7D] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1A1D] mb-4">Password Reset Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F0E6] to-[#CDAA7D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#8B75AA] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-[#2C1A1D] mb-2">Reset Your Password</h1>
          <p className="text-gray-600">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2C1A1D] mb-2">
              New Password
            </label>
            <PasswordInputWithStrength
              password={password}
              onPasswordChange={setPassword}
              username={""}
              email={""}
              placeholder="Enter your new password"
              className={`${error && error.toLowerCase().includes('password') ? 'border-red-500' : 'border-[#CDAA7D]'} bg-white text-[#2C1A1D] placeholder-gray-400 focus:outline-none focus:border-[#8B75AA]`}
            />
            {error && error.toLowerCase().includes('password') && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2C1A1D] mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className={`w-full px-4 py-3 border ${error && error.toLowerCase().includes('match') ? 'border-red-500' : 'border-[#CDAA7D]'} rounded-lg bg-white text-[#2C1A1D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B75AA] focus:border-transparent`}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && error.toLowerCase().includes('match') && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
            {!error && confirmPassword && password !== confirmPassword && (
              <p className="text-orange-500 text-xs mt-1">Passwords do not match</p>
            )}
            {!error && confirmPassword && password === confirmPassword && password.length >= 8 && (
              <p className="text-green-500 text-xs mt-1">✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              loading || !password || !confirmPassword
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
            }`}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-[#8B75AA] hover:text-[#7A6699] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
