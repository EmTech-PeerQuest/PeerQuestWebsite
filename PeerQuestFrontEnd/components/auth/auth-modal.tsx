"use client"

import { useState, useEffect } from "react"
import { X, Eye, EyeOff, AlertCircle } from "lucide-react"
import LoadingModal from "@/components/ui/loading-modal"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"
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
  onLogin: (credentials: { username: string; password: string; rememberMe?: boolean }) => void
  onRegister: (userData: { 
    username: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
    birthday?: string | null;
    gender?: string | null;
  }) => void
  onForgotPassword?: (email: string) => void
}

export function AuthModal({ isOpen, mode, setMode, onClose, onLogin, onRegister, onForgotPassword }: AuthModalProps) {
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [authLoading, setAuthLoading] = useState(false)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)
  const [isProcessingLogin, setIsProcessingLogin] = useState(false) // Track if we're in the middle of login
  const [userIsInteracting, setUserIsInteracting] = useState(false) // Track if user is actively interacting
  const [showResendVerification, setShowResendVerification] = useState(false) // Track if we need to show resend verification

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
      const escapedLeet = leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      normalized = normalized.replace(new RegExp(escapedLeet, 'g'), normal);
    }
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
    } else if (loginForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters"
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
      for (let i = 0; i < 3; i++) {
        for (const [pattern, replacement] of Object.entries(substitutionPatterns)) {
          const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          normalized = normalized.replace(new RegExp(escapedPattern, 'g'), replacement);
        }
      }
      for (let i = 0; i < 4; i++) {
        for (const [leet, normal] of Object.entries(leetMap)) {
          const escapedLeet = leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          normalized = normalized.replace(new RegExp(escapedLeet, 'g'), normal);
        }
      }
      normalized = normalized.replace(/q/g, 'g');
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
    if (!registerForm.email || registerForm.email.trim() === "") {
      errors.email = "Email is required"
    } else if (!validateEmail(registerForm.email.trim())) {
      errors.email = "Please enter a valid email"
    }
    if (!registerForm.password) {
      errors.password = "Password is required"
    } else if (!validatePassword(registerForm.password)) {
      errors.password = "Please create a stronger password"
    }
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }
    if (!registerForm.birthday.month || !registerForm.birthday.day || !registerForm.birthday.year ||
        registerForm.birthday.month === "" || registerForm.birthday.day === "" || registerForm.birthday.year === "") {
      errors.birthday = "Please enter your full birthday"
    }
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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateLoginForm()) {
      setIsProcessingLogin(true)
      setAuthLoading(true)
      setFormErrors({})
      let timeoutId: NodeJS.Timeout | null = null;
      try {
        timeoutId = setTimeout(() => {
          setAuthLoading(false);
          setFormErrors({ auth: "Login request timed out. Please try again." });
        }, 15000);
        await onLogin({
          username: loginForm.username,
          password: loginForm.password,
          rememberMe: loginForm.rememberMe,
        })
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      } catch (err: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (err?.response?.data?.verification_required || 
            err?.message?.toLowerCase().includes('verify') ||
            err?.message?.toLowerCase().includes('verification')) {
          setFormErrors({ 
            auth: "Please verify your email address before logging in. Check your inbox for the verification email, or enter your email below to resend it."
          });
          setShowResendVerification(true);
        } else {
          let errorMessage = "Login failed. Please try again.";
          if (err?.message) {
            errorMessage = err.message;
          } else if (err?.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err?.response?.data?.message) {
            errorMessage = err.response.data.message;
          }
          setFormErrors({ auth: errorMessage });
          setShowResendVerification(false);
        }
        return false;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setIsProcessingLogin(false)
        setAuthLoading(false)
      }
    }
  }

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateRegisterForm()) {
      setAuthLoading(true)
      setFormErrors({})
      try {
        let formattedBirthday = null;
        if (registerForm.birthday.year && registerForm.birthday.month && registerForm.birthday.day) {
          formattedBirthday = `${registerForm.birthday.year}-${registerForm.birthday.month.padStart(2, '0')}-${registerForm.birthday.day.padStart(2, '0')}`;
        }
        await onRegister({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword,
          birthday: formattedBirthday,
          gender: registerForm.gender || null,
        })
      } catch (err: any) {
        const errorMessage = err?.message || "Registration failed. Please try again.";
        if (errorMessage.includes('Password error:') || errorMessage.includes('password')) {
          setFormErrors({ password: errorMessage.replace('Password error: ', '') });
        } else if (errorMessage.includes('Username error:') || errorMessage.includes('username')) {
          setFormErrors({ username: errorMessage.replace('Username error: ', '') });
        } else if (errorMessage.includes('Email error:') || errorMessage.includes('email')) {
          setFormErrors({ email: errorMessage.replace('Email error: ', '') });
        } else {
          setFormErrors({ auth: errorMessage });
        }
      } finally {
        setAuthLoading(false)
      }
    }
  }

  const handleForgotPassword = async () => {
    if (validateForgotForm()) {
      setAuthLoading(true);
      setFormErrors({});
      try {
        await forgotPassword(forgotForm.email);
        setFormErrors({ 
          auth: `Password reset email sent to ${forgotForm.email}. Please check your inbox and follow the instructions to reset your password.`
        });
        setForgotForm({ email: "" });
      } catch (err: any) {
        const errorMessage = err?.message || "Failed to send password reset email. Please try again.";
        setFormErrors({ auth: errorMessage });
      } finally {
        setAuthLoading(false);
      }
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
      <option key={month} value={String(index + 1).padStart(2, "0")}>{month}</option>
    ))
  }

  const generateDayOptions = () => {
    const days = []
    for (let i = 1; i <= 31; i++) {
      days.push(
        <option key={i} value={String(i).padStart(2, "0")}>{i}</option>,
      )
    }
    return days
  }

  const generateYearOptions = () => {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let i = currentYear - 13; i >= currentYear - 100; i--) {
      years.push(
        <option key={i} value={i}>{i}</option>,
      )
    }
    return years
  }

  return (
    <>
      {/* Aesthetic loading overlay on top of modal */}
      {authLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative flex flex-col items-center justify-center px-8 py-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#F4F0E6]/80 to-[#CDAA7D]/80 border border-[#8B75AA]/30">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-[#8B75AA] border-t-transparent animate-spin-slow bg-gradient-to-tr from-[#CDAA7D] to-[#8B75AA] opacity-80 shadow-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-extrabold text-[#8B75AA] drop-shadow-lg">🍺</span>
              </div>
            </div>
            <div className="text-xl font-bold text-[#2C1A1D] mb-1 tracking-wide drop-shadow">PeerQuest Tavern</div>
            <div className="text-[#8B75AA] text-base font-medium animate-pulse">
              {mode === "login" ? "Logging in..." : mode === "register" ? "Registering..." : "Processing..."}
            </div>
          </div>
        </div>
      )}
      {/* Modal content (z-40 so loading overlay is above) */}
      <div 
        className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !window.getSelection()?.toString() && !userIsInteracting) {
            onClose();
          }
        }}
        onMouseDown={(e) => {
          if (e.target !== e.currentTarget) {
            e.stopPropagation();
          }
        }}
      >
        <div 
          className="bg-[#F4F0E6] rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => { e.stopPropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onMouseUp={(e) => { e.stopPropagation(); }}
        >
          {/* Header */}
          <div className="bg-[#CDAA7D] px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-bold text-[#2C1A1D]">
              {mode === "login" ? "Enter the Tavern" : mode === "register" ? "Join the Tavern" : "Recover Your Password"}
            </h2>
            <button onClick={onClose} type="button" className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
              <X size={20} />
            </button>
          </div>
          {/* Tabs for Login/Register */}
          {mode !== "forgot" && (
            <div className="flex border-b border-[#CDAA7D]">
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setFormErrors({})
                  setShowResendVerification(false)
                }}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  mode === "login" ? "text-[#2C1A1D] border-b-2 border-[#2C1A1D]" : "text-[#8B75AA] hover:text-[#2C1A1D]"
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register")
                  setFormErrors({})
                  setShowResendVerification(false)
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
          <div 
            className="p-6 space-y-5"
            onMouseEnter={() => setUserIsInteracting(true)}
            onMouseLeave={() => setUserIsInteracting(false)}
            onFocus={() => setUserIsInteracting(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setUserIsInteracting(false);
              }
            }}
          >
            {formErrors.auth && (
              <div className={`px-4 py-3 rounded flex items-center ${
                formErrors.auth.includes('sent') || formErrors.auth.includes('check your inbox')
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                <AlertCircle size={16} className="mr-2" />
                {formErrors.auth.includes('\n') ? (
                  <ul className="list-disc pl-4">
                    {formErrors.auth.split('\n').map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <span>{formErrors.auth}</span>
                )}
              </div>
            )}

            {mode === "login" && (
              <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}>
                <div className="space-y-4">
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogin(e);
                          return false;
                        }
                      }}
                    />
                    {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-2">PASSWORD</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        className={`w-full px-3 py-2 border ${
                          formErrors.password ? "border-red-500" : "border-[#CDAA7D]"
                        } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLogin(e);
                            return false;
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B75AA]"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                </div>

                <div className="mt-6 space-y-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogin(e);
                      return false;
                    }}
                    type="button"
                    className="w-full bg-[#8B75AA] text-white py-3 rounded font-medium hover:bg-[#7A6699] transition-colors"
                  >
                    LOGIN
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setMode("forgot")
                        setFormErrors({})
                        setShowResendVerification(false)
                      }}
                      type="button"
                      className="text-[#8B75AA] hover:underline text-sm"
                    >
                      FORGOT PASSWORD?
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#CDAA7D]"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-[#F4F0E6] text-[#8B75AA]">OR LOGIN WITH</span>
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-center">
                    <GoogleAuthButton
                      onLoginSuccess={async (data: any) => {
                        try {
                          if (data?.access) localStorage.setItem('access_token', data.access);
                          if (data?.refresh) localStorage.setItem('refresh_token', data.refresh);
                          if (data?.user) {
                            onClose();
                            window.location.reload();
                          } else if (data?.access && typeof window !== 'undefined') {
                            onClose();
                            window.location.reload();
                          } else {
                            setFormErrors({ auth: "Google login failed. Please try again." });
                          }
                        } catch (err: any) {
                          setFormErrors({ auth: "Google login failed. Please try again." });
                        }
                      }}
                      onShowProfileCompletion={() => {
                        onClose();
                        setShowProfileCompletion(true);
                      }}
                    />
                  </div>

                  {showResendVerification && (
                    <div className="mt-4">
                      <ResendVerification 
                        email={loginForm.username.includes('@') ? loginForm.username : ''}
                        onSuccess={() => {
                          setShowResendVerification(false);
                          setFormErrors({ auth: "Verification email sent! Please check your inbox and click the verification link, then try logging in again." });
                        }}
                      />
                    </div>
                  )}
                </div>
              </form>
            )}


            {mode === "register" && (
              <form onSubmit={e => { e.preventDefault(); e.stopPropagation(); handleRegister(e); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-2">USERNAME</label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border ${formErrors.username ? "border-red-500" : "border-[#CDAA7D]"} rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                      placeholder="CHOOSE A USERNAME"
                      value={registerForm.username}
                      onChange={e => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); handleRegister(e); } }}
                    />
                    {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-2">EMAIL</label>
                    <input
                      type="email"
                      className={`w-full px-3 py-2 border ${formErrors.email ? "border-red-500" : registerForm.email && !validateEmail(registerForm.email) ? "border-orange-500" : registerForm.email && validateEmail(registerForm.email) ? "border-green-500" : "border-[#CDAA7D]"} rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                      placeholder="ENTER YOUR EMAIL"
                      value={registerForm.email}
                      onChange={e => { const emailValue = e.target.value; setRegisterForm(prev => ({ ...prev, email: emailValue })); if (formErrors.email && emailValue && validateEmail(emailValue)) { setFormErrors(prev => { const newErrors = { ...prev }; delete newErrors.email; return newErrors; }); } }}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); handleRegister(e); } }}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    {!formErrors.email && registerForm.email && !validateEmail(registerForm.email) && (
                      <p className="text-orange-500 text-xs mt-1">Please enter a valid email address</p>
                    )}
                    {!formErrors.email && registerForm.email && validateEmail(registerForm.email) && (
                      <p className="text-green-500 text-xs mt-1">✓ Valid email format</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-2">PASSWORD</label>
                    <PasswordInputWithStrength
                      password={registerForm.password}
                      onPasswordChange={password => setRegisterForm(prev => ({ ...prev, password }))}
                      username={registerForm.username}
                      email={registerForm.email}
                      placeholder="CREATE A PASSWORD"
                      className={`${formErrors.password ? "border-red-500" : "border-[#CDAA7D]"} bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                    />
                    {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-2">CONFIRM PASSWORD</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={`w-full px-3 py-2 border ${formErrors.confirmPassword ? "border-red-500" : "border-[#CDAA7D]"} rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                        placeholder="CONFIRM YOUR PASSWORD"
                        value={registerForm.confirmPassword}
                        onChange={e => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); handleRegister(e); } }}
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
                        className={`px-3 py-2 border ${formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"} rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                        value={registerForm.birthday.month}
                        onChange={e => setRegisterForm(prev => ({ ...prev, birthday: { ...prev.birthday, month: e.target.value } }))}
                      >
                        <option value="">Month</option>
                        {generateMonthOptions()}
                      </select>
                      <select
                        className={`px-3 py-2 border ${formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"} rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                        value={registerForm.birthday.day}
                        onChange={e => setRegisterForm(prev => ({ ...prev, birthday: { ...prev.birthday, day: e.target.value } }))}
                      >
                        <option value="">Day</option>
                        {generateDayOptions()}
                      </select>
                      <select
                        className={`px-3 py-2 border ${formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"} rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                        value={registerForm.birthday.year}
                        onChange={e => setRegisterForm(prev => ({ ...prev, birthday: { ...prev.birthday, year: e.target.value } }))}
                      >
                        <option value="">Year</option>
                        {generateYearOptions()}
                      </select>
                    </div>
                    {formErrors.birthday && <p className="text-red-500 text-xs mt-1">{formErrors.birthday}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C1A1D] mb-2">GENDER (OPTIONAL)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        className={`py-2 border ${registerForm.gender === "male" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#2C1A1D]"} rounded font-medium transition-colors flex items-center justify-center`}
                        onClick={() => setRegisterForm(prev => ({ ...prev, gender: "male" }))}
                      >
                        <span className="mr-2">♂</span>
                        MALE
                      </button>
                      <button
                        type="button"
                        className={`py-2 border ${registerForm.gender === "female" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#2C1A1D]"} rounded font-medium transition-colors flex items-center justify-center`}
                        onClick={() => setRegisterForm(prev => ({ ...prev, gender: "female" }))}
                      >
                        <span className="mr-2">♀</span>
                        FEMALE
                      </button>
                      <button
                        type="button"
                        className={`py-2 border ${registerForm.gender === "prefer-not-to-say" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#2C1A1D]"} rounded font-medium transition-colors flex items-center justify-center text-xs`}
                        onClick={() => setRegisterForm(prev => ({ ...prev, gender: "prefer-not-to-say" }))}
                      >
                        <span className="mr-1">🤐</span>
                        PREFER NOT TO SAY
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="terms"
                        type="checkbox"
                        className={`w-4 h-4 text-[#8B75AA] border ${formErrors.agreeToTerms ? "border-red-500" : "border-[#CDAA7D]"} rounded focus:ring-[#8B75AA]`}
                        checked={registerForm.agreeToTerms}
                        onChange={e => setRegisterForm(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                      />
                    </div>
                    <label htmlFor="terms" className="ml-2 text-sm text-[#8B75AA] leading-relaxed">
                      BY CLICKING SIGN UP, YOU ARE AGREEING TO THE <span className="underline">TERMS OF USE</span> AND{" "}
                      <span className="underline">PRIVACY POLICY</span>.
                    </label>
                  </div>
                  {formErrors.agreeToTerms && <p className="text-red-500 text-xs">{formErrors.agreeToTerms}</p>}
                  <div className="pt-2">
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); handleRegister(e); }}
                      className="w-full bg-[#8B75AA] text-white py-3 rounded font-medium hover:bg-[#7A6699] transition-colors"
                      type="button"
                    >
                      REGISTER
                    </button>
                  </div>
                </div>
              </form>
            )}

            {mode === "forgot" && (
              <div className="space-y-4">
                {/* ...forgot password form fields as in the SearchUser version... */}
              </div>
            )}
          </div>
        </div>
      </div>
      <ProfileCompletionModal
        isOpen={showProfileCompletion}
        onClose={() => setShowProfileCompletion(false)}
        onComplete={() => {
          setShowProfileCompletion(false);
          window.location.reload();
        }}
      />
    </>
  )
}