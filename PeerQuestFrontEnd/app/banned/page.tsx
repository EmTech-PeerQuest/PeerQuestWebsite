"use client";
import { BanScreen } from '@/components/ban/BanScreen';
import { BanAppealForm } from '@/components/ban/BanAppealForm';
import { useState } from 'react';

export default function BannedPage() {
  let banInfo = null;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('ban_info');
    if (stored) {
      try {
        banInfo = JSON.parse(stored);
      } catch {}
    }
  }
  const [showAppeal, setShowAppeal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const handleAppeal = async (email: string, reason: string, files: File[] = []) => {
    setSubmitting(true);
    setError(undefined);
    try {
      const API_BASE = "http://localhost:8000";
      const formData = new FormData();
      formData.append("email", email);
      formData.append("message", reason);
      files.forEach((file, idx) => {
        formData.append("files", file);
      });
      const res = await fetch(`${API_BASE}/api/users/ban-appeal/submit/`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        let err, rawErr;
        try { rawErr = await res.text(); err = JSON.parse(rawErr); } catch { err = rawErr; }
        setError((err && err.detail) || err || "Failed to submit appeal");
        setSubmitting(false);
        return;
      }
      setShowAppeal(false);
      alert('Appeal submitted! The admin team will review your request.');
    } catch (e: any) {
      setError(e?.message || 'Failed to submit appeal.');
    } finally {
      setSubmitting(false);
    }
  };
  if (!banInfo) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-[#2C1A1D] text-[#F4F0E6] p-8">No ban information found.</div>;
  }
  return (
    <div>
      <BanScreen
        reason={banInfo.reason}
        expiresAt={banInfo.expiresAt}
        onAppeal={() => setShowAppeal(true)}
        onLogout={() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
        }}
      />
      {showAppeal && (
        <BanAppealForm 
          onSubmit={handleAppeal} 
          submitting={submitting} 
          error={error}
          onClose={() => setShowAppeal(false)}
        />
      )}
    </div>
  );
}
