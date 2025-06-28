"use client"

import { useState } from "react"
import { Star, Menu, X, User, Settings, LogOut, Shield, Search, Bell, MessageSquare, Plus } from "lucide-react"
import { Notifications } from '@/components/notifications/notifications'

interface NavbarProps {
  currentUser: any
  setActiveSection: (section: string) => void
  handleLogout: () => void
  openAuthModal: () => void
  openGoldPurchaseModal: () => void
  openPostQuestModal: () => void
  openCreateGuildModal: () => void
}

export function Navbar({
  currentUser,
  setActiveSection,
  handleLogout,
  openAuthModal,
  openGoldPurchaseModal,
  openPostQuestModal,
  openCreateGuildModal,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(2)
  const [unreadNotifications, setUnreadNotifications] = useState(3)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const activeSection = "" // Declare the activeSection variable

  const handleNavigation = (section: string) => {
    setActiveSection(section)
    setMobileMenuOpen(false)
    // Close any open dropdowns when navigating
    setUserDropdownOpen(false)
    setNotificationsOpen(false)
    setQuickActionsOpen(false)
  }

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
            Home
          </button>
          <button
            onClick={() => handleNavigation("quest-board")}
            className={`uppercase ${
              activeSection === "quest-board"
                ? "text-[#CDAA7D] border-b-2 border-[#CDAA7D]"
                : "text-[#F4F0E6] hover:text-[#CDAA7D]"
            }`}
          >
            Quest Board
          </button>
          <button
            onClick={() => handleNavigation("guild-hall")}
            className={`uppercase ${
              activeSection === "guild-hall"
                ? "text-[#CDAA7D] border-b-2 border-[#CDAA7D]"
                : "text-[#F4F0E6] hover:text-[#CDAA7D]"
            }`}
          >
            Guild Hall
          </button>
          <button
            onClick={() => handleNavigation("about")}
            className={`uppercase ${
              activeSection === "about"
                ? "text-[#CDAA7D] border-b-2 border-[#CDAA7D]"
                : "text-[#F4F0E6] hover:text-[#CDAA7D]"
            }`}
          >
            About
          </button>
        </div>

        <div className="flex items-center">
          {currentUser ? (
            <>
              <div className="hidden md:flex items-center space-x-2 mr-4">
                <div className="bg-[#CDAA7D]/10 px-3 py-1 rounded-full flex items-center">
                  <span className="text-[#CDAA7D] font-medium">{currentUser.gold} Gold</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openGoldPurchaseModal()
                    }}
                    className="ml-2 text-xs bg-[#CDAA7D] text-white px-2 py-0.5 rounded hover:bg-[#B89A6D] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => {
                      setQuickActionsOpen(!quickActionsOpen)
                      // Close other menus
                      setUserDropdownOpen(false)
                      setNotificationsOpen(false)
                    }}
                    className="w-8 h-8 bg-[#CDAA7D] rounded-full flex items-center justify-center text-[#2C1A1D] hover:bg-[#B89A6D] transition-colors"
                  >
                    <Plus size={18} />
                  </button>

                  {quickActionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={() => {
                          setQuickActionsOpen(false)
                          openPostQuestModal()
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Plus size={16} className="mr-2" />
                        Post a Quest
                      </button>
                      <button
                        onClick={() => {
                          setQuickActionsOpen(false)
                          openCreateGuildModal()
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Plus size={16} className="mr-2" />
                        Create a Guild
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleNavigation("search")}
                  className="text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={() => handleNavigation("messages")}
                  className="text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors relative"
                >
                  <MessageSquare size={20} />
                  {unreadMessages > 0 && (
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
                    <div className="w-8 h-8 bg-[#8B75AA] rounded-full flex items-center justify-center text-white">
                      {currentUser.avatar
                        ? currentUser.avatar
                        : currentUser.username?.[0]?.toUpperCase() || "H"}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-[#2C1A1D]">{currentUser.username}</p>
                        <p className="text-xs text-[#2C1A1D]/60">Level {currentUser.level}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleNavigation("profile")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <User size={16} className="mr-2" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          handleNavigation("quest-management")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Search size={16} className="mr-2" />
                        Quest Management
                      </button>
                      <button
                        onClick={() => {
                          handleNavigation("guild-management")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Search size={16} className="mr-2" />
                        Guild Management
                      </button>
                      <button
                        onClick={() => {
                          handleNavigation("settings")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                      >
                        <Settings size={16} className="mr-2" />
                        Settings
                      </button>
                      {currentUser.roles && currentUser.roles.includes("admin") && (
                        <button
                          onClick={() => {
                            handleNavigation("admin")
                            setUserDropdownOpen(false)
                          }}
                          className="flex items-center px-4 py-2 text-sm text-[#2C1A1D] hover:bg-[#F4F0E6] w-full text-left"
                        >
                          <Shield size={16} className="mr-2" />
                          Admin Panel
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:block">
              <button
                onClick={openAuthModal}
                className="bg-[#CDAA7D] text-[#2C1A1D] px-4 py-2 rounded hover:bg-[#B8941F] transition-colors uppercase font-medium"
              >
                Enter Tavern
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {currentUser && (
              <div className="flex items-center mr-4">
                <div className="bg-[#CDAA7D]/10 px-2 py-1 rounded-full flex items-center">
                  <span className="text-[#CDAA7D] text-sm font-medium">{currentUser.gold}</span>
                  <button
                    onClick={openGoldPurchaseModal}
                    className="ml-1 text-xs bg-[#CDAA7D] text-white px-1.5 py-0.5 rounded hover:bg-[#B89A6D] transition-colors"
                  >
                    +
                  </button>
                </div>
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
              Home
            </button>
            <button
              onClick={() => handleNavigation("quest-board")}
              className="text-left py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors uppercase"
            >
              Quest Board
            </button>
            <button
              onClick={() => handleNavigation("guild-hall")}
              className="text-left py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors uppercase"
            >
              Guild Hall
            </button>
            <button
              onClick={() => handleNavigation("about")}
              className="text-left py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors uppercase"
            >
              About
            </button>

            {currentUser ? (
              <>
                <div className="border-t border-[#CDAA7D]/30 pt-2 mt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      openPostQuestModal()
                    }}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Plus size={16} className="mr-2" />
                    Post a Quest
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      openCreateGuildModal()
                    }}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Plus size={16} className="mr-2" />
                    Create a Guild
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
                    )}
                  </button>
                  <button
                    onClick={() => handleNavigation("profile")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={() => handleNavigation("quest-management")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Search size={16} className="mr-2" />
                    Quest Management
                  </button>
                  <button
                    onClick={() => handleNavigation("guild-management")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Search size={16} className="mr-2" />
                    Guild Management
                  </button>
                  <button
                    onClick={() => handleNavigation("settings")}
                    className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  {currentUser.roles && currentUser.roles.includes("admin") && (
                    <button
                      onClick={() => handleNavigation("admin")}
                      className="flex items-center py-2 text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors w-full text-left"
                    >
                      <Shield size={16} className="mr-2" />
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center py-2 text-red-400 hover:text-red-300 transition-colors w-full text-left"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
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
                Enter Tavern
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notifications dropdown */}
      {notificationsOpen && (
        <div className="absolute right-4 md:right-24 top-16 w-80 bg-white rounded-md shadow-lg py-1 z-50">
          <Notifications
            currentUser={currentUser}
            onClose={() => setNotificationsOpen(false)}
            setActiveSection={handleNavigation}
          />
        </div>
      )}
    </nav>
  )
}
