"use client";

import { Eye, EyeOff, Save, AlertCircle } from "lucide-react";
import { useState } from "react";

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
}) {
  const [securityForm, setSecurityForm] = useState(initialSecurityForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const saveSecuritySettings = () => {
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
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
    });
    showToast("Security settings saved successfully!");
    setSecurityForm({
      ...securityForm,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const generateBackupCodes = () => {
    updateSettings({
      settings: {
        ...user?.settings,
        security: {
          ...user?.settings?.security,
          backupCodesGenerated: true,
        },
      },
    });
    showToast("Backup codes generated successfully!");
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
              <button className="ml-2 px-3 py-1 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm font-medium">
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div>
          <h4 className="text-lg font-bold mb-3">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm pr-10"
                  value={securityForm.currentPassword}
                  onChange={e => setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
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
                  onChange={e => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm pr-10"
                  value={securityForm.confirmPassword}
                  onChange={e => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
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
            </div>
          </div>
        </div>

        {/* 2-Step Verification */}
        <div>
          <h4 className="text-lg font-bold mb-3">2-Step Verification</h4>
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
                      onChange={e => {
                        if (e.target.checked) {
                          setSecurityForm((prev) => ({
                            ...prev,
                            twoFactorEnabled: true,
                            twoFactorMethod: "authenticator",
                          }))
                        } else {
                          setSecurityForm((prev) => ({
                            ...prev,
                            twoFactorEnabled: false,
                          }))
                        }
                      }}
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
                    Receive unique security codes at {user?.email?.substring(0, 3)}•••••••@
                    {user?.email?.split("@")[1]}.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={securityForm.twoFactorEnabled && securityForm.twoFactorMethod === "email"}
                      onChange={e => {
                        if (e.target.checked) {
                          setSecurityForm((prev) => ({
                            ...prev,
                            twoFactorEnabled: true,
                            twoFactorMethod: "email",
                          }))
                        } else {
                          setSecurityForm((prev) => ({
                            ...prev,
                            twoFactorEnabled: false,
                          }))
                        }
                      }}
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
                      onChange={e => {
                        if (e.target.checked) {
                          setSecurityForm((prev) => ({
                            ...prev,
                            twoFactorEnabled: true,
                            twoFactorMethod: "hardware",
                          }))
                        } else {
                          setSecurityForm((prev) => ({
                            ...prev,
                            twoFactorEnabled: false,
                          }))
                        }
                      }}
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
                    className="px-3 py-1 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm font-medium"
                  >
                    Generate
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
            onClick={saveSecuritySettings}
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
