"use client"

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthData {
  score: number
  strength: 'very_weak' | 'weak' | 'medium' | 'strong' | 'very_strong' | 'adequate_for_admin'
  message: string
  suggestions: string[]
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    symbols: boolean
    no_common: boolean
  }
  is_valid: boolean
}

interface PasswordInputProps {
  password: string
  onPasswordChange: (password: string) => void
  username?: string
  email?: string
  placeholder?: string
  showToggle?: boolean
  className?: string
  disabled?: boolean
}

const PasswordStrengthIndicator: React.FC<{ 
  strengthData: PasswordStrengthData | null 
  isLoading: boolean 
}> = ({ strengthData, isLoading }) => {
  if (!strengthData && !isLoading) return null

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'very_weak': return 'bg-red-500'
      case 'weak': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-blue-500'
      case 'very_strong': return 'bg-green-500'
      case 'adequate_for_admin': return 'bg-purple-500'
      default: return 'bg-gray-300'
    }
  }

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'very_weak': return 'Very Weak'
      case 'weak': return 'Weak'
      case 'medium': return 'Medium'
      case 'strong': return 'Strong'
      case 'very_strong': return 'Very Strong'
      case 'adequate_for_admin': return 'Admin Ready'
      default: return 'Unknown'
    }
  }

  const getStrengthPercentage = (score: number) => {
    return Math.min((score / 100) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="mt-2">
        <div className="h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-blue-500 rounded-full animate-pulse" style={{ width: '50%' }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Checking password strength...</p>
      </div>
    )
  }

  if (!strengthData) return null

  return (
    <div className="mt-2 space-y-3">
      {/* Main Message */}
      <div className={cn(
        "text-sm font-medium",
        strengthData.strength === 'very_weak' && "text-red-600",
        strengthData.strength === 'weak' && "text-orange-600",
        strengthData.strength === 'medium' && "text-yellow-600",
        strengthData.strength === 'strong' && "text-blue-600",
        strengthData.strength === 'very_strong' && "text-green-600",
        strengthData.strength === 'adequate_for_admin' && "text-purple-600"
      )}>
        {strengthData.message}
      </div>

      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out",
              getStrengthColor(strengthData.strength)
            )}
            style={{ width: `${getStrengthPercentage(strengthData.score)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{getStrengthText(strengthData.strength)}</span>
          <span>{strengthData.score}/100</span>
        </div>
      </div>

      {/* Quick Requirements Check */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className={cn(
          "flex items-center gap-2",
          strengthData.requirements.length ? "text-green-600" : "text-gray-500"
        )}>
          {strengthData.requirements.length ? 
            <Check className="w-4 h-4" /> : 
            <X className="w-4 h-4" />
          }
          <span>Length</span>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          strengthData.requirements.uppercase ? "text-green-600" : "text-gray-500"
        )}>
          {strengthData.requirements.uppercase ? 
            <Check className="w-4 h-4" /> : 
            <X className="w-4 h-4" />
          }
          <span>Uppercase</span>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          strengthData.requirements.lowercase ? "text-green-600" : "text-gray-500"
        )}>
          {strengthData.requirements.lowercase ? 
            <Check className="w-4 h-4" /> : 
            <X className="w-4 h-4" />
          }
          <span>Lowercase</span>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          strengthData.requirements.numbers ? "text-green-600" : "text-gray-500"
        )}>
          {strengthData.requirements.numbers ? 
            <Check className="w-4 h-4" /> : 
            <X className="w-4 h-4" />
          }
          <span>Numbers</span>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          strengthData.requirements.symbols ? "text-green-600" : "text-gray-500"
        )}>
          {strengthData.requirements.symbols ? 
            <Check className="w-4 h-4" /> : 
            <X className="w-4 h-4" />
          }
          <span>Symbols</span>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          strengthData.requirements.no_common ? "text-green-600" : "text-gray-500"
        )}>
          {strengthData.requirements.no_common ? 
            <Check className="w-4 h-4" /> : 
            <X className="w-4 h-4" />
          }
          <span>Unique</span>
        </div>
      </div>

      {/* Helpful Suggestions */}
      {strengthData.suggestions.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700">Suggestions:</div>
          <ul className="text-sm text-gray-600 space-y-1">
            {strengthData.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export const PasswordInputWithStrength: React.FC<PasswordInputProps> = ({
  password,
  onPasswordChange,
  username = '',
  email = '',
  placeholder = "Enter your password",
  showToggle = true,
  className = '',
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [strengthData, setStrengthData] = useState<PasswordStrengthData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Debounced password strength check
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (!password) {
      setStrengthData(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE}/api/users/password-strength-check/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password,
            username,
            email
          })
        })

        const data = await response.json()
        
        if (data.success) {
          setStrengthData(data.data)
        } else {
          console.error('Password strength check failed:', data.error)
          setStrengthData(null)
        }
      } catch (error) {
        console.error('Error checking password strength:', error)
        setStrengthData(null)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    setDebounceTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [password, username, email])

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            showToggle ? "pr-10" : "",
            !strengthData?.is_valid && strengthData?.suggestions.length && strengthData.suggestions.length > 0 
              ? "border-orange-300 focus:ring-orange-500 focus:border-orange-500"
              : strengthData?.strength === 'very_strong' || strengthData?.strength === 'strong'
              ? "border-green-300 focus:ring-green-500 focus:border-green-500"
              : "border-gray-300",
            className
          )}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={disabled}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {password && (
        <PasswordStrengthIndicator 
          strengthData={strengthData} 
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

export default PasswordInputWithStrength
