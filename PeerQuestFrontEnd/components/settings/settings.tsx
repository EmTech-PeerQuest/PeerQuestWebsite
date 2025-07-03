"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Save, AlertCircle, Shield, TrendingDown, Menu, X } from "lucide-react"
import type { SpendingLimits } from "@/lib/types"
import { getDailySpending, getWeeklySpending } from "@/lib/spending-utils"
import AccountTab from "./tabs/AccountTab"
import SecurityTab from "./tabs/SecurityTab"
import PrivacyTab from "./tabs/PrivacyTab"
import NotificationsTab from "./tabs/NotificationsTab"
import SpendingTab from "./tabs/SpendingTab"
import { usePathname, useRouter } from "next/navigation"

interface SettingsProps {
  user: any
  updateSettings: (settings: any) => void
  showToast: (message: string, type?: string) => void
}

async function updateUserProfile(data: any) {
  const res = await fetch("/api/user/profile/", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw err.errors ? err.errors[0] : "Failed to update profile."
  }
  return await res.json()
}

async function deleteUserAccount() {
  const res = await fetch("/api/user/profile/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw err.errors ? err.errors[0] : "Failed to delete account."
  }
  return true
}

export function Settings({ user, updateSettings, showToast = () => {} }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "account" | "security" | "privacy" | "notifications" | "payment" | "subscriptions" | "app" | "spending"
  >("account")
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Persist active tab in URL hash for refresh persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && tabs.some((tab) => tab.id === hash)) {
        setActiveTab(hash as any)
      }
    }
  }, [])
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = activeTab
    }
  }, [activeTab])

  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Initialize with safe defaults if properties are undefined
  const [accountForm, setAccountForm] = useState({
    displayName: user?.displayName || user?.username || "",
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    birthday: user?.birthday || "",
    gender: user?.gender || "prefer-not-to-say",
    location: user?.location || "",
    language: user?.settings?.language || "English",
    theme: user?.settings?.theme || "dark",
    socialLinks: {
      facebook: user?.socialLinks?.facebook || "",
      twitter: user?.socialLinks?.twitter || "",
      youtube: user?.socialLinks?.youtube || "",
      twitch: user?.socialLinks?.twitch || "",
      github: user?.socialLinks?.github || "",
      linkedin: user?.socialLinks?.linkedin || "",
      website: user?.socialLinks?.website || "",
    },
  })

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: user?.settings?.security?.twoFactorEnabled || false,
    twoFactorMethod: user?.settings?.security?.twoFactorMethod || "email",
  })

  const [privacyForm, setPrivacyForm] = useState({
    showBirthday: user?.settings?.privacy?.showBirthday || false,
    showGender: user?.settings?.privacy?.showGender || false,
    showEmail: user?.settings?.privacy?.showEmail || false,
  })

  const [notificationsForm, setNotificationsForm] = useState({
    newQuests: user?.settings?.notifications?.newQuests || true,
    questApplications: user?.settings?.notifications?.questApplications || true,
    guildAnnouncements: user?.settings?.notifications?.guildAnnouncements || true,
    directMessages: user?.settings?.notifications?.directMessages || true,
    newsletter: user?.settings?.notifications?.newsletter || false,
  })

  const [spendingForm, setSpendingForm] = useState<SpendingLimits>({
    dailyLimit: user?.spendingLimits?.dailyLimit || 5000,
    weeklyLimit: user?.spendingLimits?.weeklyLimit || 25000,
    enabled: user?.spendingLimits?.enabled || false,
    notifications: user?.spendingLimits?.notifications || true,
  })

  const tabs = [
    { id: "account", label: "Account Info" },
    { id: "security", label: "Security" },
    { id: "privacy", label: "Privacy" },
    { id: "notifications", label: "Notifications" },
    { id: "spending", label: "Spending Limits" },
    { id: "payment", label: "Payment Methods" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "app", label: "App Permissions" },
  ]

  const saveAccountSettings = async () => {
    try {
      const updated = {
        displayName: accountForm.displayName,
        username: accountForm.username,
        email: accountForm.email,
        bio: accountForm.bio,
        birthday: accountForm.birthday,
        gender: accountForm.gender,
        location: accountForm.location,
        socialLinks: accountForm.socialLinks,
        settings: {
          ...user?.settings,
          language: accountForm.language,
          theme: accountForm.theme,
        },
      }
      await updateUserProfile(updated)
      updateSettings(updated)
      showToast("Account settings saved successfully!")
    } catch (err: any) {
      showToast(err, "error")
    }
  }

  const saveSecuritySettings = () => {
    // In a real app, we would verify the current password
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      showToast("New passwords do not match", "error")
      return
    }

    updateSettings({
      settings: {
        ...user?.settings,
        security: {
          ...user?.settings?.security,
          twoFactorEnabled: securityForm.twoFactorEnabled,
          twoFactorMethod: securityForm.twoFactorMethod,
        },
      },
    })

    showToast("Security settings saved successfully!")

    // Clear password fields
    setSecurityForm({
      ...securityForm,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const savePrivacySettings = () => {
    updateSettings({
      settings: {
        ...user?.settings,
        privacy: privacyForm,
      },
    })
    showToast("Privacy settings saved successfully!")
  }

  const saveNotificationSettings = () => {
    updateSettings({
      settings: {
        ...user?.settings,
        notifications: notificationsForm,
      },
    })
    showToast("Notification settings saved successfully!")
  }

  const saveSpendingSettings = () => {
    updateSettings({
      spendingLimits: spendingForm,
    })
    showToast("Spending limits updated successfully!")
  }

  const generateBackupCodes = () => {
    updateSettings({
      settings: {
        ...user?.settings,
        security: {
          ...user?.settings?.security,
          backupCodesGenerated: true,
        },
      },
    })
    showToast("Backup codes generated successfully!")
  }

  const dailySpent = getDailySpending(user)
  const weeklySpent = getWeeklySpending(user)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    setShowMobileMenu(false);
    // Hash will be updated by useEffect
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      const deleted = await deleteUserAccount();
      if (deleted) {
        showToast("Account deleted successfully.", "success");
        // Only redirect if the account was actually deleted
        window.location.href = "/goodbye";
      }
    } catch (err: any) {
      showToast(err, "error");
    }
  };

  return (
    <section className="bg-[#F4F0E6] min-h-screen py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[#2C1A1D] font-serif">Settings</h2>
        <p className="text-center text-[#8B75AA] mb-6 md:mb-8">CUSTOMIZE YOUR PEERQUEST TAVERN EXPERIENCE.</p>

        {/* Mobile Header */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full bg-[#2C1A1D] text-[#F4F0E6] p-3 rounded-lg flex items-center justify-between"
          >
            <span>{tabs.find((tab) => tab.id === activeTab)?.label}</span>
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>

          {showMobileMenu && (
            <div className="mt-2 bg-[#2C1A1D] rounded-lg overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left px-4 py-3 text-[#F4F0E6] border-b border-[#CDAA7D]/20 last:border-b-0 ${
                    activeTab === tab.id ? "bg-[#CDAA7D] text-[#2C1A1D]" : "hover:bg-[#CDAA7D]/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:w-64 bg-[#2C1A1D] text-[#F4F0E6] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#CDAA7D]/30">
              <h3 className="font-bold text-lg">Settings</h3>
            </div>
            <div className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-4 py-2 rounded transition-colors text-sm ${
                    activeTab === tab.id ? "bg-[#CDAA7D] text-[#2C1A1D]" : "hover:bg-[#CDAA7D]/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-[#2C1A1D] text-[#F4F0E6] rounded-lg overflow-hidden">
            {activeTab === "account" && (
              <AccountTab
                accountForm={accountForm}
                setAccountForm={setAccountForm}
                user={user}
                saveAccountSettings={saveAccountSettings}
                handleDeleteAccount={handleDeleteAccount}
              />
            )}
            {activeTab === "security" && (
              <SecurityTab
                securityForm={securityForm}
                setSecurityForm={setSecurityForm}
                user={user}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                saveSecuritySettings={saveSecuritySettings}
                generateBackupCodes={generateBackupCodes}
              />
            )}
            {activeTab === "privacy" && (
              <PrivacyTab
                privacyForm={privacyForm}
                setPrivacyForm={setPrivacyForm}
                savePrivacySettings={savePrivacySettings}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab
                notificationsForm={notificationsForm}
                setNotificationsForm={setNotificationsForm}
                saveNotificationSettings={saveNotificationSettings}
              />
            )}
            {activeTab === "spending" && (
              <SpendingTab
                spendingForm={spendingForm}
                setSpendingForm={setSpendingForm}
                saveSpendingSettings={saveSpendingSettings}
                dailySpent={dailySpent}
                weeklySpent={weeklySpent}
              />
            )}
            {/* ...other tabs as needed... */}
          </div>
        </div>
      </div>
    </section>
  )
}
