import { Shield, TrendingDown, Save } from "lucide-react";

export default function SpendingTab({
  spendingForm,
  setSpendingForm,
  saveSpendingSettings,
  dailySpent,
  weeklySpent
}: any) {
  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <Shield size={24} className="mr-2 text-[#8B75AA]" />
        Spending Limits
      </h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-bold mb-3">Limits</h4>
          <label className="block text-sm font-medium mb-2">Daily Limit</label>
          <input
            type="number"
            className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
            value={spendingForm.dailyLimit}
            placeholder="Enter daily spending limit"
            onChange={(e) =>
              setSpendingForm((prev: any) => ({ ...prev, dailyLimit: e.target.value }))
            }
          />
          <div className="text-xs text-[#CDAA7D]/70 mt-1">Spent today: {dailySpent}</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Weekly Limit</label>
          <input
            type="number"
            className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] shadow focus:outline-none focus:border-[#8B75AA] text-sm"
            value={spendingForm.weeklyLimit}
            placeholder="Enter weekly spending limit"
            onChange={(e) =>
              setSpendingForm((prev: any) => ({ ...prev, weeklyLimit: e.target.value }))
            }
          />
          <div className="text-xs text-[#CDAA7D]/70 mt-1">Spent this week: {weeklySpent}</div>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-3">Settings</h4>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={spendingForm.enabled}
              onChange={(e) =>
                setSpendingForm((prev: any) => ({ ...prev, enabled: e.target.checked }))
              }
              className="mr-2"
            />
            <span className="text-sm">Enable Spending Limits</span>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={spendingForm.notifications}
              onChange={(e) =>
                setSpendingForm((prev: any) => ({ ...prev, notifications: e.target.checked }))
              }
              className="mr-2"
            />
            <span className="text-sm">Notify me when I approach my limit</span>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={saveSpendingSettings}
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
