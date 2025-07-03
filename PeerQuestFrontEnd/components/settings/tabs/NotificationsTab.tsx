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
          <div>
            <label className="block text-sm font-medium mb-2">
              New Quest Notifications
            </label>
            <input
              type="checkbox"
              checked={notificationsForm.newQuests}
              onChange={(e) =>
                setNotificationsForm((prev: any) => ({
                  ...prev,
                  newQuests: e.target.checked
                }))
              }
              className="shadow-sm"
            />{" "}
            Receive notifications for new quests
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Quest Application Notifications
            </label>
            <input
              type="checkbox"
              checked={notificationsForm.questApplications}
              onChange={(e) =>
                setNotificationsForm((prev: any) => ({
                  ...prev,
                  questApplications: e.target.checked
                }))
              }
              className="shadow-sm"
            />{" "}
            Receive notifications for quest applications
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Guild Announcements
            </label>
            <input
              type="checkbox"
              checked={notificationsForm.guildAnnouncements}
              onChange={(e) =>
                setNotificationsForm((prev: any) => ({
                  ...prev,
                  guildAnnouncements: e.target.checked
                }))
              }
              className="shadow-sm"
            />{" "}
            Receive notifications for guild announcements
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Direct Messages
            </label>
            <input
              type="checkbox"
              checked={notificationsForm.directMessages}
              onChange={(e) =>
                setNotificationsForm((prev: any) => ({
                  ...prev,
                  directMessages: e.target.checked
                }))
              }
              className="shadow-sm"
            />{" "}
            Receive notifications for direct messages
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Newsletter
            </label>
            <input
              type="checkbox"
              checked={notificationsForm.newsletter}
              onChange={(e) =>
                setNotificationsForm((prev: any) => ({
                  ...prev,
                  newsletter: e.target.checked
                }))
              }
              className="shadow-sm"
            />{" "}
            Receive our newsletter
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
