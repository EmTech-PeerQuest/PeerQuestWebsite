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

  if (user === undefined || user === null) {
    // Show loading spinner or redirect if not authenticated
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 text-center text-lg text-red-600">
      Settings page is no longer available here.<br />
      Please access settings from your user profile modal.
    </div>
  );
}
