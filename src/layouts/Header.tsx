import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Video, Menu, User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Avatar } from '../components/ui/Avatar';
import { useUiStore } from '../stores/uiStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useMeetingStore } from '../stores/meetingStore';
import { useAuthStore } from '../stores/authStore';
import { generateMeetingId } from '../lib/utils';
import { meetingsApi } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { setGlobalSearchOpen, setMobileMenuOpen } = useUiStore();
  const { notifications, setDrawerOpen, isDrawerOpen } = useNotificationStore();
  const { setActiveMeeting } = useMeetingStore();
  const { user, logout } = useAuthStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartInstantMeeting = async () => {
    try {
      const res = await meetingsApi.create({
        title: 'Instant CALLIVO Session',
        waitingRoom: false,
      });
      if (res.success && res.meeting) {
        setActiveMeeting({
          id: res.meeting.id,
          title: res.meeting.title,
          passcode: res.meeting.passcode,
          isHost: true,
        });
        navigate(`/room/${res.meeting.id}`);
        return;
      }
    } catch (err) {
      console.warn('Instant meeting notice:', err);
    }
    const id = generateMeetingId();
    setActiveMeeting({
      id,
      title: 'Instant CALLIVO Session',
      isHost: true,
    });
    navigate(`/room/${id}`);
  };

  const handleSignOut = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 sticky top-0 bg-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-20">
      {/* Left: Mobile Menu Button & Quick Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl bg-surface-elevated text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar Trigger */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-surface-elevated/70 border border-slate-200 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-150 w-44 sm:w-64 md:w-72 text-left"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">Search meetings, contacts...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-slate-200 dark:border-slate-700/60">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Theme Switcher */}
        <ThemeToggle className="hidden sm:inline-flex" />

        {/* Notifications Center Toggle */}
        <button
          onClick={() => setDrawerOpen(!isDrawerOpen)}
          className="relative p-2 rounded-xl bg-surface-elevated/80 border border-slate-200 dark:border-slate-700/60 hover:bg-surface-hover text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-background animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Instant Meeting Action */}
        <Button
          variant="glow"
          size="sm"
          onClick={handleStartInstantMeeting}
          leftIcon={<Video className="w-3.5 h-3.5" />}
          className="text-xs shadow-glow-sm"
        >
          <span className="hidden sm:inline">Start Meeting</span>
          <span className="sm:hidden">Start</span>
        </Button>

        {/* User Profile & Sign Out Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-surface-elevated border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all focus:outline-none"
            title="User Profile Menu"
          >
            <Avatar
              name={user?.name || 'User'}
              src={user?.avatar}
              size="sm"
              status={user?.status}
            />
            <div className="hidden lg:block text-left max-w-[120px]">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || 'Account'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Interactive User Menu Popover */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-elevated/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50 animate-fade-in text-xs">
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs truncate mt-0.5">
                  {user?.email || ''}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20 capitalize">
                  {user?.role || 'Active Member'}
                </span>
              </div>

              {/* Menu Links */}
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-surface-hover hover:text-brand-400 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-surface-hover hover:text-brand-400 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>

                <Link
                  to="/help"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-surface-hover hover:text-brand-400 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Help & Support</span>
                </Link>
              </div>

              {/* Sign Out Action */}
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
