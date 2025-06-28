'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  useEffect(() => {
    if (code) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code
      }, window.location.origin)
      window.close()
    } else if (error) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error
      }, window.location.origin)
      window.close()
    }
  }, [code, error])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          {code ? 'Authenticating...' : 'Authentication Error'}
        </h1>
        <p>
          {code ? 'Please wait while we authenticate your account.' : error}
        </p>
      </div>
    </div>
  )
}