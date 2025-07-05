import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../lib/api";

const GoogleAuthButton = ({ onLoginSuccess }) => (
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
        // Save tokens and user info
        localStorage.setItem("jwt", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        // Call a callback or update context if provided
        if (onLoginSuccess) onLoginSuccess(res.data);
        // Full page reload after successful login
        window.location.reload();
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