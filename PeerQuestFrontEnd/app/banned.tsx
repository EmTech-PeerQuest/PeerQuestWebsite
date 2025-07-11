

import React, { useEffect, useState } from 'react';
import { BanScreen } from '@/components/ban/BanScreen';
import { BanAppealForm } from '@/components/ban/BanAppealForm';
import { Navbar } from '@/components/ui/navbar';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function BannedPage() {
  const [banInfo, setBanInfo] = useState<{ reason: string; expiresAt: string | null } | null>(null);
  const [showAppeal, setShowAppeal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [appealSuccess, setAppealSuccess] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('ban_info');
    if (stored) {
      setBanInfo(JSON.parse(stored));
    }
    // Listen for modal close event
    const closeListener = () => setShowAppeal(false);
    window.addEventListener('closeBanAppealModal', closeListener);
    return () => window.removeEventListener('closeBanAppealModal', closeListener);
  }, []);

  const handleAppeal = async (email: string, reason: string, files: File[]) => {
    setSubmitting(true);
    setError(undefined);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('message', reason);
      files.forEach((file) => {
        formData.append('files', file);
      });
      await api.post('users/ban-appeal/submit/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAppealSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to submit appeal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!banInfo) return null;

  return (
    <div className="min-h-screen bg-[#2C1A1D]">
      <Navbar
        activeSection="banned"
        setActiveSection={() => {}}
        handleLogout={logout}
        openAuthModal={() => {}}
        openGoldPurchaseModal={() => {}}
        openPostQuestModal={() => {}}
        openCreateGuildModal={() => {}}
      />
      <div className="flex flex-col items-center justify-center">
        <BanScreen
          reason={banInfo.reason}
          expiresAt={banInfo.expiresAt}
          onAppeal={() => setShowAppeal(true)}
          onLogout={logout}
        />
        {showAppeal && !appealSuccess && (
          <BanAppealForm onSubmit={handleAppeal} submitting={submitting} error={error} />
        )}
        {appealSuccess && (
          <div className="flex flex-col items-center mt-6 text-[#CDAA7D] font-semibold">
            Your appeal has been submitted. The admin team will review your request.
          </div>
        )}
      </div>
    </div>
  );
}
