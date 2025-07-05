<<<<<<< HEAD
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext';
=======
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
>>>>>>> Profile/Settings

export const metadata: Metadata = {
  title: 'PeerQuest',
  description: 'Created with v0',
  generator: 'v0.dev',
<<<<<<< HEAD
}
=======
};
>>>>>>> Profile/Settings

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <body>
        <AuthProvider>{children}</AuthProvider>
=======
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </GoogleOAuthProvider>
>>>>>>> Profile/Settings
      </body>
    </html>
  );
}
<<<<<<< HEAD


=======
>>>>>>> Profile/Settings
