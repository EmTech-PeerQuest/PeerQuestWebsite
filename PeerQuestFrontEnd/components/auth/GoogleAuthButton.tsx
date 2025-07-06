import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../lib/api";

interface GoogleAuthButtonProps {
  onLoginSuccess?: (data: any) => void;
  onShowProfileCompletion?: () => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onLoginSuccess, onShowProfileCompletion }) => (
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      try {
        if (!credentialResponse.credential) {
          throw new Error("No Google credential received.");
        }
        const res = await api.post(
          "google-login-callback/",
          { credential: credentialResponse.credential }
        );
        
        // Save tokens and user info with new token names
        localStorage.setItem("access_token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // Check if user needs to complete profile (no birthday or gender)
        const user = res.data.user;
        const needsProfileCompletion = !user.birthday || !user.gender;
        
        // Call appropriate callback
        if (onLoginSuccess) onLoginSuccess(res.data);
        
        if (needsProfileCompletion && onShowProfileCompletion) {
          onShowProfileCompletion();
        } else {
          // Full page reload after successful login (only for Google auth)
          window.location.reload();
        }
      } catch (err) {
        console.error("Google login failed:", err);
        alert("Google login failed. Please try again.");
      }
    }}
    onError={() => {
      console.error("Google login failed: Google returned an error.");
      alert("Google login failed. Please try again.");
    }}
    useOneTap
  />
);

export default GoogleAuthButton;