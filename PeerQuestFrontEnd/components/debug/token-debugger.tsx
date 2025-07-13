'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TokenDebugInfo {
  hasAccessToken: boolean
  hasRefreshToken: boolean
  accessTokenExpiry: string | null
  isAccessTokenExpired: boolean
}

/**
 * Debug component to check token status
 */
export function TokenDebugger() {
  const [tokenInfo, setTokenInfo] = useState<TokenDebugInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkTokens = () => {
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      let accessTokenExpiry = null
      let isAccessTokenExpired = false
      
      if (accessToken) {
        try {
          // Decode JWT token to check expiry (without verification)
          const base64Url = accessToken.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
          
          const decoded = JSON.parse(jsonPayload)
          accessTokenExpiry = new Date(decoded.exp * 1000).toISOString()
          isAccessTokenExpired = decoded.exp * 1000 < Date.now()
        } catch (e) {
          console.error('Failed to decode access token:', e)
        }
      }
      
      setTokenInfo({
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenExpiry,
        isAccessTokenExpired
      })
    }
    
    checkTokens()
    
    // Update every 5 seconds
    const interval = setInterval(checkTokens, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleClearTokens = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setTokenInfo(null)
    console.log('Tokens cleared')
  }

  const handleRefreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        alert('No refresh token available')
        return
      }

      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.access)
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh)
        }
        alert('Token refreshed successfully!')
        window.location.reload()
      } else {
        alert('Token refresh failed. Please try logging in again.')
      }
    } catch (error) {
      alert('Token refresh error. Please try again.')
    }
  }

  const handleTestAPI = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/users/settings/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert('API call successful!')
      } else {
        alert(`API call failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      alert('API call error. Please try again.')
    }
  }

  if (!tokenInfo) {
    return <div>Loading token info...</div>
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm text-xs z-50">
      <h3 className="font-bold mb-2">🔐 Token Debug Info</h3>
      
      <div className="space-y-1">
        <div>Access Token: {tokenInfo.hasAccessToken ? '✅' : '❌'}</div>
        <div>Refresh Token: {tokenInfo.hasRefreshToken ? '✅' : '❌'}</div>
        
        {tokenInfo.hasAccessToken && (
          <>
            <div>Expires: {tokenInfo.accessTokenExpiry}</div>
            <div>Expired: {tokenInfo.isAccessTokenExpired ? '❌' : '✅'}</div>
          </>
        )}
      </div>
      
      <div className="mt-3 space-x-2">
        <button
          onClick={handleRefreshToken}
          disabled={!tokenInfo.hasRefreshToken}
          className="bg-blue-600 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          Refresh
        </button>
        <button
          onClick={handleTestAPI}
          disabled={!tokenInfo.hasAccessToken}
          className="bg-green-600 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          Test API
        </button>
        <button
          onClick={handleClearTokens}
          className="bg-red-600 px-2 py-1 rounded text-xs"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
