import { Save } from "lucide-react";

export default function NotificationsTab({
  notificationsForm,
  setNotificationsForm,
  saveNotificationSettings
}: any) {
  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">Notifications</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-bold mb-3">Notification Preferences</h4>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">New Quest Notifications</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Receive notifications when new quests matching your skills are
                  posted.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationsForm.newQuests}
                    onChange={(e) =>
                      setNotificationsForm((prev: any) => ({
                        ...prev,
                        newQuests: e.target.checked
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Quest Application Notifications</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Receive notifications about your quest applications and when
                  someone applies to your quests.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationsForm.questApplications}
                    onChange={(e) =>
                      setNotificationsForm((prev: any) => ({
                        ...prev,
                        questApplications: e.target.checked
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Guild Announcements</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Receive notifications about announcements from guilds you've
                  joined.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationsForm.guildAnnouncements}
                    onChange={(e) =>
                      setNotificationsForm((prev: any) => ({
                        ...prev,
                        guildAnnouncements: e.target.checked
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Direct Messages</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Receive notifications when someone sends you a direct message.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationsForm.directMessages}
                    onChange={(e) =>
                      setNotificationsForm((prev: any) => ({
                        ...prev,
                        directMessages: e.target.checked
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h5 className="font-medium">Weekly Newsletter</h5>
                <p className="text-sm text-[#F4F0E6]/70 mt-1">
                  Receive our weekly newsletter with featured quests, guilds, and
                  tavern updates.
                </p>
              </div>
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationsForm.newsletter}
                    onChange={(e) =>
                      setNotificationsForm((prev: any) => ({
                        ...prev,
                        newsletter: e.target.checked
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-[#2C1A1D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B75AA]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={saveNotificationSettings}
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
