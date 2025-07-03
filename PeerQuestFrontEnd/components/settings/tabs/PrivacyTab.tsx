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
          <h4 className="text-lg font-bold mb-3">Profile Visibility</h4>
          <label className="block text-sm font-medium mb-2">Show Birthday</label>
          <input
            type="checkbox"
            checked={privacyForm.showBirthday}
            onChange={e => setPrivacyForm((prev: any) => ({ ...prev, showBirthday: e.target.checked }))}
          /> Show birthday on profile
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Show Gender</label>
          <input
            type="checkbox"
            checked={privacyForm.showGender}
            onChange={e => setPrivacyForm((prev: any) => ({ ...prev, showGender: e.target.checked }))}
          /> Show gender on profile
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Show Email</label>
          <input
            type="checkbox"
            checked={privacyForm.showEmail}
            onChange={e => setPrivacyForm((prev: any) => ({ ...prev, showEmail: e.target.checked }))}
          /> Show email on profile
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Profile Visibility</label>
          <select
            value={privacyForm.profileVisibility}
            onChange={e => setPrivacyForm((prev: any) => ({ ...prev, profileVisibility: e.target.value }))}
            className="w-full p-2 border rounded shadow"
          >
            <option value="everyone">Everyone</option>
            <option value="friends">Friends</option>
            <option value="noone">No one</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Message Privacy</label>
          <select
            value={privacyForm.messagePrivacy}
            onChange={e => setPrivacyForm((prev: any) => ({ ...prev, messagePrivacy: e.target.value }))}
            className="w-full p-2 border rounded shadow"
          >
            <option value="everyone">Everyone</option>
            <option value="friends">Friends</option>
            <option value="noone">No one</option>
          </select>
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
