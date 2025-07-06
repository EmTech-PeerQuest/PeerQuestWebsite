"use client";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Settings } from "@/components/settings/settings";

export default function SettingsPage() {
  const { user } = useAuth();
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);

  // Dummy updateSettings function (replace with real API call)
  const updateSettings = (settings: any) => {
    setToast({ message: "Settings updated!", type: "success" });
  };

  const showToast = (message: string, type?: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (user === undefined) {
    // Show loading spinner while auth is being determined
    return (
      <div className="bg-[#F4F0E6] min-h-screen flex items-center justify-center">
        <div className="text-[#8B75AA] text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (user === null) {
    // User is not authenticated, redirect to login
    return (
      <div className="bg-[#F4F0E6] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2C1A1D] mb-4">Authentication Required</h1>
          <p className="text-[#8B75AA] mb-6">Please log in to access your settings.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-[#8B75AA] text-white px-6 py-2 rounded-lg hover:bg-[#7A6B99] transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F0E6] min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C1A1D] to-[#8B75AA] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-[#CDAA7D] mt-2">Manage your account preferences and settings</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Settings />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast.message}
        </div>
      )}
    </div>
  );
}
