import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../lib/api";

interface GoogleAuthButtonProps {
  onLoginSuccess?: (data: any) => void;
  onShowProfileCompletion?: () => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onLoginSuccess, onShowProfileCompletion }) => {
  
  // Function to clear any conflicting auth state
  const clearAuthState = () => {
    console.log('🔍 Clearing any existing auth state...');
    
    // Clear our app's stored tokens
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("jwt");
    
    // Clear session storage
    sessionStorage.clear();
    
    console.log('✅ Auth state cleared');
  };

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        console.log('🔍 Google login success callback triggered');
        console.log('🔍 Credential response:', credentialResponse);
        console.log('🔍 API base URL:', process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
        
        // Clear any existing auth state first
        clearAuthState();
        
        try {
          if (!credentialResponse.credential) {
            console.error('❌ No Google credential received');
            throw new Error("No Google credential received.");
          }
          
          console.log('🔍 Sending credential to backend...');
          console.log('🔍 Request URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/google-login-callback/`);
          
          let res;
          try {
            res = await api.post(
              "google-login-callback/",
              { credential: credentialResponse.credential }
            );
          } catch (error: any) {
            // If backend returns a ban (403) or error, handle gracefully
            const data = error?.response?.data || {};
            if (data.banned || error?.response?.status === 403) {
              // Try to extract the most informative ban message
              let banMsg = data.detail || data.ban_reason || data.error || "Your account is banned.";
              if (data.ban_expires_at) {
                banMsg += ` (Ban expires: ${data.ban_expires_at})`;
              }
              alert(banMsg);
              window.location.href = "/banned";
              return;
            }
            // Other errors
            throw error;
          }

          console.log('✅ Backend response:', res.data);

          // Save tokens and user info with new token names
          if (res.data.access) {
            localStorage.setItem("access_token", res.data.access);
            console.log('✅ Access token saved');
          }

          if (res.data.refresh) {
            localStorage.setItem("refresh_token", res.data.refresh);
            console.log('✅ Refresh token saved');
          }

          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            console.log('✅ User data saved');
          }

          // Check if user needs to complete profile (no birthday or gender)
          const user = res.data.user;
          const needsProfileCompletion = !user.birthday || !user.gender;

          console.log('🔍 Needs profile completion:', needsProfileCompletion);

          // Call appropriate callback
          if (onLoginSuccess) {
            console.log('🔍 Calling onLoginSuccess callback');
            onLoginSuccess(res.data);
          }

          if (needsProfileCompletion && onShowProfileCompletion) {
            console.log('🔍 Calling onShowProfileCompletion callback');
            onShowProfileCompletion();
          } else {
            console.log('🔍 Reloading page...');
            // Full page reload after successful login (only for Google auth)
            window.location.reload();
          }
        } catch (error: any) {
          console.error('❌ API request failed:', error);
          console.error('❌ Error response:', error.response);
          console.error('❌ Error status:', error.response?.status);
          console.error('❌ Error data:', error.response?.data);
          
          // If it's a 400/401/403 error, try clearing all auth data and retrying
          if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
            console.log('🔍 Auth error detected, clearing all stored data...');
            
            // Force clear all browser storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear cookies by setting them to expire
            document.cookie.split(";").forEach((c) => {
              const eqPos = c.indexOf("=");
              const name = eqPos > -1 ? c.substr(0, eqPos) : c;
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
            });
            
            console.log('🔍 All storage cleared, please try again');
            alert('Authentication conflict detected. All cached data has been cleared. Please try logging in again.');
            
            // Refresh the page to ensure clean state
            window.location.reload();
            return;
          }
          
          console.error("❌ Google login failed:", error);
          alert("Google login failed. Please try again.");
        }
      }}
      onError={() => {
        console.error("❌ Google login failed: Google returned an error.");
        alert("Google login failed. Please try again.");
      }}
      useOneTap
      use_fedcm_for_prompt={false}
    />
  );
};

export default GoogleAuthButton;
