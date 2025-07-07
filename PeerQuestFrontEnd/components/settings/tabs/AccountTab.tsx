"use client";

import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { ProfilePhotoUploader } from "@/components/ui/profile-photo-uploader";
import { DebouncedButton, SubmitButton, DangerButton } from "@/components/ui/debounced-button";
import { useUserInfo } from "@/hooks/use-api-request";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Client-side username validation - enhanced to match backend
function validateUsernameClient(username: string): boolean {
  if (!username) return true; // Allow empty for now
  
  // Basic length check
  if (username.length < 3 || username.length > 20) return false;
  
  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
  
  // Don't allow numbers only
  if (/^\d+$/.test(username)) return false;
  
  // Don't allow excessive repeating characters
  if (/(.)\1{3,}/.test(username)) return false;
  
  // Enhanced leet speak prevention - matches backend logic
  const leetMap: { [key: string]: string } = {
    '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g',
    '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't', '?': 'q', '(': 'c', ')': 'c',
    '*': 'a', '%': 'o', '^': 'a', '&': 'a', '#': 'h', '~': 'n', '=': 'e',
    'q': 'g', 'x': 'k', 'z': 's', 'vv': 'w', 'ii': 'u', 'rn': 'm'
  };
  
  // Multi-character substitutions first
  const substitutionPatterns: { [key: string]: string } = {
    'qu': 'g', 'qg': 'gg', 'gq': 'gg', 'kw': 'qu', 'ks': 'x', 'ph': 'f',
    'uff': 'ough', 'vv': 'w', 'rn': 'm', 'nn': 'm', 'ii': 'u', 'oo': 'o',
    'qq': 'g', 'xx': 'x', 'zz': 's'
  };
  
  let normalized = username.toLowerCase();
  
  // Apply substitution patterns multiple times
  for (let i = 0; i < 3; i++) {
    for (const [pattern, replacement] of Object.entries(substitutionPatterns)) {
      // Escape special regex characters in the pattern
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      normalized = normalized.replace(new RegExp(escapedPattern, 'g'), replacement);
    }
  }
  
  // Apply character substitutions multiple times
  for (let i = 0; i < 4; i++) {
    for (const [leet, normal] of Object.entries(leetMap)) {
      // Escape special regex characters in the leet character
      const escapedLeet = leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      normalized = normalized.replace(new RegExp(escapedLeet, 'g'), normal);
    }
  }
  
  // Direct q -> g replacement (ensure this is caught)
  normalized = normalized.replace(/q/g, 'g');
  
  // Check for basic inappropriate words (expanded list)
  const inappropriateWords = [
    'admin', 'mod', 'staff', 'bot', 'test', 'null', 'fuck', 'shit', 'damn', 'bitch',
    'ass', 'hell', 'crap', 'piss', 'cock', 'dick', 'pussy', 'tit', 'nigger', 'nigga',
    'fag', 'gay', 'homo', 'retard', 'rape', 'nazi', 'hitler', 'porn', 'sex', 'cum'
  ];
  
  for (const word of inappropriateWords) {
    if (normalized.includes(word)) return false;
  }
  
  // Check for reserved words
  const reservedWords = [
    'admin', 'moderator', 'mod', 'staff', 'support', 'help', 'bot', 'system',
    'root', 'null', 'undefined', 'test', 'demo', 'guest', 'anonymous', 'anon',
    'api', 'www', 'mail', 'email', 'ftp', 'http', 'https', 'ssl', 'tls'
  ];
  
  for (const word of reservedWords) {
    if (normalized.includes(word)) return false;
  }
  
  return true;
}

