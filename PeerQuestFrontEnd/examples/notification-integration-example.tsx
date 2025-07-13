// Example of how to integrate the notification system into your main app layout

import { NotificationProvider } from '@/context/notification-context';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

// In your main layout or app component:
export function AppLayout({ children, currentUser }: { children: React.ReactNode; currentUser: any }) {
  return (
    <NotificationProvider currentUser={currentUser}>
      <div className="min-h-screen bg-gray-50">
        {/* Header/Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and navigation */}
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-[#2C1A1D]">PeerQuest Tavern</h1>
                {/* Add your navigation items here */}
              </div>

              {/* Right side - User menu and notifications */}
              <div className="flex items-center gap-4">
                {currentUser && (
                  <>
                    {/* Notification dropdown */}
                    <NotificationDropdown currentUser={currentUser} />
                    
                    {/* User menu */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#8B75AA]">Welcome, {currentUser.username}</span>
                      {/* Add user menu dropdown here */}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}

// Usage example:
// <AppLayout currentUser={currentUser}>
//   <AdminPanel />
// </AppLayout>
