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
  // Profile completion modal state
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  // Restore loginForm state (needed for login functionality)
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  // Real-time login error feedback
  useEffect(() => {
    const errors: Record<string, string> = {};
    if (loginForm.username && loginForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    if (loginForm.password && loginForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    setFormErrors((prev) => {
      let next = { ...prev, ...errors };
      // Only clear errors if fields are valid
      if (loginForm.username.length >= 3 && next.username) {
        const { username, ...rest } = next; next = rest;
      }
      if (loginForm.password.length >= 8 && next.password) {
        const { password, ...rest } = next; next = rest;
      }
      return next;
    });
  }, [loginForm.username, loginForm.password]);

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
  // Real-time registration error feedback
  useEffect(() => {
    const errors: Record<string, string> = {};
    if (registerForm.username && registerForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (registerForm.username && !/^[a-zA-Z0-9_]+$/.test(registerForm.username)) {
      errors.username = "Username can only contain letters, numbers, and underscores";
    }
    if (registerForm.email && !validateEmail(registerForm.email)) {
      errors.email = "Please enter a valid email";
    }
    if (registerForm.password && registerForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if ((registerForm.birthday.month && !registerForm.birthday.day) || (registerForm.birthday.day && !registerForm.birthday.month) || (registerForm.birthday.year && (!registerForm.birthday.month || !registerForm.birthday.day))) {
      errors.birthday = "Please enter your full birthday";
    }
    setFormErrors((prev) => {
      let next = { ...prev, ...errors };
      // Only clear errors if fields are valid
      if (registerForm.username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(registerForm.username) && next.username) {
        const { username, ...rest } = next; next = rest;
      }
      if (registerForm.email && validateEmail(registerForm.email) && next.email) {
        const { email, ...rest } = next; next = rest;
      }
      if (registerForm.password.length >= 8 && next.password) {
        const { password, ...rest } = next; next = rest;
      }
      if (registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword && next.confirmPassword) {
        const { confirmPassword, ...rest } = next; next = rest;
      }
      if (registerForm.birthday.month && registerForm.birthday.day && registerForm.birthday.year && next.birthday) {
        const { birthday, ...rest } = next; next = rest;
      }
      return next;
    });
  }, [registerForm.username, registerForm.email, registerForm.password, registerForm.confirmPassword, registerForm.birthday.month, registerForm.birthday.day, registerForm.birthday.year]);

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

    // Password validation - use PasswordInputWithStrength logic
    if (!registerForm.password) {
      errors.password = "Password is required"
    } else {
      // Fallback: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
      const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(registerForm.password);
      if (!isValid) {
        errors.password = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
      }
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
      // Show profile completion modal and hide auth modal
      setShowProfileCompletion(true);
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
    <>
      {showProfileCompletion ? (
        <ProfileCompletionModal
          isOpen={showProfileCompletion}
          onClose={() => setShowProfileCompletion(false)}
          onComplete={() => setShowProfileCompletion(false)}
        />
      ) : (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
            <div className="bg-[#F4F0E6] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                {/* LOGIN FORM */}
                {mode === "login" && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleLogin();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Username</label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.username ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                        value={loginForm.username}
                        onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                        autoComplete="username"
                      />
                      {formErrors.username && <div className="text-xs text-red-600 mt-1">{formErrors.username}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.password ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                          value={loginForm.password}
                          onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2 text-[#8B75AA]"
                          onClick={() => setShowPassword(v => !v)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {formErrors.password && <div className="text-xs text-red-600 mt-1">{formErrors.password}</div>}
                    </div>
                    <div className="flex items-center">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={loginForm.rememberMe}
                        onChange={e => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="rememberMe" className="text-sm text-[#2C1A1D]">Remember me</label>
                    </div>
                    <Button type="submit" className="w-full bg-[#8B75AA] text-white hover:bg-[#CDAA7D]">Login</Button>
                    <div className="flex justify-between text-xs mt-2">
                      <button type="button" className="text-[#8B75AA] hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
                      <button type="button" className="text-[#8B75AA] hover:underline" onClick={() => setMode("register")}>Need an account?</button>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-center">
                        <GoogleAuthButton />
                      </div>
                    </div>
                    <div className="mt-2">
                      {formErrors.auth &&
                        (formErrors.auth.toLowerCase().includes("verify") || formErrors.auth.toLowerCase().includes("not verified") || formErrors.auth.toLowerCase().includes("unverified")) &&
                        <ResendVerification email={loginForm.username} />
                      }
                    </div>
                  </form>
                )}
                {/* REGISTER FORM */}
                {mode === "register" && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleRegister();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Username</label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.username ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                        value={registerForm.username}
                        onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                        autoComplete="username"
                      />
                      {formErrors.username && <div className="text-xs text-red-600 mt-1">{formErrors.username}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Email</label>
                      <input
                        type="email"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.email ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                        value={registerForm.email}
                        onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                        autoComplete="email"
                      />
                      {formErrors.email && <div className="text-xs text-red-600 mt-1">{formErrors.email}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Password</label>
                      <PasswordInputWithStrength
                        password={registerForm.password}
                        onPasswordChange={val => setRegisterForm({ ...registerForm, password: val })}
                        username={registerForm.username}
                        email={registerForm.email}
                        placeholder="Enter your password"
                        className={formErrors.password ? 'border-red-400' : 'border-[#CDAA7D]'}
                        showToggle={true}
                        disabled={false}
                      />
                      {formErrors.password && <div className="text-xs text-red-600 mt-1">{formErrors.password}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.confirmPassword ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                          value={registerForm.confirmPassword}
                          onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2 text-[#8B75AA]"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {formErrors.confirmPassword && <div className="text-xs text-red-600 mt-1">{formErrors.confirmPassword}</div>}
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-[#2C1A1D]">Month</label>
                        <select
                          className={`w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.birthday ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                          value={registerForm.birthday.month}
                          onChange={e => setRegisterForm({ ...registerForm, birthday: { ...registerForm.birthday, month: e.target.value } })}
                        >
                          <option value="">Month</option>
                          {generateMonthOptions()}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-[#2C1A1D]">Day</label>
                        <select
                          className={`w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.birthday ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                          value={registerForm.birthday.day}
                          onChange={e => setRegisterForm({ ...registerForm, birthday: { ...registerForm.birthday, day: e.target.value } })}
                        >
                          <option value="">Day</option>
                          {generateDayOptions()}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-[#2C1A1D]">Year</label>
                        <select
                          className={`w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.birthday ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                          value={registerForm.birthday.year}
                          onChange={e => setRegisterForm({ ...registerForm, birthday: { ...registerForm.birthday, year: e.target.value } })}
                        >
                          <option value="">Year</option>
                          {generateYearOptions()}
                        </select>
                      </div>
                    </div>
                    {formErrors.birthday && <div className="text-xs text-red-600 mt-1">{formErrors.birthday}</div>}
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Gender</label>
                      <select
                        className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D]"
                        value={registerForm.gender}
                        onChange={e => setRegisterForm({ ...registerForm, gender: e.target.value as any })}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="agreeToTerms"
                        type="checkbox"
                        checked={registerForm.agreeToTerms}
                        onChange={e => setRegisterForm({ ...registerForm, agreeToTerms: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="agreeToTerms" className="text-sm text-[#2C1A1D]">I agree to the <a href="/terms" target="_blank" className="underline text-[#8B75AA]">Terms of Use</a></label>
                    </div>
                    {formErrors.agreeToTerms && <div className="text-xs text-red-600 mt-1">{formErrors.agreeToTerms}</div>}
                    <Button type="submit" className="w-full bg-[#8B75AA] text-white hover:bg-[#CDAA7D]">Register</Button>
                    <div className="flex justify-between text-xs mt-2">
                      <button type="button" className="text-[#8B75AA] hover:underline" onClick={() => setMode("login")}>Already have an account?</button>
                    </div>
                  </form>
                )}
                {/* FORGOT PASSWORD FORM */}
                {mode === "forgot" && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleForgotPassword();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-[#2C1A1D]">Email</label>
                      <input
                        type="email"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#CDAA7D] ${formErrors.email ? 'border-red-400' : 'border-[#CDAA7D]'}`}
                        value={forgotForm.email}
                        onChange={e => setForgotForm({ ...forgotForm, email: e.target.value })}
                        autoComplete="email"
                      />
                      {formErrors.email && <div className="text-xs text-red-600 mt-1">{formErrors.email}</div>}
                    </div>
                    <Button type="submit" className="w-full bg-[#8B75AA] text-white hover:bg-[#CDAA7D]">Send Reset Link</Button>
                    <div className="flex justify-between text-xs mt-2">
                      <button type="button" className="text-[#8B75AA] hover:underline" onClick={() => setMode("login")}>Back to login</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Add custom slow spin animation
// In your global CSS (e.g., globals.css or tailwind.config), add:
// .animate-spin-slow { animation: spin 1.5s linear infinite; }