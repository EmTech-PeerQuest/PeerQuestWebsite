import { Save } from "lucide-react";
import { useState } from "react";

async function updateUserProfile(data: any) {
  const res = await fetch("/api/user/profile/", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err.errors ? err.errors[0] : "Failed to update profile.";
  }
  return await res.json();
}

async function deleteUserAccount() {
  const res = await fetch("/api/user/profile/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err.errors ? err.errors[0] : "Failed to delete account.";
  }
  return true;
}

export default function AccountTab({
  accountForm,
  setAccountForm,
  user
}: any) {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        displayName: accountForm.displayName,
        username: accountForm.username,
        email: accountForm.email,
        bio: accountForm.bio,
        birthday: accountForm.birthday,
        gender: accountForm.gender,
        location: accountForm.location,
        socialLinks: accountForm.socialLinks,
        settings: {
          language: accountForm.language,
          theme: accountForm.theme,
        },
      });
      alert("Account settings saved successfully!");
    } catch (err: any) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteUserAccount();
      alert("Account deleted successfully.");
      // Do not redirect, just stay on the page
    } catch (err: any) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">Account Info</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
              value={accountForm.displayName}
              placeholder="Enter your display name"
              onChange={e => setAccountForm((prev: any) => ({ ...prev, displayName: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
              value={accountForm.username}
              placeholder="Enter your username"
              onChange={e => setAccountForm((prev: any) => ({ ...prev, username: e.target.value }))}
            />
          </div>
          <p className="text-xs text-[#CDAA7D]/70 mt-1">Previous usernames: {user?.username}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <div className="flex items-center">
            <input
              type="email"
              className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
              value={accountForm.email}
              placeholder="Enter your email address"
              onChange={e => setAccountForm((prev: any) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded">Verified</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] h-20 md:h-24 resize-none text-sm"
            value={accountForm.bio}
            placeholder="Tell us about yourself"
            onChange={e => setAccountForm((prev: any) => ({ ...prev, bio: e.target.value }))}
          />
        </div>
        <div>
          <h4 className="text-lg font-bold mb-3">Personal</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Birthday</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.birthday}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, birthday: e.target.value }))}
              />
              <div className="flex items-center mt-1">
                <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded">Verified</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Gender (optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`py-2 px-4 border ${accountForm.gender === "male" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "male" }))}
                >
                  <span className="mr-2">♂</span>MALE
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 border ${accountForm.gender === "female" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "female" }))}
                >
                  <span className="mr-2">♀</span>FEMALE
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.location}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, location: e.target.value }))}
                placeholder="Enter your location"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                  value={accountForm.language}
                  onChange={e => setAccountForm((prev: any) => ({ ...prev, language: e.target.value }))}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                  value={accountForm.theme}
                  onChange={e => setAccountForm((prev: any) => ({ ...prev, theme: e.target.value }))}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-3">Social Networks</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Facebook</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.socialLinks.facebook}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                placeholder="e.g. www.facebook.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Twitter</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.socialLinks.twitter}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                placeholder="e.g. @handle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">YouTube</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.socialLinks.youtube}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                placeholder="e.g. www.youtube.com/channel/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Twitch</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.socialLinks.twitch}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, twitch: e.target.value } }))}
                placeholder="e.g. www.twitch.tv/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">GitHub</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.socialLinks.github}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, github: e.target.value } }))}
                placeholder="e.g. github.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.socialLinks.linkedin}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))}
                placeholder="e.g. linkedin.com/in/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.socialLinks.website}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                placeholder="e.g. www.yourwebsite.com"
              />
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center disabled:opacity-60"
          >
            <Save size={16} className="mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
        <div className="mt-10 border-t border-[#CDAA7D]/40 pt-8">
          <h4 className="text-lg font-bold mb-3 text-red-400">Delete Account</h4>
          <p className="mb-4 text-sm text-[#F4F0E6]/80">
            <span className="font-semibold text-red-400">Warning:</span> This action is <span className="font-bold">irreversible</span> and will permanently delete your account and all associated data. To confirm, please type your username below and click <span className="font-semibold">Delete Account</span>.
          </p>
          <input
            type="text"
            className="w-full px-3 py-2 mb-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-red-400 text-sm"
            placeholder={`Type your username (${user?.username}) to confirm`}
            value={accountForm.deleteConfirm || ""}
            onChange={e => setAccountForm((prev: any) => ({ ...prev, deleteConfirm: e.target.value }))}
          />
          <button
            onClick={() => {
              if (accountForm.deleteConfirm === user?.username) {
                handleDelete();
              } else {
                alert("Please type your username exactly to confirm account deletion.");
              }
            }}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
