"use client"

import { useState, useEffect } from "react"
import { useUserInfo } from "@/hooks/use-api-request"
import { Eye, EyeOff, Save, AlertCircle, Shield, TrendingDown, Menu, X } from "lucide-react"
import type { SpendingLimits } from "@/lib/types"
import { getDailySpending, getWeeklySpending } from "@/lib/spending-utils"
import AccountTab from "./tabs/AccountTab"
import SecurityTab from "./tabs/SecurityTab"
import PrivacyTab from "./tabs/PrivacyTab"
import NotificationsTab from "./tabs/NotificationsTab"
import SpendingTab from "./tabs/SpendingTab"
import PaymentTab from "./tabs/PaymentTab"
import SubscriptionsTab from "./tabs/SubscriptionsTab"
import AppPermissionsTab from "./tabs/AppPermissionsTab"
import { AudioSettings } from "@/components/ui/audio-settings"
import SkillsModal from "../skills/skills-modal"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { useClickSound } from "@/hooks/use-click-sound"
import { useAudioContext } from "@/context/audio-context"
import { Button } from "@/components/ui/button"

export function Settings() {
  const { soundEnabled, volume } = useAudioContext()
  const { playSound } = useClickSound({ enabled: soundEnabled, volume })
  
  // Use the new API hook instead of the old useUserSettings
  const { fetchUserInfo, updateUserInfo, isLoading, error } = useUserInfo()
  
  const [user, setUser] = useState<any>(null)
  
  // Create wrapper functions for compatibility
  const updateUser = async (data: any) => {
    try {
      const result = await updateUserInfo(data)
      if (result) {
        setUser(result)
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }
  
  const deleteUser = async () => {
    try {
      // You might want to implement this in the useUserInfo hook
      // For now, just return false
      return false
    } catch (err) {
      return false
    }
  }
  const [activeTab, setActiveTab] = useState<
    "account" | "skills" | "security" | "privacy" | "notifications" | "payment" | "subscriptions" | "app" | "spending" | "audio"
  >("account")
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Load user data only once when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      // First check if we have tokens
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!accessToken && !refreshToken) {
        alert('Please log in to access settings.')
        // Redirect to login page
        window.location.href = '/login'
        return
      }
      
      if (!accessToken && refreshToken) {
        try {
          const response = await fetch('http://localhost:8000/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          })
          
          if (response.ok) {
            const data = await response.json()
            localStorage.setItem('access_token', data.access)
            if (data.refresh) {
              localStorage.setItem('refresh_token', data.refresh)
            }
            const userData = await fetchUserInfo()
            setUser(userData)
          } else {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            alert('Your session has expired. Please log in again.')
            window.location.href = '/login'
            return
          }
        } catch (err) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          alert('Authentication error. Please log in again.')
          window.location.href = '/login'
          return
        }
      } else {
        // We have an access token, try to load user data
        try {
          const userData = await fetchUserInfo()
          setUser(userData)
        } catch (err) {
          alert('Failed to load user data. Please refresh the page.')
        }
      }
    }
    
    loadUserData()
  }, []) // Empty dependency array to run only once

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
    { id: "skills", label: "Skills & Expertise" },
    { id: "security", label: "Security" },
    { id: "privacy", label: "Privacy" },
    { id: "notifications", label: "Notifications" },
    { id: "spending", label: "Spending Limits" },
    { id: "payment", label: "Payment Methods" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "app", label: "App Permissions" },
    { id: "audio", label: "Audio & Sounds" },
  ]

  const saveAccountSettings = async () => {
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
    };
    const ok = await updateUser(updated);
    if (ok) {
      // Optionally update local state/UI
      toast({
        title: "Success",
        description: "Account settings saved successfully!",
      });
    } else if (error) {
      toast({
        title: "Error",
        description: error?.message || 'An error occurred',
        variant: "destructive",
      });
    }
  };

  const saveSecuritySettings = async () => {
    // In a real app, we would verify the current password
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return
    }    const updated = {
      settings: {
        ...user?.settings,
        security: {
          ...user?.settings?.security,
          twoFactorEnabled: securityForm.twoFactorEnabled,
          twoFactorMethod: securityForm.twoFactorMethod,
        },
      },
    };
    const ok = await updateUser(updated);
    if (ok) {
      toast({
        title: "Success",
        description: "Security settings saved successfully!",
      });
    }

    // Clear password fields
    setSecurityForm({
      ...securityForm,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const savePrivacySettings = async () => {
    const updated = {
      settings: {
        ...user?.settings,
        privacy: privacyForm,
      },
    };
    const ok = await updateUser(updated);
    if (ok) {
      toast({
        title: "Success",
        description: "Privacy settings saved successfully!",
      });
    }
  }

  const saveNotificationSettings = async () => {
    const updated = {
      settings: {
        ...user?.settings,
        notifications: notificationsForm,
      },
    };
    const ok = await updateUser(updated);
    if (ok) {
      toast({
        title: "Success",
        description: "Notification settings saved successfully!",
      });
    }
  }

  const saveSpendingSettings = async () => {
    const updated = {
      spendingLimits: spendingForm,
    };
    const ok = await updateUser(updated);
    if (ok) {
      toast({
        title: "Success",
        description: "Spending limits updated successfully!",
      });
    }
  }

  const generateBackupCodes = async () => {
    const updated = {
      settings: {
        ...user?.settings,
        security: {
          ...user?.settings?.security,
          backupCodesGenerated: true,
        },
      },
    };
    const ok = await updateUser(updated);
    if (ok) {
      toast({
        title: "Success",
        description: "Backup codes generated successfully!",
      });
    }
  }

  const dailySpent = user ? getDailySpending(user) : 0;
  const weeklySpent = user ? getWeeklySpending(user) : 0;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    setShowMobileMenu(false);
    // Hash will be updated by useEffect
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    const ok = await deleteUser();
    if (ok) {
      toast({
        title: "Success",
        description: "Account deleted successfully.",
      });
      window.location.href = "/goodbye";
    } else if (error) {
      toast({
        title: "Error",
        description: error?.message || 'An error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <section className="bg-[#F4F0E6] min-h-screen py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[#2C1A1D] font-serif">Settings</h2>
        <p className="text-center text-[#8B75AA] mb-6 md:mb-8">CUSTOMIZE YOUR PEERQUEST TAVERN EXPERIENCE.</p>
        {/* Mobile Header */}
        <div className="md:hidden mb-4">
          <Button
            onClick={() => {
              playSound('soft')
              setShowMobileMenu(!showMobileMenu)
            }}
            variant="ghost"
            className="w-full bg-[#2C1A1D] text-[#F4F0E6] p-3 rounded-lg flex items-center justify-between hover:bg-[#3C2A2D]"
            soundType="soft"
          >
            <span>{tabs.find((tab) => tab.id === activeTab)?.label}</span>
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </Button>
          {showMobileMenu && (
            <div className="mt-2 bg-[#2C1A1D] rounded-lg overflow-hidden">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => {
                    playSound('tab')
                    handleTabChange(tab.id)
                  }}
                  variant="ghost"
                  className={`w-full text-left px-4 py-3 text-[#F4F0E6] border-b border-[#CDAA7D]/20 last:border-b-0 rounded-none ${
                    activeTab === tab.id ? "bg-[#CDAA7D] text-[#2C1A1D]" : "hover:bg-[#CDAA7D]/20"
                  }`}
                  soundType="tab"
                >
                  {tab.label}
                </Button>
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
                <Button
                  key={tab.id}
                  onClick={() => {
                    playSound('tab')
                    setActiveTab(tab.id as any)
                  }}
                  variant="ghost"
                  className={`w-full justify-start text-left px-4 py-2 rounded transition-colors text-sm ${
                    activeTab === tab.id ? "bg-[#CDAA7D] text-[#2C1A1D]" : "hover:bg-[#CDAA7D]/20"
                  }`}
                  soundType="tab"
                >
                  {tab.label}
                </Button>
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
            {activeTab === "skills" && (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Skills & Expertise</h2>
                <p className="text-[#CDAA7D] mb-6">
                  Manage your skills to help others find you for collaborations and quests.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      playSound()
                      setIsSkillsModalOpen(true)
                    }}
                    className="w-full bg-[#8B75AA] hover:bg-[#7A6699] text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    🎯 Manage My Skills
                  </button>
                  <div className="text-sm text-[#CDAA7D] bg-[#CDAA7D]/10 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">💡 Why add skills?</h3>
                    <ul className="space-y-1">
                      <li>• Get discovered by quest creators looking for your expertise</li>
                      <li>• Receive personalized quest recommendations</li>
                      <li>• Showcase your abilities to potential collaborators</li>
                      <li>• Track your professional development</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "security" && (
              <SecurityTab
                securityForm={securityForm}
                user={user || {}}
                showToast={() => {
                  toast({
                    title: "Success",
                    description: "Security settings saved successfully!",
                  });
                }}
                updateSettings={saveSecuritySettings}
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
                user={user || undefined}
              />
            )}
            {activeTab === "payment" && (
              <PaymentTab
                paymentMethods={user?.paymentMethods || []}
                onAddPayment={() => { /* TODO: open add payment modal */ }}
              />
            )}
            {activeTab === "subscriptions" && (
              <SubscriptionsTab />
            )}
            {activeTab === "app" && (
              <AppPermissionsTab />
            )}
            {activeTab === "audio" && (
              <div className="p-6">
                <AudioSettings showTitle={false} />
              </div>
            )}
            {/* ...other tabs as needed... */}
          </div>
        </div>
      </div>
      
      {/* Skills Modal */}
      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        onSkillsUpdated={() => {
          // Optionally refresh user data if needed
          // fetchUserInfo()
        }}
      />
    </section>
  );
}
