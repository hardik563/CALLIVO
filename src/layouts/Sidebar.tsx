import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Calendar,
  Users,
  MessageSquare,
  Film,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Avatar } from '../components/ui/Avatar';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { cn } from '../lib/utils';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/meetings', label: 'Meetings', icon: Video },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/recordings', label: 'Recordings', icon: Film },
  ];

  const bottomNavItems = [
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help & Docs', icon: HelpCircle },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-surface/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 transition-all duration-300 z-30 select-none',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800/80">
        <Logo size={sidebarCollapsed ? 'sm' : 'md'} showTagline={!sidebarCollapsed} />
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-surface-elevated transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className={cn('px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500', sidebarCollapsed && 'sr-only')}>
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-surface-elevated/70'
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}

        <div className={cn('pt-6 px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500', sidebarCollapsed && 'sr-only')}>
          Preferences
        </div>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-surface-elevated/70'
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* User Card at Bottom (Driven by user state) */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-surface-elevated/30">
        <div
          onClick={() => navigate('/profile')}
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer group',
            sidebarCollapsed && 'justify-center p-1.5'
          )}
          title="View & Edit Profile"
        >
          <Avatar
            name={user?.name || 'User'}
            src={user?.avatar}
            size="sm"
            status={user?.status}
          />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">
                {user?.role || 'Active Member'}
              </p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
                navigate('/login');
              }}
              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
