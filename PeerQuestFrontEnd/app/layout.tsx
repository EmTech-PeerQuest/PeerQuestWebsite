
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { GoldBalanceProvider } from '@/context/GoldBalanceContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AudioProvider } from '@/context/audio-context';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProfileModalProvider } from './UserProfileModalProvider';

export const metadata: Metadata = {
  title: 'PeerQuest',
  description: 'Created with v0',
  generator: 'v0.dev',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body suppressHydrationWarning={true}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <LanguageProvider>
            <AudioProvider>
              <AuthProvider>
                <GoldBalanceProvider>
                  <UserProfileModalProvider>
                    {children}
                  </UserProfileModalProvider>
                </GoldBalanceProvider>
              </AuthProvider>
            </AudioProvider>
          </LanguageProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