// Fetch user info and map backend fields to frontend state
export async function fetchUserInfo() {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error("No access token found. Please log in.");
    }
    
    const res = await axios.get(`${API_BASE_URL}/api/users/settings/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const data = res.data;
    
    const mappedData = {
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
    
    return mappedData;
  } catch (err: any) {
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
  
  // Use the new API hook for better error handling and spam prevention
  const { fetchUserInfo: fetchUserInfoAPI, isLoading: isLoadingUserInfo, error: userInfoError } = useUserInfo();
  
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
  
  // Fetch and sync user info on mount with better error handling
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const loadUserInfo = async () => {
      // Check authentication first
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!accessToken && !refreshToken) {
        if (isMounted) {
          alert('Please log in to access your account information.');
          window.location.href = '/login';
        }
        return;
      }
      
      // Check if we're already loading to prevent duplicate calls
      if (isLoadingUserInfo) {
        return;
      }
      
      try {
        const info = await fetchUserInfoAPI();
        
        // Only update state if component is still mounted and we got data
        if (isMounted && info) {
          setAccountForm((prev: any) => {
            const updated = { 
              ...prev, 
              ...info,
              // Ensure birthday and gender are properly set
              birthday: info.birthday || prev.birthday || "",
              gender: info.gender || prev.gender || ""
            };
            return updated;
          });
        }
      } catch (e) {
        // Only show error if component is still mounted
        if (isMounted) {
          // Show a more user-friendly error message based on the error type
          if (userInfoError?.status === 401) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          } else if (userInfoError?.status === 500) {
            alert('Server error. Please try again in a moment.');
          } else {
            alert('Failed to load account information. Please refresh the page and try again.');
          }
        }
      }
    };
    
    // Delay the API call slightly to prevent immediate calls on navigation
    const timeoutId = setTimeout(loadUserInfo, 100);
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
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
      // Validate username before saving
      if (accountForm.username && !validateUsernameClient(accountForm.username)) {
        alert("Username contains invalid characters or inappropriate content. Please choose a different username.");
        setLoadingSave(false);
        return;
      }

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
      <h3 className="text-xl font-bold mb-4">{t('accountTab.title')}</h3>
      <div className="space-y-4">
        {/* Profile Photo Section */}
        <div className="bg-[#3D2A2F]/50 p-6 rounded-lg border border-[#CDAA7D]/30">
          <label className="block text-sm font-medium mb-4">{t('profilePhoto.profilePhoto')}</label>
          <ProfilePhotoUploader
            currentPhoto={accountForm.avatarUrl}
            onPhotoChange={(photoUrl) => setAccountForm((prev: any) => ({ ...prev, avatarUrl: photoUrl }))}
            className="flex justify-center"
          />
        </div>
        {/* Personal Section */}
        <div className="bg-[#3D2A2F]/30 p-4 rounded-lg border border-[#CDAA7D]/20">
          <h4 className="text-lg font-bold mb-3">{t('accountTab.personal')}</h4>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.username')}</label>
              <input
                type="text"
                className={`w-full px-4 py-3 bg-[#3D2A2F] border rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm ${
                  accountForm.username && !validateUsernameClient(accountForm.username)
                    ? 'border-red-500'
                    : 'border-[#CDAA7D]'
                }`}
                value={accountForm.username || ""}
                placeholder={t('accountTab.usernamePlaceholder')}
                onChange={e => {
                  const value = e.target.value;
                  setAccountForm((prev: any) => ({ ...prev, username: value }));
                }}
              />
              <div className="text-xs mt-1">
                {accountForm.username && !validateUsernameClient(accountForm.username) ? (
                  <span className="text-red-400">
                    Username must be 3-20 characters, contain only letters/numbers/underscores, and cannot contain inappropriate content or leet speak substitutions (like 'q' for 'g').
                  </span>
                ) : (
                  <span className="text-[#8B75AA]">
                    Username can only contain letters, numbers, and underscores. No inappropriate content or leet speak allowed.
                  </span>
                )}
              </div>
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.email')}</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={accountForm.email || ""}
                placeholder={t('accountTab.emailPlaceholder')}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, email: e.target.value }))}
              />
              <div className="flex items-center mt-1">
                <span className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded-full">{t('accountTab.verified')}</span>
              </div>
            </div>
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.bio')}</label>
              <textarea
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] h-28 md:h-32 resize-none text-sm"
                value={accountForm.bio || ""}
                placeholder={t('accountTab.bioPlaceholder')}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, bio: e.target.value }))}
              />
            </div>
            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('accountTab.birthday')}</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(() => {
                  const val = accountForm.birthday;
                  if (!val || val === null || val === undefined) {
                    return "";
                  }
                  if (typeof val === "string") {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      return val;
                    }
                    if (val.includes('T')) {
                      const dateOnly = val.split('T')[0];
                      return dateOnly;
                    }
                    const date = new Date(val);
                    if (!isNaN(date.getTime())) {
                      const isoDate = date.toISOString().split('T')[0];
                      return isoDate;
                    }
                  }
                  if (val instanceof Date && !isNaN(val.getTime())) {
                    const isoDate = val.toISOString().split('T')[0];
                    return isoDate;
                  }
                  return "";
                })()}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, birthday: e.target.value }))}
              />
              <div className="flex items-center mt-1">
                <span className="text-xs bg-blue-800 text-blue-200 px-3 py-1 rounded-full">{t('accountTab.verified')}</span>
              </div>
            </div>
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.gender')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DebouncedButton
                  type="button"
                  variant={accountForm.gender === "male" ? "default" : "outline"}
                  className={`py-3 px-4 border ${accountForm.gender === "male" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded-lg font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "male" }))}
                  soundType="soft"
                  debounceMs={150}
                >
                  <span className="mr-2">♂</span>{t('accountTab.male')}
                </DebouncedButton>
                <DebouncedButton
                  type="button"
                  variant={accountForm.gender === "female" ? "default" : "outline"}
                  className={`py-3 px-4 border ${accountForm.gender === "female" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded-lg font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "female" }))}
                  soundType="soft"
                  debounceMs={150}
                >
                  <span className="mr-2">♀</span>{t('accountTab.female')}
                </DebouncedButton>
                <DebouncedButton
                  type="button"
                  variant={accountForm.gender === "prefer-not-to-say" ? "default" : "outline"}
                  className={`py-3 px-4 border ${accountForm.gender === "prefer-not-to-say" ? "bg-[#8B75AA] text-white" : "border-[#CDAA7D] text-[#F4F0E6]"} rounded-lg font-medium transition-colors flex items-center justify-center text-sm`}
                  onClick={() => setAccountForm((prev: any) => ({ ...prev, gender: "prefer-not-to-say" }))}
                  soundType="soft"
                  debounceMs={150}
                >
                  <span className="mr-2">🤐</span>Prefer not to say
                </DebouncedButton>
              </div>
            </div>
            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.location')}</label>
              <select
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
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
            {/* Language */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.language')}</label>
              <select
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
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
        <div className="bg-[#3D2A2F]/30 p-4 rounded-lg border border-[#CDAA7D]/20">
          <h4 className="text-lg font-bold mb-3">{t('accountTab.socialNetworks')}</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.facebook')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.facebook) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                placeholder={t('accountTab.facebookPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.twitter')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.twitter) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                placeholder={t('accountTab.twitterPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.youtube')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.youtube) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                placeholder={t('accountTab.youtubePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.twitch')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.twitch) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, twitch: e.target.value } }))}
                placeholder={t('accountTab.twitchPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.github')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.github) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, github: e.target.value } }))}
                placeholder={t('accountTab.githubPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.linkedin')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.linkedin) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))}
                placeholder={t('accountTab.linkedinPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('accountTab.website')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={(accountForm.socialLinks && accountForm.socialLinks.website) || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                placeholder={t('accountTab.websitePlaceholder')}
              />
            </div>
          </div>
        </div>
        {/* Save Button */}
        <div className="pt-4 border-t border-[#CDAA7D]/30">
          <div className="flex gap-3 justify-center sm:justify-start">
            <SubmitButton
              onClick={handleSave}
              disabled={loadingSave || isLoadingUserInfo}
              className="px-8 py-3 bg-[#8B75AA] text-white rounded-lg font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center disabled:opacity-60 min-w-[160px]"
              loadingText={t('accountTab.saving')}
              successText={t('accountTab.saved') || 'Saved!'}
              errorText={t('accountTab.saveError') || 'Error saving!'}
            >
              <Save size={16} className="mr-2" />
              {t('accountTab.saveChanges')}
            </SubmitButton>
          </div>
        </div>
        {/* Delete Account Section */}
        <div className="mt-8 border-t-2 border-red-400/40 pt-4">
          <div className="bg-red-900/20 p-4 rounded-lg border border-red-400/30">
            <h4 className="text-lg font-bold mb-4 text-red-400">{t('accountTab.deleteAccount')}</h4>
            <p className="mb-6 text-sm text-[#F4F0E6]/80 leading-relaxed">
              <span className="font-semibold text-red-400">{t('accountTab.warning')}</span> {t('accountTab.deleteWarning')}
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#3D2A2F] border border-[#CDAA7D] rounded-lg text-[#F4F0E6] shadow focus:outline-none focus:border-red-400 text-sm"
                placeholder={t('accountTab.deleteConfirmPlaceholder', { username: user?.username })}
                value={accountForm.deleteConfirm || ""}
                onChange={e => setAccountForm((prev: any) => ({ ...prev, deleteConfirm: e.target.value }))}
              />
              
              <DangerButton
                onClick={() => {
                  if (accountForm.deleteConfirm === user?.username) {
                    handleDelete();
                  } else {
                    alert(t('accountTab.deleteConfirmError'));
                  }
                }}
                disabled={loadingDelete}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-60 min-w-[160px]"
                loadingText={t('accountTab.deleting')}
                errorText={t('accountTab.deleteError') || 'Error deleting!'}
              >
                {t('accountTab.deleteAccount')}
              </DangerButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
