'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

/**
 * Authentication guard component that checks if user is logged in
 * Redirects to login page if not authenticated
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/login', 
  requireAuth = true 
}: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return

      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      if (!accessToken && !refreshToken) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      if (!accessToken && refreshToken) {
        try {
          const response = await fetch('http://localhost:8000/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          })

          if (response.ok) {
            const data = await response.json()
            localStorage.setItem('access_token', data.access)
            if (data.refresh) {
              localStorage.setItem('refresh_token', data.refresh)
            }
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setIsAuthenticated(false)
          }
        } catch (error) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setIsAuthenticated(false)
        }
      } else {
        // We have an access token
        setIsAuthenticated(true)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#2D1B69] flex items-center justify-center">
        <div className="text-[#F4F0E6] text-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA] mx-auto mb-4"></div>
          Checking authentication...
        </div>
      </div>
    )
  }

  // Don't render children if auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#2D1B69] flex items-center justify-center">
        <div className="text-[#F4F0E6] text-lg">
          Redirecting to login...
        </div>
      </div>
    )
  }

  // Render children if authenticated or auth is not required
  return <>{children}</>
}

/**
 * Hook to check authentication status
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return

      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      setIsAuthenticated(!!(accessToken || refreshToken))
    }

    checkAuth()

    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  return { isAuthenticated }
}
