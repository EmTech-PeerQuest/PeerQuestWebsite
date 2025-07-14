"use client";

import { Eye, EyeOff, Save, AlertCircle, Settings, Calendar, Shield, Key, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { getPasswordAge } from "@/lib/date-utils";
import { useAuth } from "@/context/AuthContext";

export default function SecurityTab({
  securityForm: initialSecurityForm = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    twoFactorMethod: "email",
  },
  user = {},
  showToast = () => {},
  updateSettings = () => {},
}: {
  securityForm?: any;
  user?: any;
  showToast?: () => void;
  updateSettings?: () => void;
}) {
  const { refreshUser } = useAuth();
  
  const [securityForm, setSecurityForm] = useState(initialSecurityForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "text-red-500" };
      case 2:
        return { text: "Weak", color: "text-orange-500" };
      case 3:
        return { text: "Fair", color: "text-yellow-500" };
      case 4:
        return { text: "Good", color: "text-blue-500" };
      case 5:
        return { text: "Strong", color: "text-green-500" };
      default:
        return { text: "", color: "" };
    }
  };

  const passwordStrength = getPasswordStrength(securityForm.newPassword);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  // Generate strong password
  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fill the rest with random characters
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Text copied to clipboard!",
      });
    });
  };

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setSecurityForm((prev: any) => ({
        ...prev,
        twoFactorEnabled: user.settings?.security?.twoFactorEnabled || false,
        twoFactorMethod: user.settings?.security?.twoFactorMethod || "email",
      }));
    }
  }, [user]);

  const handlePasswordChange = async () => {
    if (!securityForm.currentPassword || !securityForm.newPassword) {
      toast({
        title: "Error",
        description: "Please fill in both current and new password fields.",
        variant: "destructive",
      });
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (securityForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }


      // Use env var for API base, fallback to relative if not set
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][SecurityTab] NEXT_PUBLIC_API_BASE_URL:', apiBase);
      }
      const changePasswordUrl = `${apiBase.replace(/\/$/, '')}/api/users/change-password/`;
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][SecurityTab] Change password endpoint:', changePasswordUrl);
      }
      const response = await fetch(changePasswordUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: securityForm.currentPassword,
          new_password: securityForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(' ') : 'Password change failed');
      }

      toast({
        title: "Success",
        description: "Password changed successfully!",
      });

      // Show additional security alert
      alert("🔒 Password Changed Successfully!\n\nYour password has been updated. For your security:\n• You will remain logged in on this device\n• All other sessions have been terminated\n• Consider enabling 2-factor authentication for extra security");

      // Clear password fields
      setSecurityForm((prev: any) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Refresh user data to get updated last_password_change
      await refreshUser();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorChange = async (method: string, enabled: boolean) => {
    setLoading(true);
    try {
      const updatedForm = {
        ...securityForm,
        twoFactorEnabled: enabled,
        twoFactorMethod: enabled ? method : securityForm.twoFactorMethod,
      };

      setSecurityForm(updatedForm);

      // Update the user settings via API
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }


      // Use env var for API base, fallback to relative if not set
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][SecurityTab] NEXT_PUBLIC_API_BASE_URL:', apiBase);
      }
      const profileUrl = `${apiBase.replace(/\/$/, '')}/api/users/profile/`;
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][SecurityTab] Profile endpoint:', profileUrl);
      }
      const response = await fetch(profileUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: {
            ...user?.settings,
            security: {
              ...user?.settings?.security,
              twoFactorEnabled: enabled,
              twoFactorMethod: enabled ? method : user?.settings?.security?.twoFactorMethod,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(' ') : 'Failed to update settings');
      }

      toast({
        title: "Success",
        description: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully!`,
      });

    } catch (error: any) {
      // Revert the form state on error
      setSecurityForm((prev: any) => ({
        ...prev,
        twoFactorEnabled: user?.settings?.security?.twoFactorEnabled || false,
        twoFactorMethod: user?.settings?.security?.twoFactorMethod || "email",
      }));

      toast({
        title: "Error",
        description: error.message || "Failed to update two-factor authentication settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    setLoading(true);
    try {
      // Update the user settings via API
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Use env var for API base, fallback to relative if not set
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][SecurityTab] NEXT_PUBLIC_API_BASE_URL:', apiBase);
      }
      const profileUrl = `${apiBase.replace(/\/$/, '')}/api/users/profile/`;
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[PeerQuest][SecurityTab] Profile endpoint:', profileUrl);
      }
      const response = await fetch(profileUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: {
            ...user?.settings,
            security: {
              ...user?.settings?.security,
              backupCodesGenerated: true,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(' ') : 'Failed to generate backup codes');
      }

      toast({
        title: "Success",
        description: "Backup codes generated successfully!",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate backup codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">Security</h3>
      <div className="space-y-6">
        {/* Login Methods */}
        <div>
          <h4 className="text-lg font-bold mb-3">Login Methods</h4>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Password</label>
              <span className="text-xs bg-[#CDAA7D]/20 text-[#CDAA7D] px-2 py-0.5 rounded">1 password added</span>
            </div>
            <div className="flex items-center">
              <input
                type="password"
                className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm"
                value="••••••••"
                disabled
              />
              <button 
                onClick={() => setShowManageModal(true)}
                className="ml-2 px-3 py-1 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm font-medium hover:bg-[#B8955F] transition-colors"
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div data-section="change-password">
          <h4 className="text-lg font-bold mb-3">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm pr-10"
                  value={securityForm.currentPassword}
                  onChange={e => setSecurityForm((prev: any) => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDAA7D]"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm pr-10"
                  value={securityForm.newPassword}
                  onChange={e => setSecurityForm((prev: any) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Create a new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDAA7D]"
                  onClick={() => setShowNewPassword((v) => !v)}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {securityForm.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F4F0E6]/70">Password strength:</span>
                    <span className={strengthInfo.color}>{strengthInfo.text}</span>
                  </div>
                  <div className="w-full bg-[#2C1A1D] rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength <= 1
                          ? "bg-red-500"
                          : passwordStrength === 2
                          ? "bg-orange-500"
                          : passwordStrength === 3
                          ? "bg-yellow-500"
                          : passwordStrength === 4
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-[#F4F0E6]/60 mt-1">
                    Requirements: 8+ characters, uppercase, lowercase, number, special character
                  </div>
                </div>
              )}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const strongPassword = generateStrongPassword();
                    setSecurityForm((prev: any) => ({ 
                      ...prev, 
                      newPassword: strongPassword,
                      confirmPassword: strongPassword
                    }));
                    toast({
                      title: "Password Generated",
                      description: "A strong password has been generated and filled in.",
                    });
                  }}
                  className="text-xs px-3 py-1 bg-[#CDAA7D]/20 text-[#CDAA7D] rounded hover:bg-[#CDAA7D]/30 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  Generate Strong Password
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full px-3 py-2 bg-[#3D2A2F] border rounded text-[#F4F0E6] focus:outline-none text-sm pr-10 ${
                    securityForm.confirmPassword && securityForm.newPassword !== securityForm.confirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : securityForm.confirmPassword && securityForm.newPassword === securityForm.confirmPassword
                      ? "border-green-500 focus:border-green-500"
                      : "border-[#CDAA7D] focus:border-[#8B75AA]"
                  }`}
                  value={securityForm.confirmPassword}
                  onChange={e => setSecurityForm((prev: any) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDAA7D]"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {securityForm.confirmPassword && (
                <div className="mt-1 text-xs">
                  {securityForm.newPassword === securityForm.confirmPassword ? (
                    <span className="text-green-500">✓ Passwords match</span>
                  ) : (
                    <span className="text-red-500">✗ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Step Verification */}
        <div>
          <h4 className="text-lg font-bold mb-3 flex items-center">
            2-Step Verification
            {loading && (
              <div className="ml-2 w-4 h-4 border-2 border-[#8B75AA] border-t-transparent rounded-full animate-spin"></div>
            )}
          </h4>
          <p className="text-sm text-[#F4F0E6]/70 mb-4">
            Add an extra layer of protection to your account with 2-Step Verification at login, account
            recovery, and high-value transactions. You can enable one of the following options at a time.
          </p>
          <div className="space-y-4">
            {/* Authenticator App */}
            <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h5 className="font-medium">Authenticator App (Very Secure)</h5>
                  <p className="text-sm text-[#F4F0E6]/70 mt-1">
                    Download an app on your phone to generate unique security codes. Suggested apps include
                    Google Authenticator, Microsoft Authenticator, and Twilio's Authy.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={securityForm.twoFactorEnabled && securityForm.twoFactorMethod === "authenticator"}
                      disabled={loading}
                      onChange={e => handleTwoFactorChange("authenticator", e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                  </label>
                </div>
              </div>
            </div>
            {/* Email */}
            <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h5 className="font-medium">Email (Secure)</h5>
                  <p className="text-sm text-[#F4F0E6]/70 mt-1">
                    Receive unique security codes at {user?.email ? 
                      `${user.email.substring(0, 3)}•••••••@${user.email.split("@")[1]}` : 
                      "your registered email"
                    }.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={securityForm.twoFactorEnabled && securityForm.twoFactorMethod === "email"}
                      disabled={loading}
                      onChange={e => handleTwoFactorChange("email", e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                  </label>
                </div>
              </div>
            </div>
            {/* Hardware Security Keys */}
            <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h5 className="font-medium">Hardware Security Keys (Very Secure)</h5>
                  <p className="text-sm text-[#F4F0E6]/70 mt-1">
                    Supported on web browsers, iPhone, and iPad. Use a hardware key as an extra layer of
                    protection while logging in.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={securityForm.twoFactorEnabled && securityForm.twoFactorMethod === "hardware"}
                      disabled={loading}
                      onChange={e => handleTwoFactorChange("hardware", e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                  </label>
                </div>
              </div>
            </div>
            {/* Backup Codes */}
            <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h5 className="font-medium">Backup Codes</h5>
                  <p className="text-sm text-[#F4F0E6]/70 mt-1">
                    You have {user?.settings?.security?.backupCodesGenerated ? "8 unused" : "0"} backup codes.
                  </p>
                  <p className="text-sm text-[#F4F0E6]/70 mt-2">
                    Generate and use backup codes in case you lose access to your 2-Step Verification option.
                    Do not share your backup codes with anyone.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={generateBackupCodes}
                    disabled={loading}
                    className="px-3 py-1 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm font-medium hover:bg-[#B8955F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#8B75AA]/10 border border-[#8B75AA]/30 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <AlertCircle size={20} className="text-[#8B75AA] mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#F4F0E6]/70">
                <span className="font-bold text-[#8B75AA]">IMPORTANT:</span> Don't share your security codes
                with anyone. This can include things like texting your code, screensharing, etc. Do not change
                security settings at someone else's request. PeerQuest will never ask you for your codes or to
                change settings to prove account ownership.
              </p>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={handlePasswordChange}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      
      {/* Password Management Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2C1A1D] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#F4F0E6]">Password Management</h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-[#CDAA7D] hover:text-[#F4F0E6] transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Password Info */}
              <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-4">
                <h4 className="font-medium text-[#F4F0E6] mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Password Information
                </h4>
                <div className="space-y-2 text-sm text-[#F4F0E6]/70">
                  <div className="flex justify-between">
                    <span>Last changed:</span>
                    <span>
                      {user?.lastPasswordChange ? 
                        new Date(user.lastPasswordChange).toLocaleDateString() : 
                        "Never changed"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Password age:</span>
                    <span>
                      {user?.lastPasswordChange ? 
                        getPasswordAge(user.lastPasswordChange) : 
                        "Unknown"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-500">Active</span>
                  </div>
                  {user?.lastPasswordChange && (
                    <div className="mt-3 p-2 bg-[#8B75AA]/10 rounded text-xs">
                      <span className="text-[#8B75AA] font-medium">💡 Security Tip:</span>
                      <span className="text-[#F4F0E6]/70 ml-1">
                        {(() => {
                          const daysSinceChange = Math.ceil((new Date().getTime() - new Date(user.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24));
                          if (daysSinceChange > 90) return "Consider changing your password - it's been over 90 days.";
                          if (daysSinceChange > 60) return "Your password is aging - consider updating it soon.";
                          return "Your password is relatively fresh. Keep it secure!";
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-4">
                <h4 className="font-medium text-[#F4F0E6] mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowManageModal(false);
                      // Scroll to change password section
                      document.querySelector('[data-section="change-password"]')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                    className="w-full text-left px-3 py-2 bg-[#8B75AA] text-white rounded text-sm hover:bg-[#7A6699] transition-colors flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      const strongPassword = generateStrongPassword();
                      copyToClipboard(strongPassword);
                      toast({
                        title: "Strong Password Generated",
                        description: "A strong password has been generated and copied to your clipboard.",
                      });
                    }}
                    className="w-full text-left px-3 py-2 bg-[#CDAA7D]/20 text-[#CDAA7D] rounded text-sm hover:bg-[#CDAA7D]/30 transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Generate Strong Password
                  </button>
                  <button
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Password history feature will be available soon.",
                      });
                    }}
                    className="w-full text-left px-3 py-2 bg-[#CDAA7D]/20 text-[#CDAA7D] rounded text-sm hover:bg-[#CDAA7D]/30 transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    View Password History
                  </button>
                  <button
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Login activity feature will be available soon.",
                      });
                    }}
                    className="w-full text-left px-3 py-2 bg-[#CDAA7D]/20 text-[#CDAA7D] rounded text-sm hover:bg-[#CDAA7D]/30 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    View Login Activity
                  </button>
                </div>
              </div>

              {/* Security Recommendations */}
              <div className="bg-[#8B75AA]/10 border border-[#8B75AA]/30 rounded-lg p-4">
                <h4 className="font-medium text-[#8B75AA] mb-2">Security Recommendations</h4>
                <ul className="text-sm text-[#F4F0E6]/70 space-y-1">
                  <li>• Change your password every 90 days</li>
                  <li>• Use a unique password for PeerQuest</li>
                  {!securityForm.twoFactorEnabled && (
                    <li className="text-orange-400">• Enable two-factor authentication for better security</li>
                  )}
                  <li>• Avoid common passwords and personal information</li>
                  <li>• Use a password manager for secure storage</li>
                  <li>• Log out from shared devices</li>
                </ul>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="w-full px-4 py-2 bg-[#CDAA7D] text-[#2C1A1D] rounded font-medium hover:bg-[#B8955F] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
