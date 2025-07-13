"use client"

import { useState, useEffect } from "react"
import { Star, Menu, X, User, Settings, LogOut, Shield, Search, Bell, MessageSquare, Plus, Loader2 } from "lucide-react"
import { Notifications } from '@/components/notifications/notifications'
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useRouter } from 'next/navigation';
import { useClickSound } from '@/hooks/use-click-sound';
import { useAudioContext } from '@/context/audio-context';
import QuestForm from '@/components/quests/quest-form'
import { GoldBalance } from '@/components/ui/gold-balance'

interface NavbarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  handleLogout: () => void
  openAuthModal: () => void
  openGoldPurchaseModal: () => void
  openPostQuestModal?: () => void
  openCreateGuildModal: () => void
  onQuestCreated?: () => void
}

export function Navbar({
  activeSection,
  setActiveSection,
  handleLogout,
  openAuthModal,
  openGoldPurchaseModal,
  openPostQuestModal,
  openCreateGuildModal,
  onQuestCreated,
}: Omit<NavbarProps, 'currentUser'>) {
  const { user: currentUser } = useAuth(); // Use context directly
  
  // Debug: Log user admin fields whenever user changes
  useEffect(() => {
    if (currentUser) {
      console.log('[Navbar] Current user admin fields:', JSON.stringify({
        is_staff: currentUser.is_staff,
        is_superuser: currentUser.is_superuser,
        isSuperuser: currentUser.isSuperuser,
        showAdminButton: !!(currentUser.is_staff || currentUser.isSuperuser || currentUser.is_superuser),
        userKeys: Object.keys(currentUser)
      }, null, 2));
    }
  }, [currentUser]);
  const { t } = useTranslation();
  // TEMPORARILY DISABLE ROUTER FOR DEBUGGING
  // const router = useRouter();
  const { soundEnabled, volume } = useAudioContext();
  const { playSound } = useClickSound({ enabled: soundEnabled, volume });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  // Robust avatar getter
  const getAvatar = (u: any) => {
    let avatar = u?.avatar || u?.avatar_url;
    if (!avatar && typeof u?.avatar_data === 'string' && u.avatar_data.startsWith('data:')) {
      avatar = u.avatar_data;
    }
    if (typeof avatar !== 'string' || !(avatar.startsWith('http') || avatar.startsWith('data:'))) {
      avatar = '/default-avatar.png';
    }
    return avatar;
  };

  const handleNavigation = (section: string) => {
    playSound('nav');
    if (
      section === "profile" ||
      section === "settings" ||
      section === "quest-management" ||
      section === "admin"
    ) {
      setActiveSection(section);
    } else if (section === "messages") {
      setActiveSection("messages");
      setLoadingMessages(false);
    } else if (section === "search") {
      setActiveSection("search");
    } else {
      setActiveSection(section);
    }
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotificationsOpen(false);
    setQuickActionsOpen(false);
  }

  // Reset loading state when route changes away from /messages
  useEffect(() => {
    if (!loadingMessages) return;
    const handleRouteChange = () => {
      setLoadingMessages(false);
    };
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [loadingMessages]);

  const handleOpenQuestForm = () => {
    setShowQuestForm(true)
    setQuickActionsOpen(false)
    setMobileMenuOpen(false)
  }

  const handleQuestFormSuccess = (quest: any) => {
    setShowQuestForm(false)
    // Call the callback to refresh quest board data silently
    if (onQuestCreated) {
      onQuestCreated()
    }
    // Don't navigate automatically - let user stay on current page
  }

  // Fetch notifications count from backend
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifications = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        console.warn('[Navbar] No access token found in localStorage. User may not be logged in.');
        setUnreadNotifications(0);
        return;
      }
      try {
        const res = await fetch(`/api/notifications-proxy`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.status === 401) {
          console.warn('[Navbar] Access token is invalid or expired. Logging out user.');
          setUnreadNotifications(0);
          // Optionally, call handleLogout() here if you want to auto-logout
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch notifications (status ${res.status})`);
        const data = await res.json();
        setUnreadNotifications(data.filter((n: any) => !n.read).length);
      } catch (err) {
        console.error('[Navbar] Failed to fetch notifications:', err);
        setUnreadNotifications(0);
      }
    };
    fetchNotifications();
  }, [currentUser]);

  return (
    <nav className="bg-[#2C1A1D] text-[#F4F0E6] px-6 py-4 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => handleNavigation("home")}>
          <Star size={24} className="text-[#CDAA7D] mr-2" />
          <div className="text-lg font-bold">PeerQuest Tavern</div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => handleNavigation("home")}
            className={`uppercase ${
              activeSection === "home"
                ? "text-[#CDAA7D] border-b-2 border-[#CDAA7D]"
                : "text-[#F4F0E6] hover:text-[#CDAA7D]"
            }`}
          >
            {t('navbar.home')}
          </button>
          <button
            onClick={() => handleNavigation("quest-board")}
            className={`uppercase ${
              activeSection === "quest-board"
                ? "text-[#CDAA7D] border-b-2 border-[#CDAA7D]"
                : "text-[#F4F0E6] hover:text-[#CDAA7D]"
            }`}
          >
            {t('navbar.questBoard')}
          </button>
          <button
            onClick={() => handleNavigation("guild-hall")}
            className={`uppercase ${
              activeSection === "guild-hall"
                ? "text-[#CDAA7D] border-b-2 border-[#CDAA7D]"
                : "text-[#F4F0E6] hover:text-[#CDAA7D]"
            }`}
          >
            {t('navbar.guildHall')}
          </button>
          <button
            onClick={() => handleNavigation("about")}
            className={`uppercase ${
              activeSection === "about"
                ? "text-[#CDAA7D] border-b-2 border-[#CDAA7D]"
                : "text-[#F4F0E6] hover:text-[#CDAA7D]"
            }`}
          >
            {t('navbar.about')}
          </button>
        </div>

        <div className="flex items-center">
          {currentUser ? (
            <>
              <div className="hidden md:flex items-center space-x-2 mr-4">
                <div onClick={(e) => {
                  // Prevent any event bubbling from GoldBalance to navbar
                  e.stopPropagation();
                }}>
                  <GoldBalance openGoldPurchaseModal={openGoldPurchaseModal} />
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-4">
                <LanguageSwitcher />
                <div className="relative">
                  <button
                    onClick={() => {
                      setQuickActionsOpen(!quickActionsOpen)
                      // Close other menus
                      setUserDropdownOpen(false)
                      setNotificationsOpen(false)
                    }}
                    className="w-8 h-8 bg-[#CDAA7D] rounded-full flex items-center justify-center text-[#2C1A1D] hover:bg-[#B89A6D] transition-colors"
                    aria-label="Open quick actions menu"
                  >
                    <Plus size={18} />
                  </button>

                  {quickActionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={handleOpenQuestForm}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Plus size={16} className="mr-2" />
                        {t('navbar.postQuest')}
                      </button>
                      <button
                        onClick={() => {
                          setQuickActionsOpen(false);
                          console.log('Create a Guild button pressed!');
                          if (typeof openCreateGuildModal === 'function') {
                            openCreateGuildModal();
                          } else {
                            alert('Create Guild modal function is not available.');
                          }
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Plus size={16} className="mr-2" />
                        {t('navbar.createGuild')}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleNavigation("search")}
                  className="text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={() => handleNavigation("messages")}
                  className="text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors relative"
                  disabled={loadingMessages}
                >
                  {loadingMessages ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <MessageSquare size={20} />
                  )}
                  {unreadMessages > 0 && !loadingMessages && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen)
                      // Close notifications if open
                      if (notificationsOpen) setNotificationsOpen(false)
                      if (quickActionsOpen) setQuickActionsOpen(false)
                    }}
                    className="flex items-center focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center text-white overflow-hidden">
                      {(() => {
                        const avatar = getAvatar(currentUser);
                        if ((avatar.startsWith('http') || avatar.startsWith('data:')) && !avatarError) {
                          return (
                            <img
                              src={avatar}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={() => setAvatarError(true)}
                            />
                          );
                        }
                        return (
                          <span className="text-white select-none">
                            {currentUser.username?.[0]?.toUpperCase() || "👤"}
                          </span>
                        );
                      })()}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-[#2C1A1D]">{currentUser.username}</p>
                        <p className="text-xs text-[#2C1A1D]/60">{t('navbar.level')} {(currentUser as any).level || 1}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleNavigation("profile");
                          setUserDropdownOpen(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <User size={16} className="mr-2" />
                        {t('navbar.profile')}
                      </button>
                      <button
                        onClick={() => {
                          handleNavigation("quest-management")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Search size={16} className="mr-2" />
                        {t('navbar.questManagement')}
                      </button>
                      <button
                        onClick={() => {
                          handleNavigation("guild-management")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Search size={16} className="mr-2" />
                        {t('navbar.guildManagement')}
                      </button>
                      <button
                        onClick={() => {
                          handleNavigation("settings")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Settings size={16} className="mr-2" />
                        {t('navbar.settings')}
                      </button>
                      {/* Debug box removed */}
                      {currentUser && (currentUser.is_staff || currentUser.isSuperuser || currentUser.is_superuser) && (
                        <button
                          onClick={() => {
                            handleNavigation("admin")
                            setUserDropdownOpen(false)
                          }}
                          className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                        >
                          <Shield size={16} className="mr-2" />
                          {t('navbar.adminPanel')}
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={16} className="mr-2" />
                        {t('navbar.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={() => {
                  playSound('button');
                  openAuthModal();
                }}
                className="bg-[#CDAA7D] text-[#2C1A1D] px-4 py-2 rounded hover:bg-[#B8941F] transition-colors uppercase font-medium"
              >
                {t('navbar.enterTavern')}
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
          {/* Hide gold button for banned users (user should never be set if banned, but double check) */}
          {currentUser && !currentUser.isBanned && (
            <div className="flex items-center mr-4">
              <GoldBalance openGoldPurchaseModal={openGoldPurchaseModal} />
            </div>
          )}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
                // Close other menus
                setUserDropdownOpen(false)
                setNotificationsOpen(false)
                setQuickActionsOpen(false)
              }}
              className="text-[#F4F0E6] hover:text-[#CDAA7D] focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#2C1A1D] border-t border-[#CDAA7D]/30 mt-4">
          <div className="flex flex-col p-4 space-y-2">
            <button
              onClick={() => handleNavigation("home")}
              className="text-left py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors uppercase"
            >
              {t('navbar.home')}
            </button>
            <button
              onClick={() => handleNavigation("quest-board")}
              className="text-left py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors uppercase"
            >
              {t('navbar.questBoard')}
            </button>
            <button
              onClick={() => handleNavigation("guild-hall")}
              className="text-left py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors uppercase"
            >
              {t('navbar.guildHall')}
            </button>
            <button
              onClick={() => handleNavigation("about")}
              className="text-left py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors uppercase"
            >
              {t('navbar.about')}
            </button>

            {currentUser ? (
              <>
                <div className="border-t border-[#CDAA7D]/30 pt-2 mt-2">
                  <button
                    onClick={handleOpenQuestForm}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Plus size={16} className="mr-2" />
                    {t('navbar.postQuest')}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      openCreateGuildModal()
                    }}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Plus size={16} className="mr-2" />
                    {t('navbar.createGuild')}
                  </button>
                  <button
                    onClick={() => handleNavigation("search")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Search size={16} className="mr-2" />
                    Search Users
                  </button>
                  <button
                    onClick={() => handleNavigation("messages")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Messages
                    {unreadMessages > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">{unreadMessages}</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen)
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Bell size={16} className="mr-2" />
                    Notifications
                    {unreadNotifications > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                        {unreadNotifications}
                      </span>
                    )}                </button>
                {/* Gold balance for mobile view */}
                <div className="py-2 text-[#CDAA7D] font-medium flex items-center w-full">
                  <GoldBalance openGoldPurchaseModal={openGoldPurchaseModal} />
                </div>
                <button
                  onClick={() => handleNavigation("profile")}
                  className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                >
                  <User size={16} className="mr-2" />
                  {t('navbar.profile')}
                </button>
                  <button
                    onClick={() => handleNavigation("quest-management")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Search size={16} className="mr-2" />
                    {t('navbar.questManagement')}
                  </button>
                  <button
                    onClick={() => handleNavigation("guild-management")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Search size={16} className="mr-2" />
                    {t('navbar.guildManagement')}
                  </button>
                  <button
                    onClick={() => handleNavigation("settings")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Settings size={16} className="mr-2" />
                    {t('navbar.settings')}
                  </button>
                  {currentUser && (currentUser.is_staff || currentUser.isSuperuser || currentUser.is_superuser) && (
                    <button
                      onClick={() => handleNavigation("admin")}
                      className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                    >
                      <Shield size={16} className="mr-2" />
                      {t('navbar.adminPanel')}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center py-2 text-red-400 hover:text-red-300 transition-colors w-full text-left"
                  >
                    <LogOut size={16} className="mr-2" />
                    {t('navbar.logout')}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  openAuthModal()
                  setMobileMenuOpen(false)
                }}
                className="mt-2 bg-[#CDAA7D] text-[#2C1A1D] px-4 py-2 rounded hover:bg-[#B8941F] transition-colors uppercase font-medium w-full"
              >
                {t('navbar.enterTavern')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notifications dropdown */}
      {notificationsOpen && typeof window !== 'undefined' && (
        <div className="absolute right-4 md:right-24 top-16 w-80 bg-white rounded-md shadow-lg py-1 z-50">
          <Notifications
            currentUser={currentUser}
            onClose={() => setNotificationsOpen(false)}
          />
        </div>
      )}

      {/* Quest Form Modal */}
      {typeof window !== 'undefined' && (
        <QuestForm
          quest={null}
          isOpen={showQuestForm}
          onClose={() => {
            setShowQuestForm(false)
          }}
          onSuccess={handleQuestFormSuccess}
          isEditing={false}
          currentUser={currentUser}
        />
      )}
    </nav>
  )
}

