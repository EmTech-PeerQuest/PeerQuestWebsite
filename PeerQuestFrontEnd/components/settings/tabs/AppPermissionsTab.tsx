import { Save } from "lucide-react";

export default function AppPermissionsTab() {
  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">App Permissions</h3>
      <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-6 text-center">
        <p className="text-lg mb-4">No connected applications.</p>
        <p className="text-sm text-[#F4F0E6]/70 mb-6">
          Connect third-party applications to enhance your PeerQuest Tavern
          experience.
        </p>
        <button className="px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors">
          Connect Application
        </button>
      </div>
    </div>
  );
}
