import { Shield, TrendingDown, Save, AlertCircle } from "lucide-react";

export default function SpendingTab({
  spendingForm,
  setSpendingForm,
  saveSpendingSettings,
  dailySpent,
  weeklySpent,
  user = {}
}: any) {
  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <Shield size={24} className="mr-2 text-[#8B75AA]" />
        Spending Limits
      </h3>
      <div className="space-y-6">
        {/* Current Spending Overview */}
        <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-4">
          <h4 className="font-semibold text-[#F4F0E6] mb-3 flex items-center">
            <TrendingDown size={18} className="mr-2 text-[#8B75AA]" />
            Current Spending
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-[#F4F0E6]/70">Today</div>
              <div className="text-xl font-bold text-[#F4F0E6]">{dailySpent?.toLocaleString?.() ?? dailySpent} Gold</div>
              {user?.spendingLimits?.enabled && (
                <div className="text-xs text-[#8B75AA]">
                  of {user.spendingLimits.dailyLimit?.toLocaleString?.() ?? user.spendingLimits.dailyLimit} limit
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-[#F4F0E6]/70">This Week</div>
              <div className="text-xl font-bold text-[#F4F0E6]">{weeklySpent?.toLocaleString?.() ?? weeklySpent} Gold</div>
              {user?.spendingLimits?.enabled && (
                <div className="text-xs text-[#8B75AA]">
                  of {user.spendingLimits.weeklyLimit?.toLocaleString?.() ?? user.spendingLimits.weeklyLimit} limit
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Spending Limits Settings */}
        <div>
          <h4 className="text-lg font-bold mb-3">Spending Limit Settings</h4>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Enable Spending Limits</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Prevent accidental overspending by setting daily and weekly limits.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={spendingForm.enabled}
                    onChange={e => setSpendingForm((prev: any) => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
            {spendingForm.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Spending Limit (Gold)</label>
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm"
                    value={spendingForm.dailyLimit}
                    onChange={e => setSpendingForm((prev: any) => ({ ...prev, dailyLimit: Number.parseInt(e.target.value) || 0 }))}
                    placeholder="e.g. 5000"
                  />
                  <p className="text-xs text-[#F4F0E6]/70 mt-1">
                    Maximum gold you can spend per day (minimum: 100, maximum: 50,000)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Weekly Spending Limit (Gold)</label>
                  <input
                    type="number"
                    min="500"
                    max="200000"
                    className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA] text-sm"
                    value={spendingForm.weeklyLimit}
                    onChange={e => setSpendingForm((prev: any) => ({ ...prev, weeklyLimit: Number.parseInt(e.target.value) || 0 }))}
                    placeholder="e.g. 25000"
                  />
                  <p className="text-xs text-[#F4F0E6]/70 mt-1">
                    Maximum gold you can spend per week (minimum: 500, maximum: 200,000)
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <h5 className="font-medium">Limit Notifications</h5>
                    <p className="text-sm text-[#F4F0E6]/70 mt-1">
                      Get notified when you're approaching your spending limits.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={spendingForm.notifications}
                        onChange={e => setSpendingForm((prev: any) => ({ ...prev, notifications: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Safety Information */}
        <div className="bg-[#8B75AA]/10 border border-[#8B75AA]/30 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-[#8B75AA] mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-[#8B75AA] mb-2">Safety Features</h4>
              <ul className="text-sm text-[#F4F0E6]/70 space-y-1">
                <li>• Spending limits help prevent accidental overspending</li>
                <li>• Limits reset daily at midnight and weekly on Sundays</li>
                <li>• You'll receive warnings before reaching your limits</li>
                <li>• Limits can be adjusted anytime in your settings</li>
                <li>• Emergency spending may require additional confirmation</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={saveSpendingSettings}
            className="w-full sm:w-auto px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center"
          >
            <Save size={16} className="mr-2" />
            Save Spending Limits
          </button>
        </div>
      </div>
    </div>
  );
}
