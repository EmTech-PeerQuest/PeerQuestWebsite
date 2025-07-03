import { Save, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function SecurityTab({
  securityForm,
  setSecurityForm,
  user,
  showPassword,
  setShowPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  saveSecuritySettings,
  generateBackupCodes
}: any) {
  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">Security</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-bold mb-3">Login Methods</h4>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Password</label>
              <span className="text-xs bg-[#CDAA7D]/20 text-[#CDAA7D] px-2 py-0.5 rounded">1 password added</span>
            </div>
            <div className="flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={securityForm.currentPassword}
                placeholder="Enter your current password"
                onChange={e => setSecurityForm((prev: any) => ({ ...prev, currentPassword: e.target.value }))}
              />
              <button
                type="button"
                className="ml-2 text-[#CDAA7D]"
                onClick={() => setShowPassword((v: boolean) => !v)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="flex items-center">
              <input
                type={showNewPassword ? "text" : "password"}
                className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={securityForm.newPassword}
                placeholder="Create a new password"
                onChange={e => setSecurityForm((prev: any) => ({ ...prev, newPassword: e.target.value }))}
              />
              <button
                type="button"
                className="ml-2 text-[#CDAA7D]"
                onClick={() => setShowNewPassword((v: boolean) => !v)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <div className="flex items-center">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="flex-1 px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={securityForm.confirmPassword}
                placeholder="Confirm your new password"
                onChange={e => setSecurityForm((prev: any) => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <button
                type="button"
                className="ml-2 text-[#CDAA7D]"
                onClick={() => setShowConfirmPassword((v: boolean) => !v)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-3">Two-Factor Authentication</h4>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={securityForm.twoFactorEnabled}
              onChange={e => setSecurityForm((prev: any) => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Enable 2FA</span>
          </div>
          {securityForm.twoFactorEnabled && (
            <div className="mb-2">
              <label className="block text-sm font-medium mb-2">2FA Method</label>
              <select
                className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
                value={securityForm.twoFactorMethod}
                onChange={e => setSecurityForm((prev: any) => ({ ...prev, twoFactorMethod: e.target.value }))}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="app">Authenticator App</option>
              </select>
            </div>
          )}
        </div>
        <div>
          <h4 className="text-lg font-bold mb-3">Backup Codes</h4>
          <button
            onClick={generateBackupCodes}
            className="px-4 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center"
          >
            <Save size={16} className="mr-2" />
            Generate Backup Codes
          </button>
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
