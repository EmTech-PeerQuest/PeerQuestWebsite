import React from 'react';

interface BanScreenProps {
  reason: string;
  expiresAt: string | null;
  onAppeal: () => void;
  onLogout: () => void;
}

export const BanScreen: React.FC<BanScreenProps> = ({ reason, expiresAt, onAppeal, onLogout }) => {
  const isPermanent = !expiresAt;
  // Defensive logout handler: always reloads if context fails
  const handleLogout = () => {
    try {
      console.log('[BanScreen] Logout button clicked');
      onLogout();
      setTimeout(() => {
        // Fallback: force reload if not redirected
        if (window.location.pathname === '/banned') {
          window.location.href = '/';
        }
      }, 1000);
    } catch (e) {
      window.location.href = '/';
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="bg-[#3B2326] rounded-xl shadow-2xl p-8 max-w-lg w-full text-center border-4 border-red-400 relative">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-400 text-white rounded-full px-6 py-2 text-lg font-bold shadow-lg">
          BANNED
        </div>
        <h1 className="text-2xl font-bold mb-2 text-[#F4F0E6] mt-8">Access Restricted</h1>
        <p className="mb-4 text-lg text-[#F4F0E6]">Your account has been banned from PeerQuest.</p>
        <div className="mb-4">
          <span className="block text-[#CDAA7D] text-lg font-semibold mb-1">Reason:</span>
          <span className="block text-[#F4F0E6] text-base italic">{reason}</span>
        </div>
        <div className="mb-4">
          {isPermanent ? (
            <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full font-semibold">Permanent Ban</span>
          ) : (
            <span className="inline-block bg-yellow-400 text-[#2C1A1D] px-3 py-1 rounded-full font-semibold">
              Temporary Ban &bull; Expires: {new Date(expiresAt!).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={onAppeal}
            className="px-6 py-2 bg-[#CDAA7D] text-[#2C1A1D] rounded hover:bg-[#B89A6D] font-semibold shadow"
          >
            Appeal Ban
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-400 text-white rounded hover:bg-red-500 font-semibold shadow"
          >
            Log Out
          </button>
        </div>
        <div className="mt-6 text-[#CDAA7D] text-sm opacity-80">
          If you believe this is a mistake, you may appeal your ban. For urgent issues, contact support@peerquest.com.
        </div>
      </div>
    </div>
  );
};
