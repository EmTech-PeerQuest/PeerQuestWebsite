import { Save } from "lucide-react";

export default function PrivacyTab({
  privacyForm,
  setPrivacyForm,
  savePrivacySettings
}: any) {
  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">Privacy & Content Restrictions</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-bold mb-3">Privacy Settings</h4>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Show Birthday on Profile</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Allow other adventurers to see your birthday on your public profile.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacyForm.showBirthday}
                    onChange={e => setPrivacyForm((prev: any) => ({ ...prev, showBirthday: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Show Gender on Profile</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Allow other adventurers to see your gender on your public profile.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacyForm.showGender}
                    onChange={e => setPrivacyForm((prev: any) => ({ ...prev, showGender: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Show Email on Profile</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Allow other adventurers to see your email on your public profile.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacyForm.showEmail}
                    onChange={e => setPrivacyForm((prev: any) => ({ ...prev, showEmail: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-3">Content Restrictions</h4>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Mature Content Filter</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Filter out quests and guilds that may contain mature content.
                </p>
              </div>
              <div className="flex-shrink-0">
                <select className="px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm">
                  <option value="strict">Strict</option>
                  <option value="moderate">Moderate</option>
                  <option value="off">Off</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Quest Visibility</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Control who can see the quests you've created.
                </p>
              </div>
              <div className="flex-shrink-0">
                <select className="px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm">
                  <option value="everyone">Everyone</option>
                  <option value="guild-members">Guild Members Only</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Profile Visibility</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">Control who can see your profile.</p>
              </div>
              <div className="flex-shrink-0">
                <select className="px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm">
                  <option value="everyone">Everyone</option>
                  <option value="guild-members">Guild Members Only</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={savePrivacySettings}
            className="w-full sm:w-auto px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
