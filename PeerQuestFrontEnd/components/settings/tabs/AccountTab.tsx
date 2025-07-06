"use client";

import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { ProfilePhotoUploader } from "@/components/ui/profile-photo-uploader";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Fetch user info and map backend fields to frontend state
export async function fetchUserInfo() {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error("No access token found. Please log in.");
    }
    
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Making request to:', `${API_BASE_URL}/api/users/settings/`);
    console.log('Token:', token.substring(0, 20) + '...');
    
    const res = await axios.get(`${API_BASE_URL}/api/users/settings/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
    
    const data = res.data;
    
    const mappedData = {
      displayName: data.display_name || "",
      username: data.username || "",
      email: data.email || "",
      bio: data.bio || "",
      birthday: data.birthday || "",
      gender: data.gender || "",
      location: data.location || "",
      socialLinks: data.social_links || {},
      settings: data.settings || {},
      avatarUrl: data.avatar_url || data.avatar_data || "",
      preferredLanguage: data.preferred_language || "",
      timezone: data.timezone || "",
      notificationPreferences: data.notification_preferences || {},
      privacySettings: data.privacy_settings || {},
    };
    
    console.log('Mapped data:', mappedData);
    console.log('Birthday value:', data.birthday, 'Type:', typeof data.birthday);
    console.log('Gender value:', data.gender, 'Type:', typeof data.gender);
    
    return mappedData;
  } catch (err: any) {
    console.error('fetchUserInfo error:', err);
    console.error('Error response:', err.response?.data);
    console.error('Error status:', err.response?.status);
    throw new Error("Failed to fetch user info");
  }
}

async function updateUserProfile(data: any) {
  try {
    const token = localStorage.getItem('access_token');
    const res = await axios.patch(
      `${API_BASE_URL}/api/users/settings/`,
      data,
      {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err: any) {
    console.error('Update profile error:', err);
    console.error('Response data:', err.response?.data);
    console.error('Response status:', err.response?.status);
    
    if (err.response && err.response.data) {
      // Handle different error formats
      if (err.response.data.errors) {
        throw err.response.data.errors[0];
      }
      if (err.response.data.detail) {
        throw err.response.data.detail;
      }
      if (typeof err.response.data === 'object') {
        // Handle field-specific errors
        const fieldErrors = [];
        for (const [field, errors] of Object.entries(err.response.data)) {
          if (Array.isArray(errors)) {
            fieldErrors.push(`${field}: ${errors.join(', ')}`);
          } else {
            fieldErrors.push(`${field}: ${errors}`);
          }
        }
        if (fieldErrors.length > 0) {
          throw fieldErrors.join('\n');
        }
      }
      throw JSON.stringify(err.response.data);
    }
    throw "Failed to update profile.";
  }
}

async function deleteUserAccount() {
  try {
    const token = localStorage.getItem('access_token');
    await axios.delete(
      `${API_BASE_URL}/api/users/settings/`,
      {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return true;
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.errors) {
      throw err.response.data.errors[0];
    }
    throw "Failed to delete account.";
  }
}


export default function AccountTab({
  accountForm,
  setAccountForm,
  user
}: any) {
  const { refreshUser, user: authUser } = useAuth();
  const { t, ready } = useTranslation();
  const { currentLanguage, changeLanguage, availableLanguages, isReady } = useLanguage();
  
  // Don't render until i18n is ready
  if (!isReady || !ready) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center">
          <div className="text-[#F4F0E6]">Loading...</div>
        </div>
      </div>
    );
  }
  
  // Fetch and sync user info on mount
  useEffect(() => {
    (async () => {
      try {
        console.log('AccountTab: Fetching user info...');
        const info = await fetchUserInfo();
        console.log('AccountTab: Received user info:', info);
        
        setAccountForm((prev: any) => {
          const updated = { 
            ...prev, 
            ...info,
            // Ensure birthday and gender are properly set
            birthday: info.birthday || prev.birthday || "",
            gender: info.gender || prev.gender || ""
          };
          console.log('AccountTab: Updated form state:', updated);
          return updated;
        });
      } catch (e) {
        console.error('[AccountTab] Failed to fetch user info:', e);
        // You might want to show an error message to the user here
        alert('Failed to load account information. Please refresh the page and try again.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const validateSocialLinks = (socialLinks: any) => {
    const errors: string[] = [];
    
    // Facebook validation
    if (socialLinks.facebook && socialLinks.facebook.trim()) {
      const fbPattern = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?$/;
      if (!fbPattern.test(socialLinks.facebook.trim())) {
        errors.push(t('validation.facebookFormat'));
      }
    }
    
    // Twitter validation
    if (socialLinks.twitter && socialLinks.twitter.trim()) {
      const twitterPattern = /^(https?:\/\/)?(www\.)?(twitter\.com\/|x\.com\/)?@?[a-zA-Z0-9_]+\/?$/;
      if (!twitterPattern.test(socialLinks.twitter.trim())) {
        errors.push(t('validation.twitterFormat'));
      }
    }
    
    // YouTube validation
    if (socialLinks.youtube && socialLinks.youtube.trim()) {
      const youtubePattern = /^(https?:\/\/)?(www\.)?youtube\.com\/(channel\/|c\/|user\/|@)?[a-zA-Z0-9._-]+\/?$/;
      if (!youtubePattern.test(socialLinks.youtube.trim())) {
        errors.push(t('validation.youtubeFormat'));
      }
    }
    
    // Twitch validation
    if (socialLinks.twitch && socialLinks.twitch.trim()) {
      const twitchPattern = /^(https?:\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9._-]+\/?$/;
      if (!twitchPattern.test(socialLinks.twitch.trim())) {
        errors.push(t('validation.twitchFormat'));
      }
    }
    
    // GitHub validation
    if (socialLinks.github && socialLinks.github.trim()) {
      const githubPattern = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9._-]+\/?$/;
      if (!githubPattern.test(socialLinks.github.trim())) {
        errors.push(t('validation.githubFormat'));
      }
    }
    
    // LinkedIn validation
    if (socialLinks.linkedin && socialLinks.linkedin.trim()) {
      const linkedinPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9._-]+\/?$/;
      if (!linkedinPattern.test(socialLinks.linkedin.trim())) {
        errors.push(t('validation.linkedinFormat'));
      }
    }
    
    // Website validation (general URL)
    if (socialLinks.website && socialLinks.website.trim()) {
      const websitePattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\/?.*$/;
      if (!websitePattern.test(socialLinks.website.trim())) {
        errors.push(t('validation.websiteFormat'));
      }
    }
    
    return errors;
  };

  const handleSave = async () => {
    setLoadingSave(true);
    try {
      // Validate social links before saving
      const socialLinkErrors = validateSocialLinks(accountForm.socialLinks || {});
      if (socialLinkErrors.length > 0) {
        alert(t('accountTab.socialValidationError') + "\n\n" + socialLinkErrors.join("\n"));
        setLoadingSave(false);
        return;
      }

      // Clean and prepare payload - remove empty strings and null values
      const cleanPayload = (obj: any) => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
          }
        }
        return cleaned;
      };

      // Check if avatar is a base64 string (too long for URL field)
      const isBase64Avatar = accountForm.avatarUrl && accountForm.avatarUrl.startsWith('data:');
      
      // Prepare the payload with proper field mapping
      const payload: any = {
        display_name: accountForm.displayName || null,
        username: accountForm.username || null,
        email: accountForm.email || null,
        bio: accountForm.bio || null,
        birthday: accountForm.birthday || null,
        gender: accountForm.gender || null,
        location: accountForm.location || null,
        social_links: accountForm.socialLinks || {},
        preferred_language: accountForm.preferredLanguage || null,
        timezone: accountForm.timezone || null,
        notification_preferences: accountForm.notificationPreferences || {},
        privacy_settings: accountForm.privacySettings || {},
      };

      // Handle avatar data
      if (isBase64Avatar) {
        // Send base64 data to avatar_data field
        payload.avatar_data = accountForm.avatarUrl;
        payload.avatar_url = null; // Clear the URL field
      } else if (accountForm.avatarUrl) {
        // Send URL to avatar_url field
        payload.avatar_url = accountForm.avatarUrl;
        payload.avatar_data = null; // Clear the data field
      }

      // Only include settings if we have language data
      if (accountForm.language) {
        payload.settings = {
          language: accountForm.language,
        };
      }

      // Clean empty values
      const cleanedPayload = cleanPayload(payload);
      
      if (isBase64Avatar) {
        // Sending base64 avatar data to avatar_data field
      } else if (accountForm.avatarUrl) {
        // Sending avatar URL to avatar_url field
      }
      
      await updateUserProfile(cleanedPayload);
      
      // Refresh user data in AuthContext to update navbar avatar
      await refreshUser();
      
      alert(t('accountTab.saveSuccess'));
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setLoadingDelete(true);
    try {
      await deleteUserAccount();
      alert(t('accountTab.deleteSuccess'));
      // Clear local storage and refresh the page
      localStorage.clear();
      window.location.reload();
    } catch (err: any) {
      alert(err);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleLanguageChange = (newLanguageCode: string) => {
    const languageObj = availableLanguages.find(lang => lang.code === newLanguageCode);
    if (languageObj) {
      setAccountForm((prev: any) => ({ ...prev, language: languageObj.name }));
      changeLanguage(newLanguageCode);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">{t('accountTab.title')}</h3>
      <div className="space-y-6">
        {/* Profile Photo Section */}
        <div>
          <label className="block text-sm font-medium mb-4">{t('profilePhoto.profilePhoto')}</label>
          <ProfilePhotoUploader
            currentPhoto={accountForm.avatarUrl}
            onPhotoChange={(photoUrl) => setAccountForm((prev: any) => ({ ...prev, avatarUrl: photoUrl }))}
            className="flex justify-center"
          />
        </div>
        
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('accountTab.displayName')}</label>
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
              value={accountForm.displayName || ""}
              placeholder={t('accountTab.displayNamePlaceholder')}
              onChange={e => setAccountForm((prev: any) => ({ ...prev, displayName: e.target.value }))}
            />
          </div>
        </div>
        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('accountTab.username')}</label>
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
              value={accountForm.username || ""}
              placeholder={t('accountTab.usernamePlaceholder')}
              onChange={e => setAccountForm((prev: any) => ({ ...prev, username: e.target.value }))}
            />
          </div>
        </div>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('accountTab.email')}</label>
          <div className="flex items-center">
            <input
              type="email"
              className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
              value={accountForm.email || ""}
              placeholder={t('accountTab.emailPlaceholder')}
              onChange={e => setAccountForm((prev: any) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded">{t('accountTab.verified')}</span>
          </div>
        </div>
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('accountTab.bio')}</label>
          <textarea
            className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] h-20 md:h-24 resize-none text-sm"
            value={accountForm.bio || ""}
            placeholder={t('accountTab.bioPlaceholder')}
            onChange={e => setAccountForm((prev: any) => ({ ...prev, bio: e.target.value }))}
          />
        </div>
        {/* Personal Section */}
        <div>
          <h4 className="text-lg font-bold mb-3">{t('accountTab.personal')}</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.birthday')}</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(() => {
                  const val = accountForm.birthday;
                  
                  if (!val || val === null || val === undefined) {
                    return "";
                  }
                  
                  if (typeof val === "string") {
                    // If already in YYYY-MM-DD format, return as is
                    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      return val;
                    }
                    // If it's an ISO string, extract date part
                    if (val.includes('T')) {
                      const dateOnly = val.split('T')[0];
                      return dateOnly;
                    }
                    // Try to parse other date formats
                    const date = new Date(val);
                    if (!isNaN(date.getTime())) {
                      const isoDate = date.toISOString().split('T')[0];
                      return isoDate;
                    }
                  }
                  
                  // Handle Date objects
                  if (val instanceof Date && !isNaN(val.getTime())) {
                    const isoDate = val.toISOString().split('T')[0];
                    return isoDate;
                  }
                  
                  return "";
                })()}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, birthday: e.target.value }))}
              />
              <div className="flex items-center mt-1">
                <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded">{t('accountTab.verified')}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.gender')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`py-2 px-4 border ${accountForm.gender === "male" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "male" }))}
                >
                  <span className="mr-2">♂</span>{t('accountTab.male')}
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 border ${accountForm.gender === "female" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "female" }))}
                >
                  <span className="mr-2">♀</span>{t('accountTab.female')}
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 border ${accountForm.gender === "prefer-not-to-say" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "prefer-not-to-say" }))}
                >
                  <span className="mr-2">🤐</span>Prefer not to say
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.location')}</label>
              <select
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.location || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, location: e.target.value }))}
              >
                <option value="">{t('accountTab.locationPlaceholder')}</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Sweden">Sweden</option>
                <option value="Norway">Norway</option>
                <option value="Denmark">Denmark</option>
                <option value="Finland">Finland</option>
                <option value="Japan">Japan</option>
                <option value="South Korea">South Korea</option>
                <option value="China">China</option>
                <option value="India">India</option>
                <option value="Brazil">Brazil</option>
                <option value="Mexico">Mexico</option>
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="South Africa">South Africa</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Egypt">Egypt</option>
                <option value="Russia">Russia</option>
                <option value="Poland">Poland</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Hungary">Hungary</option>
                <option value="Romania">Romania</option>
                <option value="Greece">Greece</option>
                <option value="Turkey">Turkey</option>
                <option value="Israel">Israel</option>
                <option value="UAE">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Thailand">Thailand</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Philippines">Philippines</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.language')}</label>
              <select
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={currentLanguage}
                onChange={e => handleLanguageChange(e.target.value)}
              >
                {availableLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Social Networks Section */}
        <div>
          <h4 className="text-lg font-bold mb-3">{t('accountTab.socialNetworks')}</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.facebook')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.facebook) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                placeholder={t('accountTab.facebookPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.twitter')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.twitter) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                placeholder={t('accountTab.twitterPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.youtube')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.youtube) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                placeholder={t('accountTab.youtubePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.twitch')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.twitch) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, twitch: e.target.value } }))}
                placeholder={t('accountTab.twitchPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.github')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.github) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, github: e.target.value } }))}
                placeholder={t('accountTab.githubPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.linkedin')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.linkedin) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))}
                placeholder={t('accountTab.linkedinPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.website')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.website) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                placeholder={t('accountTab.websitePlaceholder')}
              />
            </div>
          </div>
        </div>
        {/* Save Button */}
        <div className="pt-4">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loadingSave}
              className="flex-1 sm:flex-none px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center disabled:opacity-60"
            >
              <Save size={16} className="mr-2" />
              {loadingSave ? t('accountTab.saving') : t('accountTab.saveChanges')}
            </button>
          </div>
        </div>
        {/* Delete Account Section */}
        <div className="mt-10 border-t border-[#CDAA7D]/40 pt-8">
          <h4 className="text-lg font-bold mb-3 text-red-400">{t('accountTab.deleteAccount')}</h4>
          <p className="mb-4 text-sm text-[#F4F0E6]/80">
            <span className="font-semibold text-red-400">{t('accountTab.warning')}</span> {t('accountTab.deleteWarning')}
          </p>
          <input
            type="text"
            className="w-full px-3 py-2 mb-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-red-400 text-sm"
            placeholder={t('accountTab.deleteConfirmPlaceholder', { username: user?.username })}
            value={accountForm.deleteConfirm || ""}
            onChange={e => setAccountForm((prev: any) => ({ ...prev, deleteConfirm: e.target.value }))}
          />
          <button
            onClick={() => {
              if (accountForm.deleteConfirm === user?.username) {
                handleDelete();
              } else {
                alert(t('accountTab.deleteConfirmError'));
              }
            }}
            disabled={loadingDelete}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {loadingDelete ? t('accountTab.deleting') : t('accountTab.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
