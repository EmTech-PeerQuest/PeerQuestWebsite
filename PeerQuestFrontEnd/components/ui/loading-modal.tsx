import React from "react";

export default function LoadingModal({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative flex flex-col items-center justify-center px-8 py-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#F4F0E6]/80 to-[#CDAA7D]/80 border border-[#8B75AA]/30">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-[#8B75AA] border-t-transparent animate-spin-slow bg-gradient-to-tr from-[#CDAA7D] to-[#8B75AA] opacity-80 shadow-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-extrabold text-[#8B75AA] drop-shadow-lg">🍺</span>
          </div>
        </div>
        <div className="text-xl font-bold text-[#2C1A1D] mb-1 tracking-wide drop-shadow">PeerQuest Tavern</div>
        <div className="text-[#8B75AA] text-base font-medium animate-pulse">{message}</div>
      </div>
    </div>
  );
}

// Add custom slow spin animation
// In your global CSS (e.g., globals.css or tailwind.config), add:
// .animate-spin-slow { animation: spin 1.5s linear infinite; }
