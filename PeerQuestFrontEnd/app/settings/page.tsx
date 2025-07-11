"use client";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Settings } from "@/components/settings/settings";
import { AuthGuard } from "@/components/auth/AuthGuard";

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

  return (
    <AuthGuard redirectTo="/login" requireAuth={true}>
      <div className="min-h-screen bg-[#2D1B69]">
        <Settings />
        {toast && (
          <div className={`fixed top-4 right-4 p-4 rounded shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white z-50`}>
            {toast.message}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
