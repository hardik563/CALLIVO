import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Video,
  Calendar,
  Users,
  MessageSquare,
  Film,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Avatar } from '../components/ui/Avatar';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';

export const MobileSidebarDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/meetings', label: 'Meetings', icon: Video },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/recordings', label: 'Recordings', icon: Film },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help & Docs', icon: HelpCircle },
  ];

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-4/5 max-w-xs h-full bg-surface border-r border-slate-700/80 shadow-2xl flex flex-col justify-between z-10"
          >
            {/* Top Bar */}
            <div>
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                <Logo size="md" showTagline={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Bottom Profile & Sign Out */}
            <div className="p-4 border-t border-slate-800 bg-surface-elevated/40 space-y-3">
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Avatar
                  name={user?.name || 'User'}
                  src={user?.avatar}
                  size="md"
                  status={user?.status}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
