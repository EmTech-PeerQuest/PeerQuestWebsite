'use client';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

export default function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();

  return (
    <GoogleLogin
      onSuccess={credentialResponse => {
        if (credentialResponse.credential) {
          loginWithGoogle(credentialResponse.credential);
        }
      }}
      onError={() => console.error('Google login failed')}
    />
  );
}
