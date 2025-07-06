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

  // Debug modal state
  useEffect(() => {
    console.log('🔍 Modal state changed:', { isOpen, mode, authLoading, hasErrors: Object.keys(formErrors).length > 0 });
  }, [isOpen, mode, authLoading, formErrors]);

  // Prevent modal from closing if there are form errors (safety net)
  useEffect(() => {
    if (!isOpen && Object.keys(formErrors).length > 0) {
      console.warn('🔍 Modal was closed but there are form errors! This should not happen.');
    }
  }, [isOpen, formErrors]);

  // Prevent modal from closing while processing login
  useEffect(() => {
    if (!isOpen && isProcessingLogin) {
      console.warn('🔍 Modal was closed while processing login! This should not happen.');
    }
  }, [isOpen, isProcessingLogin]);

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

    console.log('🔍 Validating register form:', registerForm);

    // Enhanced username validation matching backend logic
    if (!registerForm.username || registerForm.username.trim() === "") {
      errors.username = "Username is required"
      console.log('🔍 Username validation failed:', registerForm.username);
    } else if (registerForm.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters"
      console.log('🔍 Username too short:', registerForm.username.trim().length);
    } else if (registerForm.username.trim().length > 20) {
      errors.username = "Username must be 20 characters or less"
      console.log('🔍 Username too long:', registerForm.username.trim().length);
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerForm.username.trim())) {
      errors.username = "Username can only contain letters, numbers, and underscores"
      console.log('🔍 Username contains invalid characters:', registerForm.username.trim());
    } else if (/^\d+$/.test(registerForm.username.trim())) {
      errors.username = "Username cannot be numbers only"
      console.log('🔍 Username is numbers only:', registerForm.username.trim());
    } else if (/(.)\1{3,}/.test(registerForm.username.trim())) {
      errors.username = "Username cannot have more than 3 repeating characters in a row"
      console.log('🔍 Username has too many repeating characters:', registerForm.username.trim());
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
          console.log('🔍 Username contains inappropriate word:', word, 'in normalized:', normalized);
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
          console.log('🔍 Username contains reserved word:', word, 'in normalized:', normalized);
          break;
        }
      }
    }

    // Email validation
    if (!registerForm.email || registerForm.email.trim() === "") {
      errors.email = "Email is required"
      console.log('🔍 Email validation failed:', registerForm.email);
    } else if (!validateEmail(registerForm.email.trim())) {
      errors.email = "Please enter a valid email"
      console.log('🔍 Email format invalid:', registerForm.email.trim());
    }

    // Password validation - simplified since we have real-time feedback
    if (!registerForm.password) {
      errors.password = "Password is required"
      console.log('🔍 Password validation failed:', registerForm.password);
    } else if (!validatePassword(registerForm.password)) {
      errors.password = "Please create a stronger password"
      console.log('🔍 Password validation failed:', registerForm.password.length);
    }

    // Confirm password validation
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
      console.log('🔍 Confirm password validation failed:', registerForm.confirmPassword);
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
      console.log('🔍 Passwords do not match:', { password: registerForm.password, confirmPassword: registerForm.confirmPassword });
    }

    // Birthday validation
    console.log('🔍 Birthday validation:', {
      month: registerForm.birthday.month,
      day: registerForm.birthday.day,
      year: registerForm.birthday.year,
      monthEmpty: !registerForm.birthday.month,
      dayEmpty: !registerForm.birthday.day,
      yearEmpty: !registerForm.birthday.year
    });

    if (!registerForm.birthday.month || !registerForm.birthday.day || !registerForm.birthday.year ||
        registerForm.birthday.month === "" || registerForm.birthday.day === "" || registerForm.birthday.year === "") {
      errors.birthday = "Please enter your full birthday"
      console.log('🔍 Birthday validation failed');
    }

    // Terms validation
    if (!registerForm.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the Terms of Use"
      console.log('🔍 Terms agreement validation failed:', registerForm.agreeToTerms);
    }

    console.log('🔍 Final validation errors:', errors);
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
    console.log('🔍 handleLogin called', { event: e?.type, mode });
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔍 preventDefault and stopPropagation called');
    }
    if (validateLoginForm()) {
      console.log('🔍 Form validation passed, starting login');
      setIsProcessingLogin(true) // Mark that we're processing login
      setAuthLoading(true)
      setFormErrors({})
      
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        // Set a timeout to prevent hanging
        timeoutId = setTimeout(() => {
          console.log('🔍 Login timeout - resetting loading state');
          setAuthLoading(false);
          setFormErrors({ auth: "Login request timed out. Please try again." });
        }, 15000); // 15 second timeout
        
        console.log('🔍 Calling onLogin with credentials');
        await onLogin({
          username: loginForm.username,
          password: loginForm.password,
          rememberMe: loginForm.rememberMe,
        })
        console.log('🔍 Login successful');
        
        // Clear timeout if successful
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Only close modal or redirect if login was successful
        // The parent component should handle this via the onLogin callback
      } catch (err: any) {
        // Clear timeout if error occurred
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        console.log('🔍 Login failed with error:', err);
        // Prevent any default actions that might cause a refresh
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        // Check if it's an email verification error
        if (err?.response?.data?.verification_required || 
            err?.message?.toLowerCase().includes('verify') ||
            err?.message?.toLowerCase().includes('verification')) {
          setFormErrors({ 
            auth: "Please verify your email address before logging in. Check your inbox for the verification email, or enter your email below to resend it."
          });
          setShowResendVerification(true); // Show resend verification component
        } else {
          // Extract error message from different possible error structures
          let errorMessage = "Login failed. Please try again.";
          
          if (err?.message) {
            errorMessage = err.message;
          } else if (err?.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err?.response?.data?.message) {
            errorMessage = err.response.data.message;
          }
          
          setFormErrors({ auth: errorMessage });
          setShowResendVerification(false); // Hide resend verification component
        }
        console.log('🔍 Error set in modal, should stay open');
        
        // Explicitly prevent any page refresh or redirect
        return false;
      } finally {
        // Always clear timeout and reset loading state
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setIsProcessingLogin(false) // Mark that we're done processing
        setAuthLoading(false)
        console.log('🔍 Login process finished, loading set to false');
      }
    } else {
      console.log('🔍 Form validation failed');
    }
  }

  const handleRegister = async (e?: React.FormEvent) => {
    console.log('🔍 handleRegister called');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateRegisterForm()) {
      console.log('🔍 Register form validation passed');
      setAuthLoading(true)
      setFormErrors({})
      try {
        // Format birthday as YYYY-MM-DD for backend
        let formattedBirthday = null;
        if (registerForm.birthday.year && registerForm.birthday.month && registerForm.birthday.day) {
          formattedBirthday = `${registerForm.birthday.year}-${registerForm.birthday.month.padStart(2, '0')}-${registerForm.birthday.day.padStart(2, '0')}`;
        }
        
        console.log('🔍 Formatted birthday:', formattedBirthday);
        
        await onRegister({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword,
          birthday: formattedBirthday,
          gender: registerForm.gender || null,
        })
        
        console.log('🔍 Registration completed successfully');
        // Registration was successful - the parent component will handle closing the modal and showing success message
        
      } catch (err: any) {
        console.log('🔍 Registration error:', err);
        console.log('🔍 Full error object:', err);
        
        // The API layer already handles error parsing and provides clean messages
        const errorMessage = err?.message || "Registration failed. Please try again.";
        
        // Check if this is a password-related error
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
    } else {
      console.log('🔍 Register form validation failed');
    }
  }

  const handleForgotPassword = async () => {
    if (validateForgotForm()) {
      console.log('🔍 Forgot password form validation passed');
      setAuthLoading(true);
      setFormErrors({});
      
      try {
        console.log('🔍 Sending forgot password request for email:', forgotForm.email);
        await forgotPassword(forgotForm.email);
        console.log('🔍 Forgot password request successful');
        
        // Show success message
        setFormErrors({ 
          auth: `Password reset email sent to ${forgotForm.email}. Please check your inbox and follow the instructions to reset your password.`
        });
        
        // Clear the form
        setForgotForm({ email: "" });
        
      } catch (err: any) {
        console.log('🔍 Forgot password error:', err);
        // The API layer already handles error parsing and provides clean messages
        const errorMessage = err?.message || "Failed to send password reset email. Please try again.";
        setFormErrors({ auth: errorMessage });
      } finally {
        setAuthLoading(false);
      }
    } else {
      console.log('🔍 Forgot password form validation failed');
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
          // Only close if the click is directly on the backdrop, not during text selection, and user is not actively interacting
          if (e.target === e.currentTarget && !window.getSelection()?.toString() && !userIsInteracting) {
            onClose();
          }
        }}
        onMouseDown={(e) => {
          // Prevent modal from closing during text selection
          if (e.target !== e.currentTarget) {
            e.stopPropagation();
          }
        }}
      >
        <div 
          className="bg-[#F4F0E6] rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Prevent any mouse events from bubbling up to the backdrop
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            // Prevent any mouse events from bubbling up to the backdrop
            e.stopPropagation();
          }}
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
              // Only set to false if focus is leaving the entire form area
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
                console.log('🔍 Form submitted');
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Form submission prevented');
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
                        console.log('🔍 Username field keydown:', e.key);
                        if (e.key === "Enter") {
                          console.log('🔍 Enter pressed on username field');
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
                          console.log('🔍 Password field keydown:', e.key);
                          if (e.key === "Enter") {
                            console.log('🔍 Enter pressed on password field');
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
                      console.log('🔍 Login button clicked');
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
                          // Store tokens and user info from backend response
                          if (data?.access) localStorage.setItem('access_token', data.access);
                          if (data?.refresh) localStorage.setItem('refresh_token', data.refresh);
                          // If backend returned a user object, update context and redirect
                          if (data?.user) {
                            // Google login always acts like "remember me" - store refresh token in localStorage
                            onClose();
                            // For Google auth, always refresh the page to ensure proper state sync
                            window.location.reload();
                          } else if (data?.access && typeof window !== 'undefined') {
                            // Instead of forcing a reload, close modal and refresh for Google auth
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

                  {/* Show resend verification component if needed */}
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">USERNAME</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border ${
                      formErrors.username ? "border-red-500" : "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                    placeholder="CHOOSE A USERNAME"
                    value={registerForm.username}
                    onChange={(e) => {
                      console.log('🔍 Username changed to:', e.target.value);
                      setRegisterForm((prev) => ({ ...prev, username: e.target.value }))
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRegister(e);
                      }
                    }}
                  />
                  {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">EMAIL</label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border ${
                      formErrors.email ? "border-red-500" : 
                      registerForm.email && !validateEmail(registerForm.email) ? "border-orange-500" :
                      registerForm.email && validateEmail(registerForm.email) ? "border-green-500" :
                      "border-[#CDAA7D]"
                    } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                    placeholder="ENTER YOUR EMAIL"
                    value={registerForm.email}
                    onChange={(e) => {
                      const emailValue = e.target.value;
                      setRegisterForm((prev) => ({ ...prev, email: emailValue }));
                      
                      // Clear email error when user starts typing a valid email
                      if (formErrors.email && emailValue && validateEmail(emailValue)) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRegister(e);
                      }
                    }}
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
                    onPasswordChange={(password) => setRegisterForm((prev) => ({ ...prev, password }))}
                    username={registerForm.username}
                    email={registerForm.email}
                    placeholder="CREATE A PASSWORD"
                    className={`${
                      formErrors.password ? "border-red-500" : "border-[#CDAA7D]"
                    } bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                  />
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRegister(e);
                        }
                      }}
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
                      onChange={(e) => {
                        console.log('🔍 Birthday month changed to:', e.target.value);
                        setRegisterForm((prev) => ({
                          ...prev,
                          birthday: { ...prev.birthday, month: e.target.value },
                        }));
                      }}
                    >
                      <option value="">Month</option>
                      {generateMonthOptions()}
                    </select>

                    <select
                      className={`px-3 py-2 border ${
                        formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"
                      } rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                      value={registerForm.birthday.day}
                      onChange={(e) => {
                        console.log('🔍 Birthday day changed to:', e.target.value);
                        setRegisterForm((prev) => ({
                          ...prev,
                          birthday: { ...prev.birthday, day: e.target.value },
                        }));
                      }}
                    >
                      <option value="">Day</option>
                      {generateDayOptions()}
                    </select>

                    <select
                      className={`px-3 py-2 border ${
                        formErrors.birthday ? "border-red-500" : "border-[#CDAA7D]"
                      } rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]`}
                      value={registerForm.birthday.year}
                      onChange={(e) => {
                        console.log('🔍 Birthday year changed to:', e.target.value);
                        setRegisterForm((prev) => ({
                          ...prev,
                          birthday: { ...prev.birthday, year: e.target.value },
                        }));
                      }}
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

                    <button
                      type="button"
                      className={`py-2 border ${
                        registerForm.gender === "prefer-not-to-say" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#2C1A1D]"
                      } rounded font-medium transition-colors flex items-center justify-center text-xs`}
                      onClick={() => setRegisterForm((prev) => ({ ...prev, gender: "prefer-not-to-say" }))}
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
                      className={`w-4 h-4 text-[#8B75AA] border ${
                        formErrors.agreeToTerms ? "border-red-500" : "border-[#CDAA7D]"
                      } rounded focus:ring-[#8B75AA]`}
                      checked={registerForm.agreeToTerms}
                      onChange={(e) => {
                        console.log('🔍 Terms agreement changed to:', e.target.checked);
                        setRegisterForm((prev) => ({ ...prev, agreeToTerms: e.target.checked }))
                      }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRegister(e);
                    }}
                    className="w-full bg-[#8B75AA] text-white py-3 rounded font-medium hover:bg-[#7A6699] transition-colors"
                    type="button"
                  >
                    REGISTER
                  </button>
                </div>
              </div>
            )}

            {mode === "forgot" && (
              <div className="space-y-4">
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleForgotPassword();
                      }
                    }}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div className="bg-[#8B75AA]/10 border border-[#8B75AA]/20 rounded-lg p-4">
                  <p className="text-sm text-[#8B75AA] leading-relaxed">
                    ENTER YOUR EMAIL ADDRESS AND WE'LL SEND YOU A LINK TO RESET YOUR PASSWORD.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login")
                      setFormErrors({})
                      setShowResendVerification(false)
                    }}
                    className="flex-1 border border-[#CDAA7D] py-3 rounded font-medium text-[#2C1A1D] hover:bg-[#F4F0E6] transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={authLoading}
                    className="flex-1 bg-[#8B75AA] text-white py-3 rounded font-medium hover:bg-[#7A6699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? "SENDING..." : "SEND RESET LINK"}
                  </button>
                </div>
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

// Add custom slow spin animation
// In your global CSS (e.g., globals.css or tailwind.config), add:
// .animate-spin-slow { animation: spin 1.5s linear infinite; }
