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
    // Clear our app's stored tokens
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("jwt");
    
    // Clear session storage
    sessionStorage.clear();
  };

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        // Clear any existing auth state first
        clearAuthState();
        
        try {
          if (!credentialResponse.credential) {
            throw new Error("No Google credential received.");
          }
          
          const res = await api.post(
            "google-login-callback/",
            { credential: credentialResponse.credential }
          );
          
          // Save tokens and user info with new token names
          if (res.data.access) {
            localStorage.setItem("access_token", res.data.access);
          }
          
          if (res.data.refresh) {
            localStorage.setItem("refresh_token", res.data.refresh);
          }
          
          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
          
          // Check if user needs to complete profile (no birthday or gender)
          const user = res.data.user;
          const needsProfileCompletion = !user.birthday || !user.gender;
          
          // Call appropriate callback
          if (onLoginSuccess) {
            onLoginSuccess(res.data);
          }
          
          if (needsProfileCompletion && onShowProfileCompletion) {
            onShowProfileCompletion();
          } else {
            // Full page reload after successful login (only for Google auth)
            window.location.reload();
          }
        } catch (error: any) {
          // If it's a 400/401/403 error, try clearing all auth data and retrying
          if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
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
            
            alert('Authentication conflict detected. All cached data has been cleared. Please try logging in again.');
            
            // Refresh the page to ensure clean state
            window.location.reload();
            return;
          }
          
          alert("Google login failed. Please try again.");
        }
      }}
      onError={() => {
        alert("Google login failed. Please try again.");
      }}
      useOneTap
    />
  );
};

export default GoogleAuthButton;
