'use client'

import { useCallback, useRef, useState } from 'react'
import axios, { AxiosError } from 'axios'

interface APIRequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  headers?: Record<string, string>
  preventDuplicates?: boolean
  retryCount?: number
  retryDelay?: number
}

interface APIError {
  message: string
  code?: string
  status?: number
}

/**
 * Custom hook for making API requests with built-in spam protection,
 * error handling, and authentication management
 */
export function useAPIRequest() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)
  const activeRequestsRef = useRef<Set<string>>(new Set())
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const getRequestKey = (config: APIRequestConfig) => {
    return `${config.method || 'GET'}-${config.url}-${JSON.stringify(config.data || {})}`
  }

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const makeRequest = useCallback(async (config: APIRequestConfig) => {
    const requestKey = getRequestKey(config)
    
    // Prevent duplicate requests if specified
    if (config.preventDuplicates && activeRequestsRef.current.has(requestKey)) {
      return null
    }

    // Clear any existing retry timeout for this request
    const existingTimeout = retryTimeoutsRef.current.get(requestKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      retryTimeoutsRef.current.delete(requestKey)
    }

    activeRequestsRef.current.add(requestKey)
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios({
        method: config.method || 'GET',
        url: config.url,
        data: config.data,
        headers: {
          ...getAuthHeaders(),
          ...config.headers,
        },
      })

      return response.data
    } catch (err) {
      const axiosError = err as AxiosError
      const responseData = axiosError.response?.data as any
      const errorMessage = responseData?.message || 
                          responseData?.error || 
                          axiosError.message || 
                          'An unexpected error occurred'

      const apiError: APIError = {
        message: errorMessage,
        code: responseData?.code || axiosError.code,
        status: axiosError.response?.status,
      }

      // Handle authentication errors
      if (axiosError.response?.status === 401) {
        // Token might be expired, try to refresh
        try {
          await refreshToken()
          
          // Retry the request with new token
          const retryResponse = await axios({
            method: config.method || 'GET',
            url: config.url,
            data: config.data,
            headers: {
              ...getAuthHeaders(),
              ...config.headers,
            },
          })
          return retryResponse.data
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          apiError.message = 'Session expired. Please log in again.'
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }

      // Handle server errors with retry logic
      if (axiosError.response?.status && axiosError.response.status >= 500 && (config.retryCount || 0) > 0) {
        const retryDelay = config.retryDelay || 1000
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(async () => {
            try {
              const result = await makeRequest({
                ...config,
                retryCount: (config.retryCount || 0) - 1,
              })
              resolve(result)
            } catch (retryError) {
              reject(retryError)
            }
          }, retryDelay)
          
          retryTimeoutsRef.current.set(requestKey, timeout)
        })
      }

      setError(apiError)
      throw apiError
    } finally {
      activeRequestsRef.current.delete(requestKey)
      setIsLoading(false)
    }
  }, [getAuthHeaders])

  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
        refresh: refreshToken,
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.data?.access) {
        localStorage.setItem('access_token', response.data.access)
        
        // Update refresh token if a new one is provided
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh)
        }
      } else {
        throw new Error('Invalid refresh response - no access token')
      }
    } catch (error: any) {
      // If refresh fails, clear all tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      // Check if it's a network error vs auth error
      if (error.response?.status === 401) {
        throw new Error('Refresh token is invalid or expired')
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Token refresh timeout - please check your connection')
      } else {
        throw new Error('Token refresh failed - please try logging in again')
      }
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    makeRequest,
    isLoading,
    error,
    clearError,
  }
}

/**
 * Hook for user info API calls with built-in spam protection
 */
export function useUserInfo() {
  const { makeRequest, isLoading, error, clearError } = useAPIRequest()

  const fetchUserInfo = useCallback(async () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    return makeRequest({
      url: `${API_BASE_URL}/api/users/settings/`,
      method: 'GET',
      preventDuplicates: true,
      retryCount: 2,
      retryDelay: 1000,
    })
  }, [makeRequest])

  const updateUserInfo = useCallback(async (data: any) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    return makeRequest({
      url: `${API_BASE_URL}/api/users/settings/`,
      method: 'PUT',
      data,
      preventDuplicates: true,
      retryCount: 1,
      retryDelay: 1000,
    })
  }, [makeRequest])

  return {
    fetchUserInfo,
    updateUserInfo,
    isLoading,
    error,
    clearError,
  }
}
