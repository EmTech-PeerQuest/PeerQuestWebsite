"use client"

import { useState } from "react"
import { X, Eye, EyeOff, AlertCircle } from "lucide-react"
<<<<<<< HEAD
=======
import LoadingModal from "@/components/ui/loading-modal"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"
import { useAuth } from "./auth-context"
import { useRouter } from 'next/navigation';
>>>>>>> Profile/Settings

interface AuthModalProps {
  isOpen: boolean
  mode: "login" | "register" | "forgot"
  setMode: (mode: "login" | "register" | "forgot") => void
  onClose: () => void
<<<<<<< HEAD
  onLogin: (credentials: { email: string; password: string }) => void
  onRegister: (userData: { username: string; email: string; password: string; confirmPassword: string }) => void
=======
  onLogin: (credentials: { username: string; password: string; rememberMe?: boolean }) => void
  onRegister: (userData: { 
    username: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
    birthday?: string | null;
    gender?: string | null;
  }) => void
>>>>>>> Profile/Settings
  onForgotPassword?: (email: string) => void
}

export function AuthModal({ isOpen, mode, setMode, onClose, onLogin, onRegister, onForgotPassword }: AuthModalProps) {
<<<<<<< HEAD
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [loginForm, setLoginForm] = useState({
    email: "",
=======
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [authLoading, setAuthLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({
    username: "",
>>>>>>> Profile/Settings
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

<<<<<<< HEAD
=======
  const { setUser } = useAuth();
  const router = useRouter();

>>>>>>> Profile/Settings
  if (!isOpen) return null

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const validateLoginForm = () => {
    const errors: Record<string, string> = {}

<<<<<<< HEAD
    if (!loginForm.email) {
      errors.email = "Email is required"
    } else if (!validateEmail(loginForm.email)) {
      errors.email = "Please enter a valid email"
=======
    if (!loginForm.username) {
      errors.username = "Username is required"
    } else if (loginForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters"
>>>>>>> Profile/Settings
    }

    if (!loginForm.password) {
      errors.password = "Password is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {}

    if (!registerForm.username) {
      errors.username = "Username is required"
    } else if (registerForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters"
    }

    if (!registerForm.email) {
      errors.email = "Email is required"
    } else if (!validateEmail(registerForm.email)) {
      errors.email = "Please enter a valid email"
    }

    if (!registerForm.password) {
      errors.password = "Password is required"
    } else if (!validatePassword(registerForm.password)) {
      errors.password = "Password must be at least 8 characters"
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (!registerForm.birthday.month || !registerForm.birthday.day || !registerForm.birthday.year) {
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

<<<<<<< HEAD
  const handleLogin = () => {
    if (validateLoginForm()) {
      onLogin({
        email: loginForm.email,
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
=======
  const handleLogin = async () => {
    if (validateLoginForm()) {
      setAuthLoading(true)
      setFormErrors({})
      try {
        await onLogin({
          username: loginForm.username,
          password: loginForm.password,
          rememberMe: loginForm.rememberMe,
        })
      } catch (err: any) {
        // Check if it's an email verification error
        if (err?.response?.data?.verification_required) {
          setFormErrors({ 
            auth: "Please verify your email address before logging in. Check your inbox for the verification email."
          });
        } else {
          setFormErrors({ auth: err?.message || "Login failed. Please try again." });
        }
      } finally {
        setAuthLoading(false)
      }
    }
  }

  const handleRegister = async () => {
    if (validateRegisterForm()) {
      setAuthLoading(true)
      setFormErrors({})
      try {
        // Format birthday as YYYY-MM-DD for backend
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
        // Robust error handling for duplicate registration
        let msg = err?.message || "Registration failed. Please try again.";
        // Helper to recursively extract all string messages from any value, including arrays of objects
        function extractMessages(val: any): string[] {
          if (!val) return [];
          if (typeof val === 'string') return [val];
          if (Array.isArray(val)) return val.flatMap(extractMessages);
          if (typeof val === 'object') {
            // If object has only string values, return them
            let strings: string[] = [];
            for (const v of Object.values(val)) {
              strings = strings.concat(extractMessages(v));
            }
            return strings;
          }
          return [];
        }
        if (err?.response?.data && typeof err.response.data === 'object') {
          const errorObj = err.response.data;
          console.log('Registration error object:', errorObj); // Debug: log backend error
          // Username duplicate
          const usernameErr = errorObj.username;
          if (
            (Array.isArray(usernameErr) && usernameErr.some((m: any) => typeof m === 'string' && m.toLowerCase().includes('already')))
            || (typeof usernameErr === 'string' && usernameErr.toLowerCase().includes('already'))
            || (typeof usernameErr === 'object' && JSON.stringify(usernameErr).toLowerCase().includes('already'))
          ) {
            setFormErrors({ auth: "That username is already taken. Please choose another." });
            return;
          }
          // Email duplicate
          const emailErr = errorObj.email;
          if (
            (Array.isArray(emailErr) && emailErr.some((m: any) => typeof m === 'string' && m.toLowerCase().includes('already')))
            || (typeof emailErr === 'string' && emailErr.toLowerCase().includes('already'))
            || (typeof emailErr === 'object' && JSON.stringify(emailErr).toLowerCase().includes('already'))
          ) {
            setFormErrors({ auth: "That email is already registered. Please use another or log in." });
            return;
          }
          // Recursively extract all string messages from errorObj, including nested arrays/objects
          const allMessages = extractMessages(errorObj);
          setFormErrors({ auth: allMessages.length ? allMessages.join('\n') : msg });
          return;
        }
        if (typeof msg === 'string' && msg.toLowerCase().includes("username") && msg.toLowerCase().includes("already")) {
          setFormErrors({ auth: "That username is already taken. Please choose another." });
        } else if (typeof msg === 'string' && msg.toLowerCase().includes("email") && msg.toLowerCase().includes("already")) {
          setFormErrors({ auth: "That email is already registered. Please use another or log in." });
        } else {
          setFormErrors({ auth: typeof msg === 'string' && msg ? msg : 'Registration failed. Please try again.' });
        }
      } finally {
        setAuthLoading(false)
      }
>>>>>>> Profile/Settings
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
<<<<<<< HEAD
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
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">EMAIL</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border ${
                    formErrors.email ? "border-red-500" : "border-[#CDAA7D]"
                  } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                  placeholder="ENTER YOUR EMAIL"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
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
              <button className="w-full border border-[#CDAA7D] py-3 rounded font-medium text-[#2C1A1D] hover:bg-[#F4F0E6] transition-colors flex items-center justify-center gap-2">
                <span className="text-lg">G</span>
                CONTINUE WITH GOOGLE
              </button>
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
                CONTINUE WITH GOOGLE
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
=======
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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin()
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
                        if (e.key === "Enter") handleLogin()
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
                <div className="my-4 w-full flex items-center justify-center">
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
                          router.push('/');
                        } else if (data?.access && typeof window !== 'undefined') {
                          // If only tokens, force reload to sync context
                          window.location.reload();
                        } else {
                          setFormErrors({ auth: "Google login failed. Please try again." });
                        }
                      } catch (err: any) {
                        setFormErrors({ auth: "Google login failed. Please try again." });
                      }
                    }}
                  />
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRegister()
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRegister()
                    }}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">PASSWORD</label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      className={`w-full px-3 py-2 border ${
                        formErrors.password ? "border-red-500" : "border-[#CDAA7D]"
                      } rounded bg-white text-[#2C1A1D] placeholder-[#8B75AA] focus:outline-none focus:border-[#8B75AA]`}
                      placeholder="CREATE A PASSWORD"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRegister()
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B75AA]"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRegister()
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
                  type="button"
                >
                  REGISTER
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
    </>
  )
}

// Add custom slow spin animation
// In your global CSS (e.g., globals.css or tailwind.config), add:
// .animate-spin-slow { animation: spin 1.5s linear infinite; }
>>>>>>> Profile/Settings
