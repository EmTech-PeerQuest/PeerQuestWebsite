export default function ThemedLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F0E6]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#8B75AA] border-opacity-60 mb-6"></div>
      <div className="text-2xl font-bold text-[#2C1A1D] tracking-wide mb-2">PeerQuest Tavern</div>
      <div className="text-[#8B75AA] text-lg font-medium">Loading your adventure...</div>
    </div>
  );
}
