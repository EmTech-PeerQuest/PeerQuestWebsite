"use client"

import { useState, useEffect } from "react"
import { X, Eye, EyeOff, AlertCircle } from "lucide-react"
import LoadingModal from "@/components/ui/loading-modal"
import GoogleAuthButton from "./GoogleAuthButton"
import ProfileCompletionModal from "@/components/auth/ProfileCompletionModal"
import { ResendVerification } from "@/components/auth/resend-verification"
import { forgotPassword } from "@/lib/api/auth"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from 'next/navigation'
import { PasswordInputWithStrength } from "@/components/ui/password-input-with-strength";
import { Button } from "@/components/ui/button"
import { useClickSound } from "@/hooks/use-click-sound"
import { useAudioContext } from "@/context/audio-context"

interface AuthModalProps {
  isOpen: boolean
  mode: "login" | "register" | "forgot"
  setMode: (mode: "login" | "register" | "forgot") => void
  onClose: () => void
  onLogin: (credentials: { username: string; password: string }) => void
  onRegister: (userData: { username: string; email: string; password: string; confirmPassword: string }) => void
  onForgotPassword?: (email: string) => void
}

export function AuthModal({ isOpen, mode, setMode, onClose, onLogin, onRegister, onForgotPassword }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    rememberMe: false,
  })

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthday: {
      month: "",
      day: "",
      year: "",
    },
    gender: "" as "" | "male" | "female" | "other" | "prefer-not-to-say",
    agreeToTerms: false,
  })

  const [forgotForm, setForgotForm] = useState({
    email: "",
  })

  const { refreshUser } = useAuth();
  const router = useRouter();

  if (!isOpen) return null

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    // Basic client-side validation - detailed validation happens in real-time
    return password.length >= 8
  }

  const validateUsername = (username: string) => {
    if (!username) return false;
    
    // Basic length check
    if (username.length < 3 || username.length > 20) return false;
    
    // Only allow alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    
    // Don't allow numbers only
    if (/^\d+$/.test(username)) return false;
    
    // Don't allow excessive repeating characters
    if (/(.)\1{3,}/.test(username)) return false;
    
    // Basic leet speak prevention
    const leetMap: { [key: string]: string } = {
      '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g',
      'q': 'g', 'x': 'k', 'z': 's'
    };
    
    let normalized = username.toLowerCase();
    for (const [leet, normal] of Object.entries(leetMap)) {
      // Escape special regex characters in the leet character
      const escapedLeet = leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      normalized = normalized.replace(new RegExp(escapedLeet, 'g'), normal);
    }
    
    // Check for basic inappropriate words
    const inappropriateWords = ['admin', 'mod', 'staff', 'bot', 'test', 'null', 'fuck', 'shit', 'damn'];
    for (const word of inappropriateWords) {
      if (normalized.includes(word)) return false;
    }
    
    return true;
  }

  const validateLoginForm = () => {
    const errors: Record<string, string> = {}

    if (!loginForm.username) {
      errors.username = "Username is required"
    }

    if (!loginForm.password) {
      errors.password = "Password is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {}

    // Enhanced username validation matching backend logic
    if (!registerForm.username || registerForm.username.trim() === "") {
      errors.username = "Username is required"
    } else if (registerForm.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters"
    } else if (registerForm.username.trim().length > 20) {
      errors.username = "Username must be 20 characters or less"
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerForm.username.trim())) {
      errors.username = "Username can only contain letters, numbers, and underscores"
    } else if (/^\d+$/.test(registerForm.username.trim())) {
      errors.username = "Username cannot be numbers only"
    } else if (/(.)\1{3,}/.test(registerForm.username.trim())) {
      errors.username = "Username cannot have more than 3 repeating characters in a row"
    } else {
      // Enhanced leet speak and inappropriate content detection
      const leetMap: { [key: string]: string } = {
        '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g',
        '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't', '?': 'q', '(': 'c', ')': 'c',
        '*': 'a', '%': 'o', '^': 'a', '&': 'a', '#': 'h', '~': 'n', '=': 'e',
        'q': 'g', 'x': 'k', 'z': 's', 'vv': 'w', 'ii': 'u', 'rn': 'm'
      };
      
      const substitutionPatterns: { [key: string]: string } = {
        'qu': 'g', 'qg': 'gg', 'gq': 'gg', 'kw': 'qu', 'ks': 'x', 'ph': 'f',
        'uff': 'ough', 'vv': 'w', 'rn': 'm', 'nn': 'm', 'ii': 'u', 'oo': 'o',
        'qq': 'g', 'xx': 'x', 'zz': 's'
      };
      
      let normalized = registerForm.username.toLowerCase();
      
      // Apply substitution patterns multiple times
      for (let i = 0; i < 3; i++) {
        for (const [pattern, replacement] of Object.entries(substitutionPatterns)) {
          // Escape special regex characters in the pattern
          const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          normalized = normalized.replace(new RegExp(escapedPattern, 'g'), replacement);
        }
      }
      
      // Apply character substitutions multiple times
      for (let i = 0; i < 4; i++) {
        for (const [leet, normal] of Object.entries(leetMap)) {
          // Escape special regex characters in the leet character
          const escapedLeet = leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          normalized = normalized.replace(new RegExp(escapedLeet, 'g'), normal);
        }
      }
      
      // Direct q -> g replacement (ensure this is caught)
      normalized = normalized.replace(/q/g, 'g');
      
      // Check for inappropriate words
      const inappropriateWords = [
        'admin', 'mod', 'staff', 'bot', 'test', 'null', 'fuck', 'shit', 'damn', 'bitch',
        'ass', 'hell', 'crap', 'piss', 'cock', 'dick', 'pussy', 'tit', 'nigger', 'nigga',
        'fag', 'gay', 'homo', 'retard', 'rape', 'nazi', 'hitler', 'porn', 'sex', 'cum'
      ];
      
      for (const word of inappropriateWords) {
        if (normalized.includes(word)) {
          errors.username = "Username contains inappropriate content or leet speak substitutions"
          break;
        }
      }
      
      // Check for reserved words
      const reservedWords = [
        'admin', 'moderator', 'mod', 'staff', 'support', 'help', 'bot', 'system',
        'root', 'null', 'undefined', 'test', 'demo', 'guest', 'anonymous', 'anon',
        'api', 'www', 'mail', 'email', 'ftp', 'http', 'https', 'ssl', 'tls'
      ];
      
      for (const word of reservedWords) {
        if (normalized.includes(word)) {
          errors.username = `Username cannot contain reserved word '${word}'`
          break;
        }
      }
    }

    // Email validation
    if (!registerForm.email || registerForm.email.trim() === "") {
      errors.email = "Email is required"
    } else if (!validateEmail(registerForm.email.trim())) {
      errors.email = "Please enter a valid email"
    }

    // Password validation - simplified since we have real-time feedback
    if (!registerForm.password) {
      errors.password = "Password is required"
    } else if (!validatePassword(registerForm.password)) {
      errors.password = "Please create a stronger password"
    }

    // Confirm password validation
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    // Birthday validation
    if (!registerForm.birthday.month || !registerForm.birthday.day || !registerForm.birthday.year ||
        registerForm.birthday.month === "" || registerForm.birthday.day === "" || registerForm.birthday.year === "") {
      errors.birthday = "Please enter your full birthday"
    }

    // Terms validation
    if (!registerForm.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the Terms of Use"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateForgotForm = () => {
    const errors: Record<string, string> = {}

    if (!forgotForm.email) {
      errors.email = "Email is required"
    } else if (!validateEmail(forgotForm.email)) {
      errors.email = "Please enter a valid email"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = () => {
    if (validateLoginForm()) {
      onLogin({
        username: loginForm.username,
        password: loginForm.password,
      })
    }
  }

  const handleRegister = () => {
    if (validateRegisterForm()) {
      onRegister({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
      })
    }
  }

  const handleForgotPassword = () => {
    if (validateForgotForm() && onForgotPassword) {
      onForgotPassword(forgotForm.email)
    }
  }

  const generateMonthOptions = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    return months.map((month, index) => (
      <option key={month} value={String(index + 1).padStart(2, "0")}>
        {month}
      </option>
    ))
  }

  const generateDayOptions = () => {
    const days = []
    for (let i = 1; i <= 31; i++) {
      days.push(
        <option key={i} value={String(i).padStart(2, "0")}>
          {i}
        </option>,
      )
    }
    return days
  }

  const generateYearOptions = () => {
    const years = []
    const currentYear = new Date().getFullYear()

    for (let i = currentYear - 13; i >= currentYear - 100; i--) {
      years.push(
        <option key={i} value={i}>
          {i}
        </option>,
      )
    }
    return years
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#CDAA7D] px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-[#2C1A1D]">
            {mode === "login" ? "Enter the Tavern" : mode === "register" ? "Join the Tavern" : "Recover Your Password"}
          </h2>
          <button onClick={onClose} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs for Login/Register */}
        {mode !== "forgot" && (
          <div className="flex border-b border-[#CDAA7D]">
            <button
              onClick={() => {
                setMode("login")
                setFormErrors({})
              }}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                mode === "login" ? "text-[#2C1A1D] border-b-2 border-[#2C1A1D]" : "text-[#8B75AA] hover:text-[#2C1A1D]"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => {
                setMode("register")
                setFormErrors({})
              }}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                mode === "register"
                  ? "text-[#2C1A1D] border-b-2 border-[#2C1A1D]"
                  : "text-[#8B75AA] hover:text-[#2C1A1D]"
              }`}
            >
              REGISTER
            </button>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {formErrors.auth && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle size={16} className="mr-2" />
              <span>{formErrors.auth}</span>
            </div>
          )}

          {mode === "login" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">USERNAME</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border ${
                    formErrors.username ? "border-red-500" : "border-[#CDAA7D]"
                  } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                  placeholder="ENTER YOUR USERNAME"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                />
                {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-3 py-2 border ${
                      formErrors.password ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B75AA]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                  className="w-4 h-4 text-[#8B75AA] border-[#CDAA7D] rounded focus:ring-[#8B75AA]"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-[#2C1A1D]">
                  REMEMBER ME
                </label>
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-[#8B75AA] text-white py-3 rounded font-medium hover:bg-[#7A6699] transition-colors"
              >
                LOGIN
              </button>
              <div className="text-center">
                <button
                  onClick={() => {
                    setMode("forgot")
                    setFormErrors({})
                  }}
                  className="text-[#8B75AA] hover:underline text-sm"
                >
                  FORGOT PASSWORD?
                </button>
              </div>
              <div className="text-center text-[#8B75AA] text-sm">OR LOGIN WITH</div>
              <div className="flex w-full justify-center items-center mt-2">
                <GoogleAuthButton />
              </div>
            </>
          )}

          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">USERNAME</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border ${
                    formErrors.username ? "border-red-500" : "border-[#CDAA7D]"
                  } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                  placeholder="CHOOSE A USERNAME"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                />
                {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">EMAIL</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border ${
                    formErrors.email ? "border-red-500" : "border-[#CDAA7D]"
                  } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                  placeholder="ENTER YOUR EMAIL"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-3 py-2 border ${
                      formErrors.password ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                    placeholder="CREATE A PASSWORD"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B75AA]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">CONFIRM PASSWORD</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`w-full px-3 py-2 border ${
                      formErrors.confirmPassword ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                    placeholder="CONFIRM YOUR PASSWORD"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B75AA]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">BIRTHDAY</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className={`px-3 py-2 border ${
                      formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                    value={registerForm.birthday.month}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        birthday: { ...prev.birthday, month: e.target.value },
                      }))
                    }
                  >
                    <option value="">Month</option>
                    {generateMonthOptions()}
                  </select>

                  <select
                    className={`px-3 py-2 border ${
                      formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                    value={registerForm.birthday.day}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        birthday: { ...prev.birthday, day: e.target.value },
                      }))
                    }
                  >
                    <option value="">Day</option>
                    {generateDayOptions()}
                  </select>

                  <select
                    className={`px-3 py-2 border ${
                      formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                    value={registerForm.birthday.year}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        birthday: { ...prev.birthday, year: e.target.value },
                      }))
                    }
                  >
                    <option value="">Year</option>
                    {generateYearOptions()}
                  </select>
                </div>
                {formErrors.birthday && <p className="text-red-500 text-xs mt-1">{formErrors.birthday}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">GENDER (OPTIONAL)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`py-2 border ${
                      registerForm.gender === "male" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#2C1A1D]"
                    } rounded font-medium transition-colors flex items-center justify-center`}
                    onClick={() => setRegisterForm((prev) => ({ ...prev, gender: "male" }))}
                  >
                    <span className="mr-2">♂</span>
                    MALE
                  </button>

                  <button
                    type="button"
                    className={`py-2 border ${
                      registerForm.gender === "female" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#2C1A1D]"
                    } rounded font-medium transition-colors flex items-center justify-center`}
                    onClick={() => setRegisterForm((prev) => ({ ...prev, gender: "female" }))}
                  >
                    <span className="mr-2">♀</span>
                    FEMALE
                  </button>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className={`w-4 h-4 text-[#8B75AA] border ${
                      formErrors.agreeToTerms ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded focus:ring-[#8B75AA]`}
                    checked={registerForm.agreeToTerms}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, agreeToTerms: e.target.checked }))}
                  />
                </div>
                <label htmlFor="terms" className="ml-2 text-sm text-[#8B75AA]">
                  BY CLICKING SIGN UP, YOU ARE AGREEING TO THE <span className="underline">TERMS OF USE</span> AND{" "}
                  <span className="underline">PRIVACY POLICY</span>.
                </label>
              </div>
              {formErrors.agreeToTerms && <p className="text-red-500 text-xs">{formErrors.agreeToTerms}</p>}

              <button
                onClick={handleRegister}
                className="w-full bg-[#8B75AA] text-white py-3 rounded font-medium hover:bg-[#7A6699] transition-colors"
              >
                REGISTER
              </button>

              <div className="text-center text-[#8B75AA] text-sm">OR REGISTER WITH</div>
              <button className="w-full border border-[#CDAA7D] py-3 rounded font-medium text-[#2C1A1D] hover:bg-[#F4F0E6] transition-colors flex items-center justify-center gap-2">
                <span className="text-lg">G</span>
                <GoogleAuthButton/>
              </button>
            </>
          )}

          {mode === "forgot" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">EMAIL ADDRESS</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border ${
                    formErrors.email ? "border-red-500" : "border-[#CDAA7D]"
                  } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                  placeholder="ENTER YOUR REGISTERED EMAIL"
                  value={forgotForm.email}
                  onChange={(e) => setForgotForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <p className="text-sm text-[#8B75AA]">
                ENTER YOUR EMAIL ADDRESS AND WE'LL SEND YOU A LINK TO RESET YOUR PASSWORD.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMode("login")
                    setFormErrors({})
                  }}
                  className="flex-1 border border-[#CDAA7D] py-3 rounded font-medium text-[#2C1A1D] hover:bg-[#F4F0E6] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="flex-1 bg-[#8B75AA] text-white py-3 rounded font-medium hover:bg-[#7A6699] transition-colors"
                >
                  SEND RESET LINK
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Add custom slow spin animation
// In your global CSS (e.g., globals.css or tailwind.config), add:
// .animate-spin-slow { animation: spin 1.5s linear infinite; }