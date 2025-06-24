'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { FcGoogle } from 'react-icons/fc'

export const GoogleAuthButton = () => {
  const { loginWithGoogle } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    try {
      // Open Google OAuth window
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2.5
      
      const authWindow = window.open(
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email`,
        'GoogleAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Listen for message from popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          loginWithGoogle(event.data.code)
          authWindow?.close()
          window.removeEventListener('message', messageListener)
          router.push('/profile')
        }
      }

      window.addEventListener('message', messageListener)
    } catch (error) {
      console.error('Google auth error:', error)
    }
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 py-2 px-4 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
    >
      <FcGoogle size={20} />
      Continue with Google
    </button>
  )
}